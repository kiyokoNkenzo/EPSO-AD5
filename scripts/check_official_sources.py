#!/usr/bin/env python3
"""Check that the official sources cited by the app still work and still say what the app claims.

Two checks run against the live web:

* Links: every https URL in src/, content/ and README.md must resolve. URLs on a
  retired host (EPSO moved from eu-careers.europa.eu to
  selection.eu-careers.europa.eu in 2026) fail even if they happen to redirect.
* Claims: content/official-source-claims.json lists the exact phrases the app
  relies on. A missing phrase, or a new entry under "Latest updates" on the
  competition page, means EPSO changed something and the app data needs review.

Exit status is 1 when something needs review, unless --no-fail is given: the
scheduled workflow uses that, so an EPSO update opens a GitHub issue instead of
turning the job red. Hosts behind bot protection that answer scripted requests with a
challenge are reported as inconclusive. Uses only the standard library;
PDF claims need `pdftotext` (poppler-utils) and are skipped with a warning without it.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
CLAIMS_PATH = ROOT / "content" / "official-source-claims.json"
SCAN_TARGETS = ("src", "content", "README.md")
SCAN_SUFFIXES = {".ts", ".tsx", ".json", ".md"}
URL_PATTERN = re.compile(r"https://[^\s\"'`<>()\[\]{}\\]+")
RETIRED_HOSTS = {"eu-careers.europa.eu": "selection.eu-careers.europa.eu"}
CHALLENGE_STATUSES = {"eur-lex.europa.eu": {202, 403}, "www.consilium.europa.eu": {403}}
PLACEHOLDER_HOSTS = {"example.test", "study.example.com", "localhost"}
USER_AGENT = "EPSO-AD5-Study-Companion source check (+https://github.com/kiyokoNkenzo/EPSO-AD5)"
UPDATE_ENTRY = re.compile(r"(\d{2}/\d{2}/\d{4})\s*-\s*(.+?)(?=\s+\d{2}/\d{2}/\d{4}\s*-|$)")


@dataclass(frozen=True)
class Response:
    status: int
    url: str
    content_type: str
    body: bytes


@dataclass(frozen=True)
class Finding:
    level: str  # "fail", "change", "warn" or "ok"
    subject: str
    message: str


Fetcher = Callable[[str], Response]


def collect_urls(root: Path = ROOT) -> dict[str, set[str]]:
    """Map each cited https URL to the files that cite it."""
    found: dict[str, set[str]] = {}
    for target in SCAN_TARGETS:
        path = root / target
        files = [path] if path.is_file() else sorted(p for p in path.rglob("*") if p.is_file())
        for file in files:
            if file.suffix not in SCAN_SUFFIXES or ".test." in file.name:
                continue
            for match in URL_PATTERN.finditer(file.read_text(encoding="utf-8", errors="replace")):
                url = match.group(0).rstrip(".,;:")
                host = urlsplit(url).hostname or ""
                # Skip template literals (`https://…/${id}` stops at "$"), placeholders such as "https://…" and example hosts.
                if url.endswith("$") or "." not in host or not url.isascii() or host in PLACEHOLDER_HOSTS or host.endswith(".example.com"):
                    continue
                found.setdefault(url, set()).add(str(file.relative_to(root)))
    return found


def fetch(url: str, timeout: float = 30, attempts: int = 3) -> Response:
    """GET a URL, following redirects; network errors and 5xx answers are retried."""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "en"})
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as reply:
                return Response(reply.status, reply.geturl(), reply.headers.get("Content-Type", ""), reply.read())
        except urllib.error.HTTPError as error:
            if error.code < 500 or attempt == attempts - 1:
                return Response(error.code, error.geturl() or url, error.headers.get("Content-Type", "") if error.headers else "", error.read() or b"")
            last_error = error
        except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
            last_error = error
        time.sleep(2 ** attempt)
    raise ConnectionError(f"{url}: {last_error}")


TYPOGRAPHIC = {"\u00a0": " ", "\u2019": "'", "\u2018": "'", "\u201c": '"', "\u201d": '"', "\u2013": "-", "\u2014": "-"}


def clean(text: str) -> str:
    """Text with entities decoded, typographic variants unified and whitespace collapsed."""
    text = html.unescape(text)
    for source, target in TYPOGRAPHIC.items():
        text = text.replace(source, target)
    return re.sub(r"\s+", " ", text).strip()


def normalize(text: str) -> str:
    """Case-insensitive form of clean() used for phrase matching."""
    return clean(text).lower()


def html_to_display_text(body: bytes) -> str:
    markup = body.decode("utf-8", errors="replace")
    markup = re.sub(r"(?is)<(script|style|noscript|svg)\b.*?</\1>", " ", markup)
    # Inline formatting must not split words from punctuation: "<strong>19 October</strong>," stays "19 October,".
    markup = re.sub(r"(?is)</?(?:strong|em|b|i|u|span|a|abbr|mark|small|sup|sub)\b[^>]*>", "", markup)
    return clean(re.sub(r"(?s)<[^>]+>", " ", markup))


def html_to_text(body: bytes) -> str:
    return html_to_display_text(body).lower()


def parse_latest_updates(display_text: str) -> list[tuple[str, str]]:
    """The (date, title) entries of an EU Careers "Latest updates" list, newest first."""
    lowered = display_text.lower()
    start = lowered.find("latest updates")
    if start < 0:
        return []
    end = lowered.find("prepare for", start)
    segment = display_text[start + len("latest updates"): end if end > 0 else None]
    return [(match.group(1), match.group(2).strip()) for match in UPDATE_ENTRY.finditer(segment)]


def link_for(raw_html: str, title: str, base_url: str) -> str | None:
    """Absolute URL of the first link whose text matches `title`."""
    for match in re.finditer(r'(?is)<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', raw_html):
        if normalize(re.sub(r"(?s)<[^>]+>", " ", match.group(2))) == normalize(title):
            return urljoin(base_url, html.unescape(match.group(1)))
    return None


def pdf_to_text(body: bytes) -> str | None:
    executable = shutil.which("pdftotext")
    if not executable:
        return None
    result = subprocess.run([executable, "-enc", "UTF-8", "-", "-"], input=body, capture_output=True, check=False, timeout=60)
    return normalize(result.stdout.decode("utf-8", errors="replace")) if result.returncode == 0 else None


def check_links(urls: dict[str, set[str]], fetcher: Fetcher) -> list[Finding]:
    findings: list[Finding] = []
    for url in sorted(urls):
        cited_in = ", ".join(sorted(urls[url]))
        host = urlsplit(url).hostname or ""
        if host in RETIRED_HOSTS:
            findings.append(Finding("fail", url, f"Retired host; use {RETIRED_HOSTS[host]} ({cited_in})"))
            continue
        try:
            response = fetcher(url)
        except ConnectionError as error:
            findings.append(Finding("warn", url, f"Unreachable from this network: {error}"))
            continue
        if 200 <= response.status < 300 and response.status not in CHALLENGE_STATUSES.get(host, set()):
            findings.append(Finding("ok", url, f"HTTP {response.status}"))
        elif response.status in CHALLENGE_STATUSES.get(host, set()):
            findings.append(Finding("warn", url, f"HTTP {response.status} bot challenge; open it in a browser to confirm"))
        else:
            findings.append(Finding("fail", url, f"HTTP {response.status} ({cited_in})"))
    return findings


def check_claims(claims: Iterable[dict], fetcher: Fetcher, pdf_reader: Callable[[bytes], str | None] = pdf_to_text) -> list[Finding]:
    findings: list[Finding] = []
    for claim in claims:
        subject = claim["id"]
        try:
            response = fetcher(claim["url"])
        except ConnectionError as error:
            findings.append(Finding("warn", subject, f"Unreachable from this network: {error}"))
            continue
        if not 200 <= response.status < 300:
            findings.append(Finding("fail", subject, f"HTTP {response.status} for {claim['url']}"))
            continue
        is_pdf = "pdf" in response.content_type.lower() or claim["url"].lower().endswith(".pdf")
        text = pdf_reader(response.body) if is_pdf else html_to_text(response.body)
        if text is None:
            findings.append(Finding("warn", subject, "PDF text not checked (install poppler-utils for pdftotext)"))
            continue
        raw = response.body.decode("utf-8", errors="replace")
        missing = [phrase for phrase in claim.get("mustContain", []) if normalize(phrase) not in text]
        missing += [f"link {target}" for target in claim.get("mustLinkTo", []) if target not in raw]
        for phrase in missing:
            findings.append(Finding("change", subject, f"No longer contains: “{phrase}”. Review {claim.get('appUses', 'the app data')}."))
        updates_changed = False
        expected = claim.get("latestUpdate")
        if expected and not is_pdf:
            entries = parse_latest_updates(html_to_display_text(response.body))
            reviewed = [index for index, (date, title) in enumerate(entries) if normalize(f"{date} - {title}") == normalize(expected)]
            # Everything above the last reviewed entry is new; without it, report only the newest.
            new_entries = entries[: reviewed[0]] if reviewed else entries[:1]
            if not entries:
                updates_changed = True
                findings.append(Finding("change", subject, "Could not find the “Latest updates” list."))
            for date, title in new_entries:
                updates_changed = True
                url = link_for(raw, title, response.url or claim["url"])
                findings.append(Finding("change", subject, f"New EPSO update {date}: “{title}”{f' {url}' if url else ''}"))
        if not missing and not updates_changed:
            findings.append(Finding("ok", subject, "All claimed phrases present"))
    return findings


def needs_review(findings: list[Finding]) -> bool:
    return any(finding.level in {"fail", "change"} for finding in findings)


def fingerprint(findings: list[Finding]) -> str:
    """Stable id of what needs review, so the same change is reported only once."""
    keys = sorted(f"{finding.level}|{finding.subject}|{finding.message}" for finding in findings if finding.level in {"fail", "change"})
    return hashlib.sha256("\n".join(keys).encode("utf-8")).hexdigest()[:16]


def render_report(findings: list[Finding], checked_at: str) -> str:
    counts = {level: sum(1 for finding in findings if finding.level == level) for level in ("fail", "change", "warn", "ok")}
    lines = [
        "# Official source check",
        "",
        f"Run {checked_at}: {counts['fail']} failed, {counts['change']} changed, {counts['warn']} inconclusive, {counts['ok']} OK.",
        "",
    ]
    if needs_review(findings):
        lines += [
            "**To do:** read the linked EPSO pages, update `src/data` if the app's facts changed, then record the new wording or "
            "latest update in `content/official-source-claims.json`. The next check closes this issue by itself once everything matches.",
            "",
        ]
    labels = {"fail": "Failed", "change": "Changed on the official site", "warn": "Inconclusive"}
    for level, title in labels.items():
        rows = [finding for finding in findings if finding.level == level]
        if rows:
            lines += [f"## {title}", ""] + [f"- **{row.subject}**: {row.message}" for row in rows] + [""]
    if needs_review(findings):
        lines += [f"<!-- source-check-fingerprint: {fingerprint(findings)} -->"]
    else:
        lines.append("Everything the app cites still resolves and still says what the app claims.")
    return "\n".join(lines).rstrip() + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--report", type=Path, help="also write the Markdown report to this file")
    parser.add_argument("--claims-only", action="store_true", help="skip the link check")
    parser.add_argument("--timeout", type=float, default=30, help="seconds per request")
    parser.add_argument("--no-fail", action="store_true", help="exit 0 even when something needs review (for scheduled jobs)")
    args = parser.parse_args(argv)

    cache: dict[str, Response] = {}

    def cached_fetch(url: str) -> Response:
        if url not in cache:
            cache[url] = fetch(url, timeout=args.timeout)
        return cache[url]

    claims = json.loads(CLAIMS_PATH.read_text(encoding="utf-8"))
    findings = check_claims(claims["claims"], cached_fetch)
    if not args.claims_only:
        findings += check_links(collect_urls(), cached_fetch)

    report = render_report(findings, time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime()))
    print(report)
    if args.report:
        args.report.write_text(report, encoding="utf-8")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as handle:
            handle.write(report)
    review = needs_review(findings)
    outputs = os.environ.get("GITHUB_OUTPUT")
    if outputs:
        with open(outputs, "a", encoding="utf-8") as handle:
            handle.write(f"review_needed={'true' if review else 'false'}\nfingerprint={fingerprint(findings) if review else ''}\n")
    return 1 if review and not args.no_fail else 0


if __name__ == "__main__":
    sys.exit(main())
