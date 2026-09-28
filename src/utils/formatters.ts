import { Timestamp } from 'firebase/firestore';
import { ObservationStatus, RoundStatus, RoundType } from '../types';

// Gregorian calendar with Latin digits: matches printed reports and the round code.
const LOCALE = 'ar-SA-u-ca-gregory-nu-latn';

const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true });
const dayMonthFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long' });
const fullDateFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
const weekdayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });

export function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'object' && 'toDate' in val && typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate();
  }
  if (typeof val === 'object' && 'seconds' in val && typeof (val as { seconds: number }).seconds === 'number') {
    return new Date((val as { seconds: number }).seconds * 1000);
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function toMillis(val: unknown): number {
  return toDate(val)?.getTime() ?? 0;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 8:12 ص */
export function formatTime(val: unknown): string {
  const d = toDate(val);
  return d ? timeFormat.format(d) : '—';
}

/** 28 سبتمبر 2026 */
export function formatDate(val: unknown): string {
  const d = toDate(val);
  return d ? fullDateFormat.format(d) : '—';
}

/** 28/09/2026 */
export function formatNumericDate(val: unknown): string {
  const d = toDate(val);
  if (!d) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** اليوم / أمس / الاثنين، 28 سبتمبر (with the year when it is not the current one). */
export function formatDayLabel(val: unknown, withWeekday = true): string {
  const d = toDate(val);
  if (!d) return '—';
  const now = new Date();
  if (isSameDay(d, now)) return 'اليوم';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return 'أمس';
  if (d.getFullYear() !== now.getFullYear()) return fullDateFormat.format(d);
  return (withWeekday ? weekdayFormat : dayMonthFormat).format(d);
}

/** Time only for today, otherwise "28 سبتمبر، 8:12 ص". */
export function formatWhen(val: unknown): string {
  const d = toDate(val);
  if (!d) return '—';
  if (isSameDay(d, new Date())) return timeFormat.format(d);
  const day = d.getFullYear() === new Date().getFullYear() ? dayMonthFormat.format(d) : fullDateFormat.format(d);
  return `${day}، ${timeFormat.format(d)}`;
}

/** Stable key for grouping items by calendar day. */
export function dayKey(val: unknown): string {
  const d = toDate(val);
  return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : 'unknown';
}

interface CountForms {
  zero?: string;
  one: string;
  two: string;
  few: string;
  many: string;
}

/** Arabic count agreement: ملاحظة واحدة، ملاحظتان، 3 ملاحظات، 11 ملاحظة. */
export function formatCount(n: number, forms: CountForms): string {
  if (n === 0 && forms.zero) return forms.zero;
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  const lastTwo = n % 100;
  if (lastTwo >= 3 && lastTwo <= 10) return `${n} ${forms.few}`;
  return `${n} ${forms.many}`;
}

export const OBSERVATION_FORMS: CountForms = {
  zero: 'لا ملاحظات',
  one: 'ملاحظة واحدة',
  two: 'ملاحظتان',
  few: 'ملاحظات',
  many: 'ملاحظة',
};

export function formatObservationCount(n: number): string {
  return formatCount(n, OBSERVATION_FORMS);
}

const MINUTE_FORMS: CountForms = { one: 'دقيقة', two: 'دقيقتان', few: 'دقائق', many: 'دقيقة' };
const HOUR_FORMS: CountForms = { one: 'ساعة', two: 'ساعتان', few: 'ساعات', many: 'ساعة' };
// After "منذ" the dual takes the genitive form.
const MINUTE_FORMS_AFTER_SINCE: CountForms = { ...MINUTE_FORMS, two: 'دقيقتين' };
const HOUR_FORMS_AFTER_SINCE: CountForms = { ...HOUR_FORMS, two: 'ساعتين' };

function minutesBetween(startVal: unknown, endVal?: unknown): number | null {
  const start = toDate(startVal);
  if (!start) return null;
  const end = toDate(endVal) || new Date();
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
}

function durationText(totalMinutes: number, minuteForms: CountForms, hourForms: CountForms): string {
  if (totalMinutes < 1) return 'أقل من دقيقة';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return formatCount(minutes, minuteForms);
  const hoursText = formatCount(hours, hourForms);
  return minutes > 0 ? `${hoursText} و${formatCount(minutes, minuteForms)}` : hoursText;
}

/** 35 دقيقة، ساعة و10 دقائق */
export function formatDuration(startVal: unknown, endVal?: unknown): string {
  const minutes = minutesBetween(startVal, endVal);
  return minutes === null ? '—' : durationText(minutes, MINUTE_FORMS, HOUR_FORMS);
}

/** منذ 24 دقيقة */
export function formatElapsed(startVal: unknown, now: number = Date.now()): string {
  const minutes = minutesBetween(startVal, now);
  if (minutes === null) return '';
  if (minutes < 1) return 'بدأت الآن';
  return `منذ ${durationText(minutes, MINUTE_FORMS_AFTER_SINCE, HOUR_FORMS_AFTER_SINCE)}`;
}

export function calculateDurationMinutes(startVal: unknown, endVal?: unknown): number {
  return minutesBetween(startVal, endVal) ?? 0;
}

export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  maintenance: 'صيانة',
  cleaning: 'نظافة',
};

export function roundTitle(type: RoundType): string {
  return `جولة ${ROUND_TYPE_LABEL[type] ?? ''}`.trim();
}

export const ROUND_STATUS_LABEL: Record<RoundStatus, string> = {
  in_progress: 'جارية',
  completed: 'مكتملة',
};

export const OBSERVATION_STATUS_LABEL: Record<ObservationStatus, string> = {
  open: 'مفتوحة',
  resolved: 'مغلقة',
};

export function greeting(now: Date = new Date()): string {
  return now.getHours() < 12 ? 'صباح الخير' : 'مساء الخير';
}

/** Loose Arabic matching for search: ignores diacritics and common letter variants. */
export function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ء/g, '')
    .replace(/ة/g, 'ه')
    .trim();
}
