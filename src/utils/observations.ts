import { Observation } from '../types';
import { toMillis } from './formatters';

export interface RoundCounts {
  /** The round's observations, oldest first (the order used for numbering and the PDF). */
  list: Observation[];
  total: number;
  open: number;
}

/** Groups observations by round. Counts are computed from the observations themselves. */
export function groupByRound(observations: Observation[]): Map<string, RoundCounts> {
  const map = new Map<string, RoundCounts>();
  for (const obs of observations) {
    if (!obs.roundId) continue;
    let entry = map.get(obs.roundId);
    if (!entry) {
      entry = { list: [], total: 0, open: 0 };
      map.set(obs.roundId, entry);
    }
    entry.list.push(obs);
    entry.total++;
    if (obs.status === 'open') entry.open++;
  }
  for (const entry of map.values()) {
    entry.list.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
  }
  return map;
}
