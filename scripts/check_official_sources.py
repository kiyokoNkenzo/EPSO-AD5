#!/usr/bin/env python3
"""Check that the official sources cited by the app still work and still say what the app claims.

Two checks run against the live web:

* Links: every https URL in src/, content/ and README.md must resolve. URLs on a
  retired host (EPSO moved from eu-careers.europa.eu to
  selection.eu-careers.europa.eu in 2026) fail even if they happen to redirect.
* Claims: content/official-source-claims.json lists the exact phrases the app
  relies on. A missing phrase, or a new entry under "Latest updates" on the
  competition page, means EPSO changed something and the app data needs review.

Exit status is 1 when a link fails or a claim changed, so a scheduled CI job turns
red. Hosts behind bot protection that answer scripted requests with a challenge are
reported as inconclusive instead of failing. Uses only the standard library;
PDF claims need `pdftotext` (poppler-utils) and are skipped with a warning without it.
"""

from __future__ import annotations

import argparse
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
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CLAIMS_PATH = ROOT / "content" / "official-source-claims.json"
SCAN_TARGETS = ("src", "content", "README.md")
SCAN_SUFFIXES = {".ts", ".tsx", ".json", ".md"}
URL_PATTERN = re.compile(r"https://[^\s\"'`<>()\[\]{}\\]+")
RETIRED_HOSTS = {"eu-careers.europa.eu": "selection.eu-careers.europa.eu"}
CHALLENGE_STATUSES = {"eur-lex.europa.eu": {202, 403}, "www.consilium.europa.eu": {403}}
PLACEHOLDER_HOSTS = {"example.test", "study.example.com", "localhost"}
USER_AGENT = "EPSO-AD5-Study-Companion source check (+https://github.com/kiyokoNkenzo/EPSO-AD5)"
LATEST_UPDATE = re.compile(r"latest updates\s+(\d{2}/\d{2}/\d{4})\s*-\s*(.+?)(?=\s+\d{2}/\d{2}/\d{4}\s*-|\s+prepare for|$)")


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


def normalize(text: str) -> str:
    """Lower-case text with typographic variants and whitespace runs collapsed."""
    text = html.unescape(text)
    for source, target in {" ": " ", "’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-"}.items():
        text = text.replace(source, target)
    return re.sub(r"\s+", " ", text).strip().lower()


def html_to_text(body: bytes) -> str:
    markup = body.decode("utf-8", errors="replace")
    markup = re.sub(r"(?is)<(script|style|noscript|svg)\b.*?</\1>", " ", markup)
    markup = re.sub(r"(?s)<[^>]+>", " ", markup)
    return normalize(markup)


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
        expected = claim.get("latestUpdate")
        if expected:
            match = LATEST_UPDATE.search(text)
            current = f"{match.group(1)} - {match.group(2)}" if match else None
            if current is None:
                findings.append(Finding("change", subject, "Could not find the “Latest updates” list."))
            elif current != normalize(expected):
                findings.append(Finding("change", subject, f"New EPSO update: “{current}” (last reviewed: “{expected}”)."))
        if not missing and (not expected or (match and current == normalize(expected))):
            findings.append(Finding("ok", subject, "All claimed phrases present"))
    return findings


def render_report(findings: list[Finding], checked_at: str) -> str:
    counts = {level: sum(1 for finding in findings if finding.level == level) for level in ("fail", "change", "warn", "ok")}
    lines = [
        "# Official source check",
        "",
        f"Run {checked_at}: {counts['fail']} failed, {counts['change']} changed, {counts['warn']} inconclusive, {counts['ok']} OK.",
        "",
    ]
    labels = {"fail": "Failed", "change": "Changed on the official site", "warn": "Inconclusive"}
    for level, title in labels.items():
        rows = [finding for finding in findings if finding.level == level]
        if rows:
            lines += [f"## {title}", ""] + [f"- **{row.subject}**: {row.message}" for row in rows] + [""]
    if not counts["fail"] and not counts["change"]:
        lines.append("Everything the app cites still resolves and still says what the app claims.")
    return "\n".join(lines).rstrip() + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--report", type=Path, help="also write the Markdown report to this file")
    parser.add_argument("--claims-only", action="store_true", help="skip the link check")
    parser.add_argument("--timeout", type=float, default=30, help="seconds per request")
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
    return 1 if any(finding.level in {"fail", "change"} for finding in findings) else 0


if __name__ == "__main__":
    sys.exit(main())
