#!/usr/bin/env python3
"""Small, dependency-free daily email reminder worker for the EPSO AD5 app."""

from __future__ import annotations

import argparse
import html
import os
import re
import signal
import smtplib
import ssl
import sys
import threading
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta, timezone
from email.message import EmailMessage
from email.utils import format_datetime, make_msgid, parseaddr
from typing import Mapping, Sequence
from urllib.parse import urlparse
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


DEFAULT_SUBJECT = "EPSO AD5 — your daily study loop"
DEFAULT_TIME = "19:00"
DEFAULT_TIMEZONE = "Europe/Paris"
DEFAULT_APP_URL = "http://localhost:8090"
VALID_SMTP_SECURITY = frozenset({"starttls", "ssl", "plain"})
STOP_EVENT = threading.Event()
UTC = timezone.utc


class ConfigError(ValueError):
    """Raised for configuration that is unsafe or cannot work."""


@dataclass(frozen=True)
class ReminderConfig:
    recipient: str
    sender: str
    subject: str
    reminder_time: time
    timezone: ZoneInfo
    timezone_name: str
    app_url: str
    smtp_host: str
    smtp_port: int
    smtp_security: str
    smtp_username: str | None
    smtp_password: str | None = field(repr=False)
    smtp_timeout_seconds: float = 30.0


