from __future__ import annotations

import smtplib
import unittest
from datetime import datetime, time, timezone
from email.message import EmailMessage
from unittest.mock import MagicMock, patch
from zoneinfo import ZoneInfo

from reminder.reminder import (
    ConfigError,
    ReminderConfig,
    build_message,
    load_config,
    next_daily_run,
    send_reminder,
)

UTC = timezone.utc


class NextDailyRunTests(unittest.TestCase):
    def setUp(self) -> None:
        self.paris = ZoneInfo("Europe/Paris")

    def test_uses_same_day_before_scheduled_time(self) -> None:
        now = datetime(2026, 8, 13, 15, 0, tzinfo=UTC)  # 17:00 in Paris
        result = next_daily_run(now, time(19, 0), self.paris)
        self.assertEqual(result.isoformat(), "2026-08-13T19:00:00+02:00")

    def test_moves_to_next_local_day_after_scheduled_time(self) -> None:
        now = datetime(2026, 8, 13, 18, 30, tzinfo=UTC)  # 20:30 in Paris
        result = next_daily_run(now, time(19, 0), self.paris)
        self.assertEqual(result.isoformat(), "2026-08-14T19:00:00+02:00")

    def test_rejects_naive_now(self) -> None:
        with self.assertRaisesRegex(ValueError, "timezone-aware"):
            next_daily_run(datetime(2026, 8, 13, 10, 0), time(19, 0), self.paris)

    def test_spring_dst_gap_uses_first_real_minute_after_gap(self) -> None:
        now = datetime(2026, 3, 29, 0, 0, tzinfo=UTC)  # 01:00 local, gap starts at 02:00
        result = next_daily_run(now, time(2, 30), self.paris)
        self.assertEqual(result.isoformat(), "2026-03-29T03:00:00+02:00")

    def test_autumn_dst_overlap_uses_first_occurrence_only(self) -> None:
        now = datetime(2026, 10, 25, 0, 0, tzinfo=UTC)
        result = next_daily_run(now, time(2, 30), self.paris)
        self.assertEqual(result.fold, 0)
        self.assertEqual(result.astimezone(UTC), datetime(2026, 10, 25, 0, 30, tzinfo=UTC))

        after_first_occurrence = datetime(2026, 10, 25, 0, 45, tzinfo=UTC)
        next_result = next_daily_run(after_first_occurrence, time(2, 30), self.paris)
        self.assertEqual(next_result.isoformat(), "2026-10-26T02:30:00+01:00")


class ConfigTests(unittest.TestCase):
    def valid_env(self) -> dict[str, str]:
        return {
            "REMINDER_RECIPIENT": "Student <student@example.com>",
            "REMINDER_FROM": "EPSO Coach <coach@example.com>",
            "REMINDER_TIME": "07:45",
            "REMINDER_TIMEZONE": "Europe/Paris",
            "REMINDER_APP_URL": "https://study.example.com/ad5/",
            "SMTP_HOST": "smtp.example.com",
            "SMTP_SECURITY": "starttls",
            "SMTP_USERNAME": "coach@example.com",
            "SMTP_PASSWORD": "not-printed-secret",
        }

    def test_loads_and_normalizes_valid_configuration(self) -> None:
        config = load_config(self.valid_env())
        self.assertEqual(config.smtp_port, 587)
        self.assertEqual(config.reminder_time, time(7, 45))
        self.assertEqual(config.app_url, "https://study.example.com/ad5")
        self.assertNotIn("not-printed-secret", repr(config))

    def test_requires_recipient(self) -> None:
        env = self.valid_env()
        del env["REMINDER_RECIPIENT"]
        with self.assertRaisesRegex(ConfigError, "REMINDER_RECIPIENT is required"):
            load_config(env)

    def test_requires_credentials_as_a_pair(self) -> None:
        env = self.valid_env()
        del env["SMTP_PASSWORD"]
        with self.assertRaisesRegex(ConfigError, "must either both be set"):
            load_config(env)

    def test_supports_unauthenticated_plain_relay(self) -> None:
        env = self.valid_env()
        env["SMTP_SECURITY"] = "plain"
        env.pop("SMTP_USERNAME")
        env.pop("SMTP_PASSWORD")
        config = load_config(env)
        self.assertEqual(config.smtp_port, 25)
        self.assertIsNone(config.smtp_username)

    def test_rejects_header_injection(self) -> None:
        env = self.valid_env()
        env["REMINDER_SUBJECT"] = "Study\nBcc: attacker@example.com"
        with self.assertRaisesRegex(ConfigError, "single line"):
            load_config(env)

    def test_rejects_unknown_timezone(self) -> None:
        env = self.valid_env()
        env["REMINDER_TIMEZONE"] = "Nowhere/Imaginary"
        with self.assertRaisesRegex(ConfigError, "was not found"):
            load_config(env)


