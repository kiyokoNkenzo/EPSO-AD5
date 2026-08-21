const DAY_MS = 86_400_000;

export function todayIso(): string {
  const now = new Date();
  return localDateIso(now);
}

export function localDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysUntil(isoDate: string, from = new Date()): number {
  const target = new Date(`${isoDate}T12:00:00`);
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);
  return Math.max(0, Math.ceil((target.getTime() - start.getTime()) / DAY_MS));
}

export function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateIso(date);
}

export function formatDate(isoDate: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-GB', options ?? { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(`${isoDate}T12:00:00`)
  );
}

export function currentStreak(studyDates: string[], now = new Date()): number {
  const unique = new Set(studyDates);
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (!unique.has(localDateIso(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (unique.has(localDateIso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
