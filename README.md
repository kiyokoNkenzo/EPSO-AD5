# EPSO AD5 Study Companion

A private, source-first study app for competition **EPSO/AD/427/26**. It runs as a responsive Docker-served PWA, stores progress only in the browser, and never generates substitute reasoning questions.

The content snapshot was checked on **12–13 August 2026**. Part 1 reasoning is expected from October/November 2026. EPSO currently confirms only **2027** for Part 2; the app's 15 March 2027 default is an editable planning placeholder, not an announced test date.

## Run with Docker

```bash
docker compose up --build
```

Open [http://localhost:8090](http://localhost:8090). The container exposes a health check at [http://localhost:8090/healthz](http://localhost:8090/healthz).

To use another host port:

```bash
AD5_PORT=8088 docker compose up --build
```

Stop it with:

```bash
docker compose down
```

The final image contains only nginx and the compiled static app. It runs read-only with temporary nginx paths mounted as `tmpfs`; there is no server database or account system.

## Use it on a phone

Start Docker on a computer connected to the same network as the phone, find the computer's LAN address, then open `http://<computer-ip>:8090` on the phone. On macOS, the Wi-Fi address is often available with:

```bash
ipconfig getifaddr en0
```

The layout is tested at a 390 × 844 phone viewport. You may need to allow incoming connections through the computer's firewall.

Browsers allow service-worker installation only in a secure context. Desktop `localhost` qualifies; a plain `http://192.168…` phone connection normally does not. The app still works responsively over that LAN connection, but installable/offline PWA use on a phone requires serving the container behind HTTPS. The downloadable Anki deck works fully offline after import regardless of how the web app is hosted.

## What is included

- An evidence-aware coach that converts saved performance into a short next-action queue rather than a generic completion percentage.
- Conservative category readiness using scored-item depth, a 95% Wilson lower bound, recency, official timing and missing-area penalties. It is explicitly a coaching estimate, never a probability or guarantee.
- Analytics for observed accuracy, sample size, pace, trend and confidence calibration, plus preliminary/final weighted-score sandboxes using the official weights and prominent coverage limits.
- Guided Part 1 and Part 2 drills that reorder only the embedded authentic EPSO sample bank around unseen items, previous misses, pacing and confidence. No question is generated.
- Per-question active time and pre-solution confidence capture, with automatic wrong/omitted-item routing into a learner-classified mistake journal.
- A mistake-repair workflow with exact source/answer inspection, correction notes, scheduled rechecks and resolve/reopen state.
- Scored result logging for publisher-hosted practice, including category, correct/total, duration and notes, while keeping copyrighted prompts link-only.
- A strict evidence boundary: only official EPSO samples can affect the readiness estimate. UCAT, GRE, TSA/TARA, LSAT/LNAT, SAT, PISA, TMUA and other transfer scores remain useful training history without inflating EPSO readiness.
- Daily reminders via a downloadable recurring calendar event, honest in-page browser notifications, and an optional Docker SMTP worker with timezone/DST-aware scheduling.
- A source-bound 40-minute EUFTE writing lab. It requires a real assignment/source URL and supports self-reflection against all five published anchors on a clearly unofficial 0–2 coaching scale.
- An official-rules operational checklist for documents, the three-day EPSO-account routine, current email, remote-test environment and language/identity checks.
- Four timed, source-linked EPSO sample sprints: 10 verbal, 5 numerical, 5 EU Knowledge, and 5 digital-skills questions.
- Exact item and answer-key locators for all 25 embedded questions.
- Nineteen answer-backed, link-only resources, including British Mensa, LSAC/LawHub, LNAT, UAT-UK TSA/TARA and TMUA archives, College Board SAT, OECD PISA, UCAT, GRE, UK Civil Service, EPSO abstract reasoning, Commission/Parliament/Council EU quizzes, Eurostat and Europass digital skills.
- An SM-2-style local review queue with Again/Hard/Good/Easy scheduling.
- Seven offline Phase 2 reading briefs with section-level official citations.
- An 80-card Phase 2 Anki package and TSV fallback, both with per-card provenance; 35 cards come directly from the European Parliament’s 2025 Europe@School solved banks.
- A searchable source register, editable study targets, progress export/import, and mobile navigation.

## How to use the coaching loop

1. Open **Coach** and clear any operational risks first.
2. Run the recommended guided or fixed authentic set. Record confidence before leaving each item; the app captures active seconds per question.
3. Open **Mistakes**, compare each miss with the published answer and choose the actual cause. Write a one-sentence correction, then schedule the next re-solve.
4. Use **Scoring & analytics** to inspect the conservative lower bound, pacing and confidence—not just the raw percentage. Thin evidence deliberately remains low-readiness evidence.
5. Keep Phase 2 retrieval moving in **Knowledge review** and use **Writing lab** only with a real source-bound assignment.
6. Export a progress backup from **Settings** periodically. Version 1 exports migrate safely to the current version 2 schema.

## Daily reminders

Open **Daily reminders** in the app and choose a local time. The recommended closed-app option downloads a recurring `.ics` event with a display alarm ten minutes before the study block. Import it once into Apple Calendar, Google Calendar, Outlook, or another calendar app and allow that app's alerts. The calendar—not the Docker web container—delivers those notifications.

The browser-notification option is intentionally secondary: a static PWA cannot reliably wake itself after its tab is closed or suspended, so it checks only while the reminder page is open.

For true daily email while the computer or server is running, enable the opt-in SMTP sidecar:

```bash
cp .env.example .env
# Edit .env with the destination mailbox, timezone and SMTP settings.
docker compose run --rm reminder --once --dry-run
docker compose run --rm reminder --once
docker compose --profile reminder up -d --build
```

The dry run validates and previews the message without opening an SMTP connection or printing the password. Send the one-off real test before depending on the schedule. Use an app-specific SMTP password where supported, keep `.env` private, and set `REMINDER_APP_URL` to a LAN/VPN/HTTPS address reachable from the device opening the email—not `localhost` if the email is read on a phone.

Inspect or stop the worker with:

```bash
docker compose logs -f reminder
docker compose --profile reminder stop reminder
```

The ordinary `docker compose up --build` command never starts the email worker; its Compose profile is opt-in. Full configuration and DST behavior are documented in `reminder/README.md`.

The coaching targets (normally 80%, with a 90% stretch target) are independent safety-margin heuristics. They are not EPSO cut-offs. EPSO has not published a fixed competitive cut-off, progression depends on ranking and eligibility as well as fixed pass marks, and reserve-list inclusion does not guarantee recruitment.

The embedded bank is intentionally smaller than a live test. It does not invent filler questions. Visual EPSO abstract-reasoning items and copyright-restricted third-party banks remain on their publishers' sites.

## Phase 2 and the pending source pack

The Phase 2 readings and cards use the competition notice, EPSO guidance, EU treaties, DigComp 2.2, and other official EU material. They are clearly marked as **official-source background, not the definitive EPSO syllabus**.

EPSO says the references used to develop the EU Knowledge Test will be published approximately two months before that test. When they appear, the provisional EU Knowledge scope in this repository must be revalidated against that pack before relying on it for final preparation.

Key official starting points:

- [Binding notice of competition](https://eur-lex.europa.eu/eli/C/2026/711/oj/eng)
- [Consolidated informational notice](https://eu-careers.europa.eu/system/files/2026-07/Notice-of-open-competition-EPSO-AD-427-26_consolidated-version.pdf)
- [EPSO assessment overview](https://eu-careers.europa.eu/en/ad5-graduates-selection-process-how-you-are-assessed)
- [EPSO source-pack notice](https://eu-careers.europa.eu/en/news/eu-knowledge-test-material-available-2-months-test/19555)

## Anki deck

In the app, open **Review → Anki deck**, or import this file directly into Anki:

```text
public/downloads/epso-ad5-phase2.apkg
```

The TSV fallback is beside it. The generated deck has stable deck/model IDs, deterministic ordering, and clickable source links.

To rebuild it:

```bash
python3 -m pip install genanki==0.13.1
python3 scripts/build_anki.py
```

Published artifact checksums:

```text
APKG  9c022ab7705c26fe404f646313d503e9545bc9dbf3b5bdc37e90e2ac775a2329
TSV   6da859838f91311d7cc5008f323d10c36eb958346a71e60da15330313eca2092
```

## Local development and verification

Node 22 or newer and pnpm 10 are recommended.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Run the checks and production build with:

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm preview
python3 -m unittest reminder/test_reminder.py
```

The automated suites check date logic, spaced-repetition intervals, state migration, adaptive-bank integrity, category metrics, Wilson bounds, confidence calibration, official weights and pass gates, conservative readiness, the external-practice evidence boundary, exact review timestamps, reminder calendar safety, DST-aware email scheduling, SMTP behavior, question provenance, correct-option integrity, Phase 2 source metadata, and the solution/reuse policy for every publisher-hosted practice entry.

## Data and reuse boundaries

Progress stays in `localStorage` in the current browser and can be exported as JSON from Settings. Clearing site data removes progress unless it was exported first.

This is an independent study tool and is not an official EPSO product. Third-party and EPSO sample content remains attributed to its publisher. Resources with restrictive reuse terms are link-only; review the linked publisher terms before redistributing this app or its extracted study data.
