import {
  BellRing,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Download,
  Info,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import {
  dailyReminderDueDate,
  generateDailyReminderIcs,
  localReminderDate,
  nextDailyReminderAt,
  parseLocalClockTime
} from '../lib/reminders';

const REMINDER_PREFERENCES_KEY = 'ad5-companion-reminder-preferences-v1';

interface ReminderPreferences {
  time: string;
  title: string;
  appUrl: string;
  browserNotifications: boolean;
  lastNotificationDate?: string;
}

type PermissionState = NotificationPermission | 'unsupported';

export function RemindersPage() {
  const [preferences, setPreferences] = useState<ReminderPreferences>(loadPreferences);
  const [permission, setPermission] = useState<PermissionState>(readNotificationPermission);
  const [clock, setClock] = useState(() => new Date());
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const lastDeliveredRef = useRef(preferences.lastNotificationDate);

  const validTime = parseLocalClockTime(preferences.time) !== null;
  const validAppUrl = isHttpUrl(preferences.appUrl);
  const nextOccurrence = useMemo(
    () => nextDailyReminderAt(clock, preferences.time),
    [clock, preferences.time]
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(REMINDER_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      // A restricted browser can still use the page for this session and export ICS.
    }
  }, [preferences]);

  useEffect(() => {
    lastDeliveredRef.current = preferences.lastNotificationDate;
  }, [preferences.lastNotificationDate]);

  useEffect(() => {
    const clockTimer = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    if (
      !preferences.browserNotifications ||
      permission !== 'granted' ||
      !('Notification' in window) ||
      !validTime
    ) {
      return;
    }

    const checkAndNotify = () => {
      const now = new Date();
      const dueDate = dailyReminderDueDate({
        now,
        time: preferences.time,
        lastDeliveredDate: lastDeliveredRef.current
      });
      if (!dueDate) return;

      // Claim this local date synchronously so overlapping timer callbacks cannot
      // create duplicate notifications while the state update is pending.
      lastDeliveredRef.current = dueDate;
      try {
        const notification = new Notification(preferences.title, {
          body: 'Open AD5 Companion for today’s planned study block.',
          tag: `ad5-daily-study-${dueDate}`
        });
        notification.onclick = () => {
          window.focus();
          if (isHttpUrl(preferences.appUrl)) window.location.assign(preferences.appUrl);
          notification.close();
        };
        setPreferences((current) => ({ ...current, lastNotificationDate: dueDate }));
        setStatus(`Browser notification sent for ${dueDate}.`);
        setError('');
      } catch {
        setPreferences((current) => ({ ...current, browserNotifications: false }));
        setError('The browser could not display the notification. Browser reminders were paused.');
      }
    };

    checkAndNotify();
    const timer = window.setInterval(checkAndNotify, 15_000);
    return () => window.clearInterval(timer);
  }, [
    permission,
    preferences.appUrl,
    preferences.browserNotifications,
    preferences.time,
    preferences.title,
    validTime
  ]);

  const updatePreference = <Key extends keyof ReminderPreferences>(
    key: Key,
    value: ReminderPreferences[Key]
  ) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setStatus('Preferences saved in this browser.');
    setError('');
  };

  const downloadCalendar = () => {
    setError('');
    try {
      const ics = generateDailyReminderIcs({
        time: preferences.time,
        title: preferences.title,
        appUrl: preferences.appUrl,
        startDate: localReminderDate(new Date())
      });
      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'ad5-daily-study-reminder.ics';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus('Calendar file downloaded. Import it into your calendar and allow its alerts.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The calendar file could not be created.');
    }
  };

  const enableBrowserNotifications = async () => {
    setError('');
    if (!('Notification' in window)) {
      setPermission('unsupported');
      setError('This browser does not expose the Notification API. Use the calendar reminder instead.');
      return;
    }

    // This is the only place permission is requested, and this function is bound
    // directly to an explicit user click.
    const result = await window.Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setPreferences((current) => ({ ...current, browserNotifications: true }));
      setStatus('Browser reminders enabled while this page remains open.');
    } else {
      setPreferences((current) => ({ ...current, browserNotifications: false }));
      setError(
        result === 'denied'
          ? 'Notification permission is blocked in this browser. Use the calendar reminder or change the browser site setting.'
          : 'Notification permission was not granted. Use the calendar reminder for closed-app alerts.'
      );
    }
  };

  return (
    <div className="page narrow-page reminders-page">
      <PageHeader
        eyebrow="STUDY ROUTINE"
        title="Daily reminders"
        description="Choose one local study time. Calendar alerts are the recommended option when this app or browser may be closed."
      />

      <section className="card settings-card reminder-preferences" aria-labelledby="reminder-settings-title">
        <div className="settings-heading">
          <span><Clock3 size={20} /></span>
          <div>
            <h2 id="reminder-settings-title">Reminder details</h2>
            <p>Changes are stored only in this browser under a dedicated reminder-preferences key.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Local time</span>
            <input
              type="time"
              step="60"
              required
              value={preferences.time}
              onChange={(event) => updatePreference('time', event.target.value)}
              aria-describedby="reminder-next-time"
            />
            <small id="reminder-next-time">
              {nextOccurrence
                ? `Next occurrence: ${formatLocalOccurrence(nextOccurrence)}`
                : 'Enter a valid time in HH:mm form.'}
            </small>
          </label>
          <label className="field">
            <span>Notification title</span>
            <input
              required
              maxLength={120}
              value={preferences.title}
              onChange={(event) => updatePreference('title', event.target.value)}
            />
          </label>
          <label className="field full">
            <span>App URL</span>
            <input
              type="url"
              required
              value={preferences.appUrl}
              onChange={(event) => updatePreference('appUrl', event.target.value)}
            />
            <small>Used by the calendar event and when a browser notification is opened.</small>
          </label>
        </div>
        {(status || error) && (
          <p className={error ? 'field-error reminder-status' : 'reminder-status'} aria-live="polite">
            {error ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
            {error || status}
          </p>
        )}
      </section>

      <section className="reminder-methods" aria-label="Reminder delivery options">
        <article className="card settings-card reminder-method recommended-method">
          <div className="settings-heading">
            <span><CalendarPlus size={20} /></span>
            <div>
              <p className="eyebrow">RECOMMENDED FOR CLOSED-APP ALERTS</p>
              <h2>Calendar reminder</h2>
              <p>Downloads a daily floating-local-time event with a display alarm ten minutes before.</p>
            </div>
          </div>
          <ul className="reminder-facts">
            <li>Repeats every day at the local wall-clock time shown above.</li>
            <li>Continues through daylight-saving changes at the same displayed time.</li>
            <li>Your calendar app—not this web app—delivers the alert after import.</li>
          </ul>
          <button
            className="button primary"
            type="button"
            onClick={downloadCalendar}
            disabled={!validTime || !preferences.title.trim() || !validAppUrl}
          >
            <Download size={17} /> Download daily .ics
          </button>
          <p className="reminder-limitation">
            Import the file once and enable alerts in the calendar app. Delivery still depends on that app’s notification settings and device permissions.
          </p>
        </article>

        <article className="card settings-card reminder-method">
          <div className="settings-heading">
            <span><BellRing size={20} /></span>
            <div>
              <p className="eyebrow">IN-PAGE OPTION</p>
              <h2>Browser notification</h2>
              <p>Useful during an open study day, but not a background reminder service.</p>
            </div>
          </div>
          <dl className="browser-reminder-status">
            <div>
              <dt>Browser permission</dt>
              <dd>{formatPermission(permission)}</dd>
            </div>
            <div>
              <dt>In-page schedule</dt>
              <dd>{preferences.browserNotifications && permission === 'granted' ? 'Active' : 'Paused'}</dd>
            </div>
            <div>
              <dt>Last sent date</dt>
              <dd>{preferences.lastNotificationDate ?? 'None'}</dd>
            </div>
          </dl>
          {preferences.browserNotifications && permission === 'granted' ? (
            <button
              className="button secondary"
              type="button"
              onClick={() => updatePreference('browserNotifications', false)}
            >
              Pause browser reminders
            </button>
          ) : (
            <button className="button secondary" type="button" onClick={enableBrowserNotifications}>
              <BellRing size={17} /> Allow and enable
            </button>
          )}
          <div className="reminder-warning">
            <ShieldAlert size={18} />
            <p>
              Browser notifications are checked only while this page is open. Closing the tab, suspending the browser, device sleep, or browser throttling can prevent or delay them. Enabling this option does not promise a background alert.
            </p>
          </div>
        </article>
      </section>

      <section className="card settings-card email-reminder-note" aria-labelledby="email-reminders-title">
        <div className="settings-heading">
          <span><Mail size={20} /></span>
          <div>
            <p className="eyebrow">OPTIONAL DEPLOYMENT FEATURE</p>
            <h2 id="email-reminders-title">Docker-side email</h2>
            <p>Email delivery belongs in a server-side scheduler, not in browser storage.</p>
          </div>
        </div>
        <p>
          Copy <code>.env.example</code> to <code>.env</code>, then configure <code>REMINDER_RECIPIENT</code>, <code>REMINDER_TIME</code>, <code>REMINDER_TIMEZONE</code>, <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USERNAME</code>, and <code>SMTP_PASSWORD</code>. Start it with <code>docker compose --profile reminder up -d --build</code>. Recipient and SMTP credentials are deliberately not requested or saved by this page.
        </p>
        <div className="reminder-warning neutral">
          <Info size={18} />
          <p>The browser cannot confirm that the mail worker is running. First use <code>docker compose run --rm reminder --once --dry-run</code>, then send one real test with <code>--once</code> before relying on email.</p>
        </div>
      </section>
    </div>
  );
}

function defaultAppUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:4173/';
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

function defaultPreferences(): ReminderPreferences {
  return {
    time: '19:00',
    title: 'AD5 daily study block',
    appUrl: defaultAppUrl(),
    browserNotifications: false
  };
}

function loadPreferences(): ReminderPreferences {
  const fallback = defaultPreferences();
  if (typeof window === 'undefined') return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REMINDER_PREFERENCES_KEY) ?? 'null') as unknown;
    if (!parsed || typeof parsed !== 'object') return fallback;
    const value = parsed as Partial<ReminderPreferences>;
    return {
      time: typeof value.time === 'string' && parseLocalClockTime(value.time) ? value.time : fallback.time,
      title: typeof value.title === 'string' && value.title.trim() ? value.title.slice(0, 120) : fallback.title,
      appUrl: typeof value.appUrl === 'string' && isHttpUrl(value.appUrl) ? value.appUrl : fallback.appUrl,
      browserNotifications: value.browserNotifications === true,
      ...(typeof value.lastNotificationDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.lastNotificationDate)
        ? { lastNotificationDate: value.lastNotificationDate }
        : {})
    };
  } catch {
    return fallback;
  }
}

function readNotificationPermission(): PermissionState {
  return typeof window !== 'undefined' && 'Notification' in window
    ? window.Notification.permission
    : 'unsupported';
}

function formatPermission(permission: PermissionState): string {
  if (permission === 'granted') return 'Allowed';
  if (permission === 'denied') return 'Blocked';
  if (permission === 'unsupported') return 'Not supported';
  return 'Not requested';
}

function formatLocalOccurrence(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
