import { tr } from './i18n'
import type { LogEntry, Session } from './types'

/**
 * Resolve minutes per line for a session total. Lines with a typed-in value keep it;
 * the rest share what is left evenly (integers, the remainder goes to the first ones).
 * If the typed-in values exceed the total, the total grows to fit — nothing is clipped.
 */
export function splitMinutes(total: number, typed: (number | null)[]): number[] {
  const fixedSum = typed.reduce<number>((a, m) => a + (m ?? 0), 0)
  const free = typed.filter((m) => m === null).length
  const left = Math.max(0, total - fixedSum)
  const base = free ? Math.floor(left / free) : 0
  let extra = free ? left - base * free : 0
  return typed.map((m) => {
    if (m !== null) return m
    const v = base + (extra > 0 ? 1 : 0)
    if (extra > 0) extra--
    return v
  })
}

/** What a session is called in lists: its title, or the default label. */
export function sessionLabel(s: Pick<Session, 'title'>): string {
  return s.title?.trim() || tr('journal.defaultTitle')
}

/** Lines of a session, in the order they were added. */
export function linesOf(log: LogEntry[], sessionId: string): LogEntry[] {
  return log.filter((l) => l.session_id === sessionId).sort((a, b) => a.created_at.localeCompare(b.created_at))
}