def _nonempty(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _required(env: Mapping[str, str], name: str) -> str:
    value = _nonempty(env.get(name))
    if value is None:
        raise ConfigError(f"{name} is required. Add it to the reminder environment.")
    return value


def _validate_header(name: str, value: str) -> str:
    if "\r" in value or "\n" in value:
        raise ConfigError(f"{name} must be a single line.")
    return value


def _validate_mailbox(name: str, value: str) -> str:
    _validate_header(name, value)
    _, address = parseaddr(value)
    if not address or "@" not in address or address.startswith("@") or address.endswith("@"):
        raise ConfigError(f"{name} must contain one valid email address, for example user@example.com.")
    return value


def _parse_time(value: str) -> time:
    if not re.fullmatch(r"\d{2}:\d{2}", value):
        raise ConfigError("REMINDER_TIME must use 24-hour HH:MM format, for example 19:00.")
    try:
        parsed = time.fromisoformat(value)
    except ValueError as exc:
        raise ConfigError("REMINDER_TIME is not a valid clock time.") from exc
    return parsed.replace(second=0, microsecond=0)


def _parse_port(value: str) -> int:
    try:
        port = int(value)
    except ValueError as exc:
        raise ConfigError("SMTP_PORT must be an integer between 1 and 65535.") from exc
    if not 1 <= port <= 65535:
        raise ConfigError("SMTP_PORT must be between 1 and 65535.")
    return port


def _parse_timeout(value: str) -> float:
    try:
        timeout = float(value)
    except ValueError as exc:
        raise ConfigError("SMTP_TIMEOUT_SECONDS must be a positive number.") from exc
    if not 0 < timeout <= 300:
        raise ConfigError("SMTP_TIMEOUT_SECONDS must be greater than 0 and no more than 300.")
    return timeout


def _validate_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ConfigError("REMINDER_APP_URL must be an absolute http:// or https:// URL.")
    if "\r" in value or "\n" in value:
        raise ConfigError("REMINDER_APP_URL must be a single line.")
    return value.rstrip("/")


def load_config(env: Mapping[str, str] | None = None) -> ReminderConfig:
    """Load and validate configuration exclusively from environment variables."""

    source = os.environ if env is None else env
    smtp_security = (_nonempty(source.get("SMTP_SECURITY")) or "starttls").lower()
    if smtp_security not in VALID_SMTP_SECURITY:
        choices = ", ".join(sorted(VALID_SMTP_SECURITY))
        raise ConfigError(f"SMTP_SECURITY must be one of: {choices}.")

    default_ports = {"starttls": "587", "ssl": "465", "plain": "25"}
    smtp_username = _nonempty(source.get("SMTP_USERNAME"))
    smtp_password = _nonempty(source.get("SMTP_PASSWORD"))
    if bool(smtp_username) != bool(smtp_password):
        raise ConfigError(
            "SMTP_USERNAME and SMTP_PASSWORD must either both be set or both be empty "
            "for an unauthenticated relay."
        )

    sender = _nonempty(source.get("REMINDER_FROM")) or smtp_username
    if sender is None:
        raise ConfigError("REMINDER_FROM is required when SMTP_USERNAME is not set.")

    timezone_name = _nonempty(source.get("REMINDER_TIMEZONE")) or DEFAULT_TIMEZONE
    try:
        timezone = ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        raise ConfigError(
            f"REMINDER_TIMEZONE '{timezone_name}' was not found. Use an IANA name such as Europe/Paris."
        ) from exc

    subject = _validate_header(
        "REMINDER_SUBJECT", _nonempty(source.get("REMINDER_SUBJECT")) or DEFAULT_SUBJECT
    )
    if len(subject) > 200:
        raise ConfigError("REMINDER_SUBJECT must be no more than 200 characters.")

    return ReminderConfig(
        recipient=_validate_mailbox("REMINDER_RECIPIENT", _required(source, "REMINDER_RECIPIENT")),
        sender=_validate_mailbox("REMINDER_FROM", sender),
        subject=subject,
        reminder_time=_parse_time(_nonempty(source.get("REMINDER_TIME")) or DEFAULT_TIME),
        timezone=timezone,
        timezone_name=timezone_name,
        app_url=_validate_url(_nonempty(source.get("REMINDER_APP_URL")) or DEFAULT_APP_URL),
        smtp_host=_required(source, "SMTP_HOST"),
        smtp_port=_parse_port(_nonempty(source.get("SMTP_PORT")) or default_ports[smtp_security]),
        smtp_security=smtp_security,
        smtp_username=smtp_username,
        smtp_password=smtp_password,
        smtp_timeout_seconds=_parse_timeout(
            _nonempty(source.get("SMTP_TIMEOUT_SECONDS")) or "30"
        ),
    )


def _wall_time_candidates(local_day: date, scheduled_time: time, timezone: ZoneInfo) -> list[datetime]:
    """Return real instants matching a local wall time, ordered earliest first.

    A DST overlap produces two candidates; the first occurrence is deliberately used
    so the worker sends at most once per local day. A DST gap produces none.
    """

    naive = datetime.combine(local_day, scheduled_time)
    candidates: dict[datetime, datetime] = {}
    for fold in (0, 1):
        local = naive.replace(tzinfo=timezone, fold=fold)
        utc_instant = local.astimezone(UTC)
        round_trip = utc_instant.astimezone(timezone)
        if round_trip.replace(tzinfo=None) == naive:
            candidates[utc_instant] = local
    return [candidates[key] for key in sorted(candidates)]


def _resolved_local_run(local_day: date, scheduled_time: time, timezone: ZoneInfo) -> datetime:
    candidates = _wall_time_candidates(local_day, scheduled_time, timezone)
    if candidates:
        return candidates[0]

    # On a spring-forward day the configured wall time may not exist. Schedule at
    # the first real local minute after the gap instead of silently missing a day.
    naive = datetime.combine(local_day, scheduled_time)
    for minute_offset in range(1, 181):
        shifted = naive + timedelta(minutes=minute_offset)
        candidates = _wall_time_candidates(shifted.date(), shifted.time(), timezone)
        if candidates:
            return candidates[0]
    raise RuntimeError("Could not resolve the configured local reminder time within three hours.")


def next_daily_run(now: datetime, scheduled_time: time, timezone: ZoneInfo) -> datetime:
    """Return the next daily run as an aware datetime in the configured timezone."""

    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("now must be timezone-aware")

    now_utc = now.astimezone(UTC)
    local_day = now.astimezone(timezone).date()
    for day_offset in (0, 1, 2):
        candidate = _resolved_local_run(local_day + timedelta(days=day_offset), scheduled_time, timezone)
        if candidate.astimezone(UTC) > now_utc:
            return candidate
    raise RuntimeError("Could not calculate the next daily reminder.")


def build_message(config: ReminderConfig, now: datetime | None = None) -> EmailMessage:
    current = (now or datetime.now(UTC)).astimezone(config.timezone)
    display_date = current.strftime("%A %d %B %Y")

    text_body = f"""EPSO AD5 — daily deliberate-practice reminder
{display_date}

Open your study coach: {config.app_url}

Today's focused loop (about 45 minutes):
1. Review every card and mistake currently due.
2. Complete one timed adaptive set without interruptions.
3. Classify each error: knowledge, reasoning, reading, calculation, confidence, or pace.
4. Re-solve the hardest missed question from its cited source.
5. Record the result. On a Phase 2 day, add one source-pack reading or writing drill.

Aim for consistency and honest evidence, not a perfect streak. The app's readiness
estimate is a coaching signal; it is not an EPSO score or a guarantee of selection.

You receive this message because the optional reminder worker was configured for
your own EPSO AD5 study app. Stop the reminder container to stop these emails.
"""

    safe_url = html.escape(config.app_url, quote=True)
    safe_date = html.escape(display_date)
    html_body = f"""\
<!doctype html>
<html lang="en">
  <body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#17202a;max-width:640px;margin:auto;padding:24px">
    <p style="margin:0;color:#52606d">{safe_date}</p>
    <h1 style="font-size:24px;margin:8px 0 18px">Your EPSO AD5 study loop</h1>
    <p><a href="{safe_url}" style="background:#174ea6;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block">Open the study coach</a></p>
    <h2 style="font-size:18px;margin-top:28px">Today · about 45 minutes</h2>
    <ol>
      <li>Review every card and mistake currently due.</li>
      <li>Complete one timed adaptive set without interruptions.</li>
      <li>Classify each error: knowledge, reasoning, reading, calculation, confidence, or pace.</li>
      <li>Re-solve the hardest missed question from its cited source.</li>
      <li>Record the result. On a Phase 2 day, add one source-pack reading or writing drill.</li>
    </ol>
    <p><strong>Aim for consistency and honest evidence, not a perfect streak.</strong></p>
    <p style="font-size:13px;color:#52606d">The app's readiness estimate is a coaching signal, not an EPSO score or a guarantee of selection. Stop the optional reminder container to stop these emails.</p>
  </body>
</html>
"""

    message = EmailMessage()
    message["To"] = config.recipient
    message["From"] = config.sender
    message["Subject"] = config.subject
    message["Date"] = format_datetime(current)
    message["Message-ID"] = make_msgid(domain=parseaddr(config.sender)[1].partition("@")[2] or None)
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")
    return message


def send_reminder(config: ReminderConfig, now: datetime | None = None) -> None:
    message = build_message(config, now=now)
    tls_context = ssl.create_default_context()

    if config.smtp_security == "ssl":
        client_factory = smtplib.SMTP_SSL
        client_kwargs = {"context": tls_context}
    else:
        client_factory = smtplib.SMTP
        client_kwargs = {}

    with client_factory(
        config.smtp_host,
        config.smtp_port,
        timeout=config.smtp_timeout_seconds,
        **client_kwargs,
    ) as smtp:
        smtp.ehlo()
        if config.smtp_security == "starttls":
            smtp.starttls(context=tls_context)
            smtp.ehlo()
        if config.smtp_username is not None:
            smtp.login(config.smtp_username, config.smtp_password or "")
        smtp.send_message(
            message,
            from_addr=parseaddr(config.sender)[1],
            to_addrs=[parseaddr(config.recipient)[1]],
        )


def _log(message: str) -> None:
    timestamp = datetime.now(UTC).isoformat(timespec="seconds")
    print(f"{timestamp} {message}", flush=True)


def _request_stop(signum: int, _frame: object) -> None:
    _log(f"Received signal {signum}; shutting down.")
    STOP_EVENT.set()


def run_scheduler(config: ReminderConfig) -> None:
    _log(
        "Reminder worker active: daily at "
        f"{config.reminder_time.strftime('%H:%M')} {config.timezone_name} "
        f"via SMTP {config.smtp_security}."
    )
    while not STOP_EVENT.is_set():
        now = datetime.now(UTC)
        next_run = next_daily_run(now, config.reminder_time, config.timezone)
        wait_seconds = max(0.0, (next_run.astimezone(UTC) - now).total_seconds())
        _log(f"Next reminder: {next_run.isoformat()}.")
        if STOP_EVENT.wait(wait_seconds):
            break
        try:
            send_reminder(config)
            _log("Daily reminder sent.")
        except (OSError, smtplib.SMTPException) as exc:
            _log(f"Reminder delivery failed ({type(exc).__name__}): {exc}")
    _log("Reminder worker stopped.")


def _dry_run(config: ReminderConfig) -> None:
    next_run = next_daily_run(datetime.now(UTC), config.reminder_time, config.timezone)
    message = build_message(config)
    print("Configuration valid. No network connection was opened.")
    print(f"Recipient: {config.recipient}")
    print(f"From: {config.sender}")
    print(f"Subject: {config.subject}")
    print(f"App URL: {config.app_url}")
    print(f"Schedule: daily at {config.reminder_time.strftime('%H:%M')} {config.timezone_name}")
    print(f"Next scheduled run: {next_run.isoformat()}")
    print("\nPlain-text preview:\n")
    print(message.get_body(preferencelist=("plain",)).get_content())


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Send an EPSO AD5 daily study reminder by email.")
    parser.add_argument(
        "--once",
        action="store_true",
        help="send immediately once, then exit (useful for verifying SMTP settings)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="validate and preview once without connecting to SMTP",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        config = load_config()
    except ConfigError as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        return 2

    if args.dry_run:
        _dry_run(config)
        return 0
    if args.once:
        try:
            send_reminder(config)
        except (OSError, smtplib.SMTPException) as exc:
            print(f"Reminder delivery failed ({type(exc).__name__}): {exc}", file=sys.stderr)
            return 1
        _log("Test reminder sent.")
        return 0

    signal.signal(signal.SIGTERM, _request_stop)
    signal.signal(signal.SIGINT, _request_stop)
    run_scheduler(config)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
