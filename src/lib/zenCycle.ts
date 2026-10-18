export interface CycleState { seen: string[]; last?: string }
/** Each eligible ID is visited once per cycle, including newly added quotes. */
export function nextInCycle(ids: string[], previous?: CycleState, random = Math.random): { id?: string; state: CycleState } {
  const eligible = [...new Set(ids)];
  const valid = previous && Array.isArray(previous.seen) ? previous : { seen: [] };
  let seen = valid.seen.filter(id => eligible.includes(id));
  let remaining = eligible.filter(id => !seen.includes(id));
  if (!remaining.length) { seen = []; remaining = eligible; }
  if (remaining.length > 1 && !seen.length) remaining = remaining.filter(id => id !== valid.last);
  const id = remaining[Math.min(remaining.length - 1, Math.floor(random() * remaining.length))];
  return { id, state: { seen: id ? [...seen, id] : seen, last: id || valid.last } };
}
const memory = new Map<string, CycleState>();
export function takeZenQuote(ids: string[], scope: string): string | undefined {
  const key = `kalimati.zen.cycle.v1.${scope}`;
  let previous: CycleState | undefined = memory.get(key);
  try { previous = JSON.parse(localStorage.getItem(key) || 'null') || previous; } catch { /* corrupt storage */ }
  const next = nextInCycle(ids, previous);
  memory.set(key, next.state);
  try { localStorage.setItem(key, JSON.stringify(next.state)); } catch { /* private browsing */ }
  return next.id;
}
