import { Round } from '../types';
import { toDate } from './formatters';

// Characters that cannot be misread on paper or over the phone (no 0/O, 1/I/L).
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// The facility's time zone. The date in the code must not depend on the viewing device's
// settings, because codes for rounds created before `roundCode` existed are derived on display.
const ROUND_CODE_TIME_ZONE = 'Asia/Riyadh';

const datePartsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: ROUND_CODE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function dateStamp(date: Date): string {
  const parts = Object.fromEntries(datePartsFormat.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}${parts.month}${parts.day}`;
}

/**
 * RND-YYYYMMDD-XXXX: the round's start date plus 4 characters derived from its Firestore
 * document ID. Deterministic, so the same round always produces the same code.
 */
export function buildRoundCode(date: Date, docId: string): string {
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[docId.charCodeAt(i % docId.length) % ALPHABET.length];
  }
  return `RND-${dateStamp(date)}-${suffix}`;
}

/** The persisted code, or the same derivation for rounds created before codes were stored. */
export function getRoundCode(round: Pick<Round, 'id' | 'roundCode' | 'startedAt' | 'createdAt'>): string {
  if (round.roundCode) return round.roundCode;
  const date = toDate(round.startedAt) || toDate(round.createdAt);
  return date ? buildRoundCode(date, round.id) : '—';
}