class MailTests(unittest.TestCase):
    def config(self, security: str = "starttls", authenticated: bool = True) -> ReminderConfig:
        return ReminderConfig(
            recipient="student@example.com",
            sender="coach@example.com",
            subject="Daily study",
            reminder_time=time(19, 0),
            timezone=ZoneInfo("Europe/Paris"),
            timezone_name="Europe/Paris",
            app_url="http://localhost:8090",
            smtp_host="smtp.example.com",
            smtp_port=465 if security == "ssl" else 587,
            smtp_security=security,
            smtp_username="coach@example.com" if authenticated else None,
            smtp_password="secret" if authenticated else None,
            smtp_timeout_seconds=12,
        )

    def test_message_contains_daily_loop_and_app_link(self) -> None:
        message = build_message(self.config(), datetime(2026, 8, 13, 12, 0, tzinfo=UTC))
        self.assertIsInstance(message, EmailMessage)
        plain = message.get_body(preferencelist=("plain",)).get_content()
        html_body = message.get_body(preferencelist=("html",)).get_content()
        self.assertIn("http://localhost:8090", plain)
        self.assertIn("timed adaptive set", plain)
        self.assertIn("Open the study coach", html_body)

    @patch("reminder.reminder.ssl.create_default_context")
    @patch("reminder.reminder.smtplib.SMTP")
    def test_starttls_connection_logs_in_and_sends(self, smtp_class: MagicMock, context: MagicMock) -> None:
        smtp = smtp_class.return_value.__enter__.return_value
        send_reminder(self.config("starttls"), datetime(2026, 8, 13, 12, 0, tzinfo=UTC))

        smtp_class.assert_called_once_with("smtp.example.com", 587, timeout=12)
        smtp.starttls.assert_called_once_with(context=context.return_value)
        smtp.login.assert_called_once_with("coach@example.com", "secret")
        smtp.send_message.assert_called_once()
        self.assertEqual(smtp.ehlo.call_count, 2)

    @patch("reminder.reminder.ssl.create_default_context")
    @patch("reminder.reminder.smtplib.SMTP_SSL")
    def test_implicit_tls_uses_smtp_ssl(self, smtp_ssl_class: MagicMock, context: MagicMock) -> None:
        smtp = smtp_ssl_class.return_value.__enter__.return_value
        send_reminder(self.config("ssl"), datetime(2026, 8, 13, 12, 0, tzinfo=UTC))

        smtp_ssl_class.assert_called_once_with(
            "smtp.example.com", 465, timeout=12, context=context.return_value
        )
        smtp.starttls.assert_not_called()
        smtp.send_message.assert_called_once()

    @patch("reminder.reminder.ssl.create_default_context")
    @patch("reminder.reminder.smtplib.SMTP")
    def test_plain_relay_skips_tls_and_auth(self, smtp_class: MagicMock, _context: MagicMock) -> None:
        smtp = smtp_class.return_value.__enter__.return_value
        send_reminder(
            self.config("plain", authenticated=False),
            datetime(2026, 8, 13, 12, 0, tzinfo=UTC),
        )

        smtp.starttls.assert_not_called()
        smtp.login.assert_not_called()
        smtp.send_message.assert_called_once()

    @patch("reminder.reminder.smtplib.SMTP")
    def test_smtp_error_propagates_without_fallback_network_attempt(self, smtp_class: MagicMock) -> None:
        smtp = smtp_class.return_value.__enter__.return_value
        smtp.send_message.side_effect = smtplib.SMTPException("rejected")
        with self.assertRaises(smtplib.SMTPException):
            send_reminder(self.config(), datetime(2026, 8, 13, 12, 0, tzinfo=UTC))


if __name__ == "__main__":
    unittest.main()
