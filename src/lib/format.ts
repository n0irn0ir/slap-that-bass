import { getLang, tr } from './i18n'

export function fmtMinutes(min: number): string {
  const H = tr('unit.h')
  const M = tr('unit.m')
  if (min <= 0) return `0${M}`
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}${M}`
  if (m === 0) return `${h}${H}`
  return `${h}${H} ${String(m).padStart(2, '0')}${M}`
}

export const locale = () => (getLang() === 'ru' ? 'ru-RU' : 'en-GB')

export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10)
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = todayISO()
  if (iso === today) return tr('date.today')
  const yest = new Date(date)
  const t = new Date()
  yest.setDate(t.getDate() - 1)
  if (iso === toISO(yest)) return tr('date.yesterday')
  return date.toLocaleDateString(locale(), {
    day: 'numeric',
    month: 'short',
    year: y === t.getFullYear() ? undefined : 'numeric',
  })
}

export function toISO(d: Date): string {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10)
}

export function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toISO(d)
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}
