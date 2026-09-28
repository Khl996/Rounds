import { Timestamp } from 'firebase/firestore';

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

export function formatDateArabic(val: unknown): string {
  const d = toDate(val);
  if (!d) return '—';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatShortDate(val: unknown): string {
  const d = toDate(val);
  if (!d) return '—';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatTimeArabic(val: unknown): string {
  const d = toDate(val);
  if (!d) return '—';
  return new Intl.DateTimeFormat('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function formatDateTimeArabic(val: unknown): string {
  const d = toDate(val);
  if (!d) return '—';
  return `${formatDateArabic(d)} - ${formatTimeArabic(d)}`;
}

export function calculateDurationString(startVal: unknown, endVal?: unknown): string {
  const start = toDate(startVal);
  if (!start) return '—';
  const end = toDate(endVal) || new Date();
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'أقل من دقيقة';
  }
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 0) {
    return `${diffMinutes} دقيقة`;
  }
  if (hours === 1) {
    return minutes > 0 ? `ساعة و ${minutes} دقيقة` : 'ساعة واحدة';
  }
  if (hours === 2) {
    return minutes > 0 ? `ساعتان و ${minutes} دقيقة` : 'ساعتان';
  }
  if (hours <= 10) {
    return minutes > 0 ? `${hours} ساعات و ${minutes} دقيقة` : `${hours} ساعات`;
  }
  return minutes > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${hours} ساعة`;
}

export function calculateDurationMinutes(startVal: unknown, endVal?: unknown): number {
  const start = toDate(startVal);
  if (!start) return 0;
  const end = toDate(endVal) || new Date();
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  return Math.floor(diffMs / (1000 * 60));
}

export function getRoundTypeLabel(type: 'maintenance' | 'cleaning'): string {
  return type === 'maintenance' ? 'جولة صيانة' : 'جولة نظافة';
}

export function getStatusLabel(status: 'open' | 'resolved' | 'in_progress' | 'completed'): string {
  switch (status) {
    case 'open':
      return 'مفتوحة';
    case 'resolved':
      return 'تمت المعالجة';
    case 'in_progress':
      return 'قيد التنفيذ';
    case 'completed':
      return 'مكتملة';
    default:
      return status;
  }
}

export function generateReportFilename(roundId: string, type: string, supervisorName: string, dateVal: unknown): string {
  const d = toDate(dateVal) || new Date();
  const dateStr = d.toISOString().split('T')[0];
  const cleanSupervisor = supervisorName.trim().replace(/\s+/g, '_');
  return `round-${type}-${dateStr}-${cleanSupervisor}-${roundId.slice(0, 5)}.pdf`;
}
