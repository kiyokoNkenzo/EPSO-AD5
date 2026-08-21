#!/usr/bin/env python3
"""Build the sourced EPSO AD5 Phase 2 Anki deck and a TSV fallback.

The input is deliberately kept as reviewed JSON rather than being scraped during
the build.  A fixed package timestamp, stable model/deck identifiers, sorted cards,
and normalized ZIP metadata make repeated builds from identical input byte-for-byte
reproducible.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import tempfile
import zipfile
from pathlib import Path
from typing import Any, Iterable

try:
    import genanki
except ModuleNotFoundError as exc:  # pragma: no cover - exercised before the CLI can run
    raise SystemExit(
        "Missing build dependency genanki. Install the pinned builder with "
        "`python3 -m pip install genanki==0.13.1`, then run this script again."
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "content" / "phase2-cards.json"
DEFAULT_APKG = ROOT / "public" / "downloads" / "epso-ad5-phase2.apkg"
DEFAULT_TSV = ROOT / "public" / "downloads" / "epso-ad5-phase2.tsv"

# Do not change these after publication: Anki uses them to merge deck/model updates.
DECK_ID = 2_054_272_600
MODEL_ID = 2_054_272_601

# 2026-08-12 12:00:00 UTC. genanki uses this to allocate deterministic note/card IDs.
BUILD_TIMESTAMP = 1_786_536_000.0
ZIP_TIMESTAMP = (2026, 8, 12, 12, 0, 0)
GENANKI_VERSION = "0.13.1"

SOURCE_TIERS = {"EPSO_GUIDANCE", "OFFICIAL_EU_BACKGROUND"}
VOLATILITY_LEVELS = {"LOW", "MEDIUM", "HIGH"}
TSV_COLUMNS = (
    "Card ID",
    "Front",
    "Back",
    "Details",
    "Topic",
    "Tags",
    "Source title",
    "Source URL",
    "Source locator",
    "Source version or snapshot date",
    "Source tier",
    "Verified at",
    "Volatility",
)

DECK_NOTICE = (
    "IMPORTANT — CURRENT GUIDANCE, NOT AN OFFICIAL SYLLABUS. This Phase 2 deck "
    "uses official EU background and EPSO guidance. It is not the definitive "
    "EPSO EU Knowledge source pack or an official EPSO syllabus. EPSO says the "
    "references used to develop that test will be published about two months "
    "before the Part 2 session. Re-check EPSO guidance and replace or revise "
    "affected cards when that pack appears. Every card includes clickable "
    "provenance so its claim can be checked against the cited official source."
)

CARD_CSS = """
.card {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #17212b;
  background: #fbfaf5;
  font-size: 19px;
  line-height: 1.48;
  margin: 0 auto;
  max-width: 46rem;
  padding: 1.15rem;
  text-align: left;
}
.eyebrow { color: #53616f; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.front { font-size: 1.18em; font-weight: 650; margin: .7rem 0; }
.answer { border-left: 4px solid #175f8f; margin: 1rem 0; padding: .1rem 0 .1rem .85rem; }
.details { background: #eef4f7; border-radius: .55rem; margin-top: 1rem; padding: .8rem; }
.source { border-top: 1px solid #ccd4d9; color: #44515d; font-size: .76em; margin-top: 1.2rem; padding-top: .8rem; }
.source a { color: #075f9b; overflow-wrap: anywhere; }
.notice { background: #fff2cc; border: 1px solid #e1b84e; border-radius: .4rem; color: #4c3a07; font-size: .68em; margin-top: 1rem; padding: .55rem; }
""".strip()


def _require_text(value: Any, path: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{path} must be a non-empty string")
    return value.strip()


def _require_iso_date(value: Any, path: str) -> str:
    text = _require_text(value, path)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        raise ValueError(f"{path} must use YYYY-MM-DD")
    return text


def load_and_validate(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValueError(f"Phase 2 card source not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path}: {exc}") from exc

    if not isinstance(data, dict):
        raise ValueError("The Phase 2 card source must be a JSON object")

    for key in ("title", "status", "disclaimer"):
        _require_text(data.get(key), key)
    _require_iso_date(data.get("verified_at"), "verified_at")
    if data.get("phase") != 2:
        raise ValueError("phase must be 2")

    cards = data.get("cards")
    if not isinstance(cards, list) or not cards:
        raise ValueError("cards must be a non-empty array")

    seen_ids: set[str] = set()
    for index, card in enumerate(cards):
        where = f"cards[{index}]"
        if not isinstance(card, dict):
            raise ValueError(f"{where} must be an object")
        for key in ("id", "topic", "front", "back", "detail"):
            _require_text(card.get(key), f"{where}.{key}")
        card_id = card["id"].strip()
        if card_id in seen_ids:
            raise ValueError(f"Duplicate card id: {card_id}")
        seen_ids.add(card_id)

        tags = card.get("tags")
        if not isinstance(tags, list) or any(not isinstance(tag, str) or not tag.strip() for tag in tags):
            raise ValueError(f"{where}.tags must be an array of non-empty strings")

        source = card.get("source")
        if not isinstance(source, dict):
            raise ValueError(f"{where}.source must be an object")
        for key in ("source_title", "url", "locator", "version_or_snapshot_date"):
            _require_text(source.get(key), f"{where}.source.{key}")
        if not source["url"].startswith("https://"):
            raise ValueError(f"{where}.source.url must use HTTPS")
        _require_iso_date(source.get("verified_at"), f"{where}.source.verified_at")
        if source.get("source_tier") not in SOURCE_TIERS:
            raise ValueError(f"{where}.source.source_tier must be one of {sorted(SOURCE_TIERS)}")
        if source.get("volatility") not in VOLATILITY_LEVELS:
            raise ValueError(f"{where}.source.volatility must be one of {sorted(VOLATILITY_LEVELS)}")

    return data


def _escaped_text(value: str) -> str:
    return html.escape(value, quote=True).replace("\n", "<br>")


def _anki_tag(value: str) -> str:
    tag = re.sub(r"[^a-zA-Z0-9_:.-]+", "-", value.strip()).strip("-")
    return tag or "untagged"


def _source_html(source: dict[str, str]) -> str:
    title = _escaped_text(source["source_title"])
    url = html.escape(source["url"], quote=True)
    visible_url = _escaped_text(source["url"])
    locator = _escaped_text(source["locator"])
    snapshot = _escaped_text(source["version_or_snapshot_date"])
    tier = _escaped_text(source["source_tier"])
    verified = _escaped_text(source["verified_at"])
    volatility = _escaped_text(source["volatility"])
    return (
        f'<div class="source"><strong>Provenance</strong><br>'
        f'{title} — {locator}<br>'
        f'<a href="{url}">{visible_url}</a><br>'
        f'Version/snapshot: {snapshot} · Tier: {tier} · '
        f'Verified: {verified} · Volatility: {volatility}</div>'
    )


def _description(data: dict[str, Any]) -> str:
    verified = _escaped_text(data["verified_at"])
    status = _escaped_text(data["status"])
    supplied_disclaimer = _escaped_text(data["disclaimer"])
    return (
        '<div style="border:3px solid #b27400;padding:12px;background:#fff2cc">'
        f'<strong>{_escaped_text(DECK_NOTICE)}</strong></div>'
        f'<p><strong>Content status:</strong> {status}<br>'
        f'<strong>Content verified:</strong> {verified}</p>'
        f'<p>{supplied_disclaimer}</p>'
    )


def _model() -> Any:
    return genanki.Model(
        MODEL_ID,
        "EPSO AD5 Phase 2 — Sourced current guidance",
        fields=[
            {"name": "Card ID"},
            {"name": "Front"},
            {"name": "Back"},
            {"name": "Details"},
            {"name": "Provenance"},
        ],
        templates=[
            {
                "name": "Recall",
                "qfmt": (
                    '<div class="eyebrow">EPSO AD5 · Phase 2</div>'
                    '<div class="front">{{Front}}</div>'
                ),
                "afmt": (
                    '{{FrontSide}}<hr id="answer">'
                    '<div class="answer">{{Back}}</div>'
                    '<div class="details"><strong>Details</strong><br>{{Details}}</div>'
                    '{{Provenance}}'
                    '<div class="notice"><strong>Current guidance — not an official syllabus.</strong> '
                    'Check the linked source and update this card when EPSO publishes its definitive source pack.</div>'
                ),
            }
        ],
        css=CARD_CSS,
        sort_field_index=0,
    )


def build_deck(data: dict[str, Any]) -> Any:
    deck = genanki.Deck(DECK_ID, data["title"], description=_description(data))
    model = _model()
    for due, card in enumerate(sorted(data["cards"], key=lambda item: item["id"]), start=1):
        source = card["source"]
        tags = sorted(
            {
                "epso-ad5",
                "phase-2",
                _anki_tag(card["topic"]),
                _anki_tag(source["source_tier"].lower()),
                *(_anki_tag(tag) for tag in card["tags"]),
            }
        )
        note = genanki.Note(
            model=model,
            fields=[
                _escaped_text(card["id"]),
                _escaped_text(card["front"]),
                _escaped_text(card["back"]),
                _escaped_text(card["detail"]),
                _source_html(source),
            ],
            tags=tags,
            guid=genanki.guid_for("epso-ad5-phase2", card["id"]),
            due=due,
        )
        deck.add_note(note)
    return deck


def _write_reproducible_package(deck: Any, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="epso-anki-") as temporary:
        raw_package = Path(temporary) / "raw.apkg"
        normalized_package = Path(temporary) / "normalized.apkg"
        genanki.Package(deck).write_to_file(raw_package, timestamp=BUILD_TIMESTAMP)

        with zipfile.ZipFile(raw_package, "r") as source_zip, zipfile.ZipFile(
            normalized_package, "w", compression=zipfile.ZIP_STORED
        ) as target_zip:
            for member_name in sorted(source_zip.namelist()):
                info = zipfile.ZipInfo(member_name, ZIP_TIMESTAMP)
                info.compress_type = zipfile.ZIP_STORED
                info.create_system = 3
                info.external_attr = 0o600 << 16
                target_zip.writestr(info, source_zip.read(member_name))

        os.replace(normalized_package, destination)


def _tsv_cell(value: Any) -> str:
    return str(value).replace("\r\n", "<br>").replace("\r", "<br>").replace("\n", "<br>").replace("\t", " ")


def _tsv_rows(cards: Iterable[dict[str, Any]]) -> Iterable[tuple[str, ...]]:
    yield TSV_COLUMNS
    for card in sorted(cards, key=lambda item: item["id"]):
        source = card["source"]
        yield (
            card["id"],
            card["front"],
            card["back"],
            card["detail"],
            card["topic"],
            " ".join(sorted({_anki_tag(tag) for tag in card["tags"]})),
            source["source_title"],
            source["url"],
            source["locator"],
            source["version_or_snapshot_date"],
            source["source_tier"],
            source["verified_at"],
            source["volatility"],
        )


def write_tsv(data: dict[str, Any], destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    rendered = "\n".join("\t".join(_tsv_cell(cell) for cell in row) for row in _tsv_rows(data["cards"])) + "\n"
    with destination.open("w", encoding="utf-8", newline="") as output:
        output.write(rendered)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="reviewed Phase 2 card JSON")
    parser.add_argument("--apkg", type=Path, default=DEFAULT_APKG, help="output Anki package")
    parser.add_argument("--tsv", type=Path, default=DEFAULT_TSV, help="output TSV fallback")
    parser.add_argument("--check", action="store_true", help="validate input without writing output")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    installed_version = getattr(genanki, "__version__", GENANKI_VERSION)
    if installed_version != GENANKI_VERSION:
        print(
            f"Warning: generator was verified with genanki {GENANKI_VERSION}; "
            f"running with {installed_version}.",
            flush=True,
        )

    try:
        data = load_and_validate(args.input.resolve())
        if args.check:
            print(f"Validated {len(data['cards'])} sourced cards in {args.input}")
            return 0
        _write_reproducible_package(build_deck(data), args.apkg.resolve())
        write_tsv(data, args.tsv.resolve())
    except ValueError as exc:
        raise SystemExit(f"Cannot build Phase 2 deck: {exc}") from exc

    print(f"Built {len(data['cards'])} cards: {args.apkg}")
    print(f"Wrote TSV fallback: {args.tsv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
