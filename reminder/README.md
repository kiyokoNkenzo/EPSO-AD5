# Optional daily email reminder

This dependency-free worker sends one private study reminder at an exact local time every day. It is separate from the web app and is opt-in: no email is sent unless the reminder container is started with working SMTP settings.

The schedule uses an IANA timezone and follows daylight-saving changes. If a configured time falls inside the spring DST gap, that day's message is sent at the first valid local minute after the gap. During an autumn overlap, it sends at the first occurrence only.

## Configure

Copy the repository's `.env.example` to `.env`, then fill in the SMTP and mailbox values. Never commit `.env`. Prefer an app-specific SMTP password instead of an email-account password.

Important variables:

- `REMINDER_RECIPIENT`: the single destination mailbox.
- `REMINDER_FROM`: the From mailbox; defaults to `SMTP_USERNAME` if omitted.
- `REMINDER_TIME`: local 24-hour `HH:MM`, default `19:00`.
- `REMINDER_TIMEZONE`: IANA timezone, default `Europe/Paris`.
- `REMINDER_APP_URL`: link placed in the message, default `http://localhost:8090`.
- `SMTP_SECURITY`: `starttls` (default), `ssl`, or `plain`.
- `SMTP_HOST` and `SMTP_PORT`: server and port. The inferred ports are 587, 465 and 25 respectively.
- `SMTP_USERNAME` and `SMTP_PASSWORD`: set both for authenticated SMTP, or leave both empty for a trusted local relay.

`plain` deliberately supports a local SMTP relay, but sends credentials and message contents without transport encryption. Do not use it across an untrusted network.

The link must be reachable from the device reading the email. `localhost:8090` works on the Docker host; for a phone, set a LAN, VPN/Tailscale, or HTTPS URL that reaches the app.

## Validate before sending

With the repository Compose service:

```sh
docker compose run --rm reminder --once --dry-run
```

This validates every setting and previews the message without opening an SMTP connection. It never prints the SMTP password.

Send one real test email and exit:

```sh
docker compose run --rm reminder --once
```

Start the daily worker:

```sh
docker compose --profile reminder up -d --build reminder
```

Stop all future messages:

```sh
docker compose --profile reminder stop reminder
```

For standalone use:

```sh
docker build -t epso-ad5-reminder ./reminder
docker run --rm --env-file .env epso-ad5-reminder --once --dry-run
docker run -d --name epso-ad5-reminder --restart unless-stopped --env-file .env epso-ad5-reminder
```

The long-running process handles `SIGTERM`, does not poll, and sleeps until its next scheduled instant. A failed delivery is logged without credentials and the worker remains available for the following day's run.

## Test

From the repository root, using Python 3.9 or newer:

```sh
python3 -m unittest reminder/test_reminder.py
```

Tests use mocked SMTP clients; they never access a mail server.
