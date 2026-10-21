# EPSO AD5 Study Companion

A private, source-first study app for competition **EPSO/AD/427/26**. It runs as a responsive Docker-served PWA, stores progress only in the browser, and never generates substitute reasoning questions.

The notice-based competition rules were checked on **12–13 August 2026**. The live EU Careers pages and EPSO's AD5 testing instructions were re-read in full on **9 October 2026**, and EPSO's testing schedule on **15 October 2026**. Part 1 reasoning tests take place in the **week of 9–13 November 2026**; each candidate's exact slot is shown on the TAO platform. EPSO currently confirms only **2027** for Part 2; the app's 15 March 2027 default is an editable planning placeholder, not an announced test date.

## Part 1 roll-out: what EPSO has said

EPSO's [13 October 2026 announcement](https://selection.eu-careers.europa.eu/en/news/ad5-graduates-competition-testing-second-week-november-2026/20908) fixes the schedule that its [18 September update](https://selection.eu-careers.europa.eu/en/news/ad5-graduates-testing-more-details-about-timing-and-roll-out/20788) left open:

- Part 1 (verbal, numerical and abstract reasoning) takes place in the **week of 9–13 November 2026**.
- On **19 October**, every candidate receives an invitation letter in the **Single Candidate Portal**. It confirms the testing week and gives instructions, but not the individual date and time.
- From **20 October until 6 November**, the TAO testing platform shows each candidate's **exact date and time** and hosts the **prerequisite test**.
- Rescheduling is not possible, and all three reasoning tests take place in one session on one day.
- On 12 October EPSO [explained](https://selection.eu-careers.europa.eu/en/news/ad5-information/20897) that sessions some candidates saw on TAO on 11 October were the provider's simulations, now removed. Only the formal invitation sets your slot.
- The supporting-documents deadline (7 October 2026, 12:00 Brussels time) has passed.

EPSO has moved its website to **selection.eu-careers.europa.eu**. Links on the old `eu-careers.europa.eu` host return 404 for news items and PDFs, so every EPSO link in this project now uses the new host.

The tests run on TAO with the Proctorio browser extension. EPSO's [AD5 testing instructions](https://selection.eu-careers.europa.eu/system/files/2026-10/EN%20Instructions%20for%20online%20Testing%20%28TAO%29%20427-26%20V1.pdf) (EPSO/AD/427/26 V1, 16 October 2026) add points that matter for preparation:

- The **prerequisite tests can be taken only once per competition** (unless your invitation says otherwise), on the same computer and set-up, before the deadline in your invitation. You can still sit the test without them, but a related technical complaint will be dismissed.
- You need a plugged-in desktop or laptop (no phones or tablets), **Chrome or Edge 148+** with Proctorio, Windows 10+ / macOS 10.15+ / Ubuntu 18.04+, webcam, microphone and administrator rights. VPN, web proxy, antivirus and firewall must be off.
- **Pens, paper and external calculators are forbidden.** The on-screen calculator uses a dot as the decimal separator, so practise numerical reasoning without paper.
- Plugging in a charger after the start, changing network, exiting full screen or losing the Proctorio connection for more than two minutes can end the test automatically.

The app's **Test day** page summarises these rules in its own words, with section numbers, a set-up rehearsal checklist, TAO support details and the conditions for an admissible technical complaint. EPSO's instructions say they are its copyright, so the app paraphrases and links to the full document rather than copying it.

The app follows EPSO's schedule by default. In **Coach → Part 1 roll-out**, copy in your exact date and time (and its time zone) once TAO shows them, or a different week or deadline if your own invitation says so. The Dashboard countdown, the study plan and the coach's next-action queue then follow your real dates instead of the planning target. **Add to calendar** exports the invitation day, platform opening, prerequisite deadline and your test (or the testing week) as one `.ics` file, with Brussels times kept in the Europe/Brussels time zone.

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
- A Part 1 roll-out tracker for the invitation week, prerequisite-check deadline and exact slot. It drives the countdowns and plan, and adds time-sensitive coach actions: watch the portal for invitations, look up the exact slot once EPSO's two-week lead applies, finish the prerequisite check before its deadline, and rehearse the one-sitting sequence in test week. Dates derived by the app are labelled as app arithmetic, never as EPSO dates.
- Conservative category readiness using scored-item depth, a 95% Wilson lower bound, recency, official timing and missing-area penalties. It is explicitly a coaching estimate, never a probability or guarantee.
- Analytics for observed accuracy, sample size, pace, trend and confidence calibration, plus preliminary/final weighted-score sandboxes using the official weights and prominent coverage limits.
- Guided Part 1 and Part 2 drills that reorder only the embedded authentic EPSO sample bank around unseen items, previous misses, pacing and confidence. No question is generated.
- Per-question active time and pre-solution confidence capture, with automatic wrong/omitted-item routing into a learner-classified mistake journal.
- A mistake-repair workflow with exact source/answer inspection, correction notes, scheduled rechecks and resolve/reopen state.
- Scored result logging for publisher-hosted practice, including category, correct/total, duration and notes, while keeping copyrighted prompts link-only.
- A strict evidence boundary: only official EPSO samples can affect the readiness estimate. UCAT, GRE, TSA/TARA, LSAT/LNAT, SAT, PISA, TMUA and other transfer scores remain useful training history without inflating EPSO readiness.
- Daily reminders and a three-day portal-check event via downloadable recurring calendar files, honest in-page browser notifications, and an optional Docker SMTP worker with timezone/DST-aware scheduling.
- A source-bound 40-minute EUFTE writing lab. It requires a real assignment/source URL and supports self-reflection against all five published anchors on a clearly unofficial 0–2 coaching scale.
- An official-rules operational checklist for documents, the three-day Single Candidate Portal routine, current email, an official sample test on the TAO platform, the Test-day set-up rehearsal (complete only when all seven checks are ticked), language/identity checks and the one-attempt prerequisite tests, which unlock once an invitation is recorded.
- A **Test day** page: set-up rehearsal checklist, log-in sequence, allowed and forbidden items, actions that end a test automatically, on-screen tools, TAO support, complaint conditions and after-test steps, each with its section number in EPSO's instructions.
- Four timed, source-linked EPSO sample sprints: 10 verbal, 5 numerical, 5 EU Knowledge, and 5 digital-skills questions.
- Exact item and answer-key locators for all 25 embedded questions.
- Twenty-nine answer-backed, link-only resources, ordered official-EPSO-first and filterable by test section. Seven are official EPSO reasoning sets: the AD abstract PDF, interactive AD verbal, numerical and abstract mock-tests, and the AST/contract-staff verbal, numerical and abstract sets (verbal and numerical in all 24 EU languages). Each notes which items repeat ones you have already seen. The rest are transfer practice from test makers and exam owners: Saville Assessment (incl. abstract and diagrammatic), SHL inductive reasoning, Aon practice tasks, GMAT Official Starter Kit, British Mensa, LSAC/LawHub, LNAT, UAT-UK TSA/TARA and TMUA archives, College Board SAT, OECD PISA, UCAT, GRE and UK Civil Service, plus Commission/Parliament/Council EU quizzes, Eurostat and Europass digital skills.
- An SM-2-style local review queue with Again/Hard/Good/Easy scheduling.
- Seven offline Phase 2 reading briefs with section-level official citations.
- An 80-card Phase 2 Anki package and TSV fallback, both with per-card provenance; 35 cards come directly from the European Parliament’s 2025 Europe@School solved banks.
- A searchable source register, now including every official competition rule and timing source with its locator and check date, plus editable study targets, progress export/import, and mobile navigation.
- An official-source watcher (`pnpm sources:check`) and a daily GitHub Actions job that flag dead links, changed wording and new EPSO updates.

## How to use the coaching loop

1. Open **Coach** and clear any operational risks first. When your Part 1 invitation arrives, record it under **Part 1 roll-out**.
2. Run the recommended guided or fixed authentic set. Record confidence before leaving each item; the app captures active seconds per question.
3. Open **Mistakes**, compare each miss with the published answer and choose the actual cause. Write a one-sentence correction, then schedule the next re-solve.
4. Use **Scoring & analytics** to inspect the conservative lower bound, pacing and confidence—not just the raw percentage. Thin evidence deliberately remains low-readiness evidence.
5. Keep Phase 2 retrieval moving in **Knowledge review** and use **Writing lab** only with a real source-bound assignment.
6. Export a progress backup from **Settings** periodically. Version 1 exports migrate safely to the current version 2 schema.

## Daily reminders

Open **Daily reminders** in the app and choose a local time. The recommended closed-app option downloads a recurring `.ics` event with a display alarm ten minutes before the study block. Import it once into Apple Calendar, Google Calendar, Outlook, or another calendar app and allow that app's alerts. The calendar—not the Docker web container—delivers those notifications.

A second download, **Portal check every 3 days**, creates an event that repeats every three days. It follows EPSO's rule to consult your account at least every three calendar days, which is where Part 1 invitations arrive.

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
- [Consolidated informational notice](https://selection.eu-careers.europa.eu/system/files/2026-07/Notice-of-open-competition-EPSO-AD-427-26_consolidated-version.pdf)
- [EPSO assessment overview](https://selection.eu-careers.europa.eu/en/ad5-graduates-selection-process-how-you-are-assessed)
- [EPSO source-pack notice](https://selection.eu-careers.europa.eu/en/news/eu-knowledge-test-material-available-2-months-test/19555)
- [AD5 testing roll-out update, 18 September 2026](https://selection.eu-careers.europa.eu/en/news/ad5-graduates-testing-more-details-about-timing-and-roll-out/20788)

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
APKG  15a264329c654d0be65678375311a6cdb5b6ea8d48b49746da60f7fa61cb16dc
TSV   88a91b85e66d101e511b275ca26eb7b6befbfbd49b56909429088ead062eecce
```

The TSV is byte-for-byte reproducible. The APKG embeds a SQLite database, so its checksum can differ between SQLite builds even when the deck content is identical. To verify an APKG built elsewhere, compare the SQL dumps of the `collection.anki2` files inside both packages.

## Keeping official sources current

EPSO pages move and change during a live competition. The watcher checks two things:

```bash
pnpm sources:check            # every cited link + every claimed phrase
python3 scripts/check_official_sources.py --claims-only --report report.md
```

- **Links:** every https URL in `src/`, `content/` and this README must resolve. Links on the retired `eu-careers.europa.eu` host fail outright.
- **Claims:** `content/official-source-claims.json` lists the exact phrases the app depends on, for example "during the week of 9 to 13 November 2026" or "once per competition". It also stores the newest "Latest updates" entry already reviewed, so every newer EPSO post is listed with its link.

Locally, `pnpm sources:check` exits with 1 when something needs review. EUR-Lex and the Council site answer scripted requests with bot challenges, so those links are reported as inconclusive rather than failed. PDF claims need `pdftotext` (poppler-utils).

The `Official source watch` workflow runs this daily on GitHub (06:17 UTC, or on demand from the Actions tab). **An EPSO update or a dead link does not fail the job.** Instead it opens one issue titled "EPSO update to review", with links to the new EPSO posts, and comments on it only when something different changes. Once the app data and claims file match EPSO again, the next run closes the issue. GitHub notifies you about the issue like any other. The job only goes red if the checker itself breaks. A separate `CI` workflow runs the tests, typecheck, build and Python suites on every push and pull request.

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
python3 -m unittest reminder/test_reminder.py scripts/test_check_official_sources.py
```

The automated suites check date logic, Part 1 roll-out stages and derived look-up dates, roll-out coaching actions, Brussels time-zone conversion across the October clock change, the Part 1 calendar export, Test-day set-up completion, the retired-host link guard, the source watcher's link and claim checks, spaced-repetition intervals, state migration (including invitation details), adaptive-bank integrity, category metrics, Wilson bounds, confidence calibration, official weights and pass gates, conservative readiness, the external-practice evidence boundary, exact review timestamps, reminder calendar safety (daily and three-day portal events), DST-aware email scheduling, SMTP behavior, question provenance, correct-option integrity, Phase 2 source metadata, and the solution/reuse policy for every publisher-hosted practice entry.

## Data and reuse boundaries

Progress stays in `localStorage` in the current browser and can be exported as JSON from Settings. Clearing site data removes progress unless it was exported first.

This is an independent study tool and is not an official EPSO product. Third-party and EPSO sample content remains attributed to its publisher. Resources with restrictive reuse terms are link-only; review the linked publisher terms before redistributing this app or its extracted study data.
