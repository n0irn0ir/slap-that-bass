import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { CATEGORIES, CATEGORY_BY_ID } from '../lib/categories'
import { fmtMinutes, locale, toISO, todayISO } from '../lib/format'
import { catText, useT } from '../lib/i18n'
import type { LogEntry } from '../lib/types'

interface Props {
  log: LogEntry[]
  onPick: (iso: string) => void // a day with entries
  onNew: (iso: string) => void // an empty past day
}

interface DayInfo {
  total: number
  parts: { color: string; min: number }[]
}

export function Calendar({ log, onPick, onNew }: Props) {
  const { t } = useT()
  const today = todayISO()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [hover, setHover] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, DayInfo>()
    for (const l of log) {
      const d = map.get(l.date) ?? { total: 0, parts: [] }
      d.total += l.minutes
      const color = CATEGORY_BY_ID[l.category].color
      const p = d.parts.find((x) => x.color === color)
      if (p) p.min += l.minutes
      else d.parts.push({ color, min: l.minutes })
      map.set(l.date, d)
    }
    return map
  }, [log])

  const max = Math.max(30, ...[...byDay.values()].map((d) => d.total))

  // Monday-first grid for the month under the cursor.
  const first = new Date(cursor.y, cursor.m, 1)
  const lead = (first.getDay() + 6) % 7
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const cells: (string | null)[] = [...Array(lead).fill(null)]
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISO(new Date(cursor.y, cursor.m, d)))
  // Always six rows, so every month page is the same height.
  while (cells.length < 42) cells.push(null)

  const monthLabel = first.toLocaleDateString(locale(), { month: 'long', year: 'numeric' })
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale(), { weekday: 'short' }).slice(0, 2),
  )
  const monthTotal = cells.reduce((a, iso) => a + (iso ? (byDay.get(iso)?.total ?? 0) : 0), 0)
  const move = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
  }
  const dir = useRef(0)

  const hovered = hover ? byDay.get(hover) : null

  return (
    <div className="cal">
      <span className="cal-nail" aria-hidden />
      <div className="cal-binding" aria-hidden>
        <i className="ring" />
        <i className="ring" />
      </div>
      <button type="button" className="cal-nav prev" onClick={() => { dir.current = -1; move(-1) }} aria-label={t('cal.prev')}>
        ‹
      </button>
      <button type="button" className="cal-nav next" onClick={() => { dir.current = 1; move(1) }} aria-label={t('cal.next')}>
        ›
      </button>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={`${cursor.y}-${cursor.m}`}
          className="cal-page"
          style={{ transformOrigin: '50% 0%' }}
          initial={dir.current >= 0 ? { opacity: 0, y: -18, rotate: 0 } : { opacity: 0, y: 40, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={
            dir.current >= 0
              ? { opacity: 0, y: 70, rotate: 7, transition: { duration: 0.32, ease: [0.4, 0, 1, 1] } }
              : { opacity: 0, y: -18, transition: { duration: 0.15 } }
          }
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <div className="cal-head">
            <span className="cal-month">{monthLabel}</span>
            <span className="mono small muted">{monthTotal ? fmtMinutes(monthTotal) : ' '}</span>
          </div>

          <div className="cal-weekdays">
            {weekdays.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>

          <div className="cal-grid">
          {cells.map((iso, i) => {
            if (!iso) return <span key={`e${i}`} />
            const info = byDay.get(iso)
            const isToday = iso === today
            const future = iso > today
            const day = Number(iso.slice(-2))
            let bg: string | undefined
            if (info) {
              let acc = 0
              const stops = info.parts.map((p) => {
                const from = (acc / info.total) * 100
                acc += p.min
                return `${p.color} ${from}% ${(acc / info.total) * 100}%`
              })
              bg = `conic-gradient(${stops.join(', ')})`
            }
            const size = info ? 0.55 + 0.45 * Math.min(1, info.total / max) : 0
            return (
              <motion.button
                key={iso}
                type="button"
                className={`cal-day${info ? ' has' : ''}${isToday ? ' today' : ''}${future ? ' future' : ''}`}
                disabled={future}
                onMouseEnter={() => setHover(iso)}
                onMouseLeave={() => setHover(null)}
                onClick={() => (info ? onPick(iso) : onNew(iso))}
                whileHover={info ? { scale: 1.15, rotate: -6 } : { scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              >
                {info && (
                  <motion.span
                    className="cal-fill"
                    style={{ background: bg }}
                    initial={{ scale: 0 }}
                    animate={{ scale: size }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: (i % 7) * 0.02 + Math.floor(i / 7) * 0.03 }}
                  />
                )}
                <span className="cal-num">{day}</span>
              </motion.button>
            )
          })}
          </div>
      <div className="cal-foot">
        {hovered && hover ? (
          <>
            <strong className="mono">{fmtMinutes(hovered.total)}</strong>
            <span className="muted">
              {' · '}
              {hovered.parts
                .slice()
                .sort((a, b) => b.min - a.min)
                .map((p) => catText(CATEGORIES.find((c) => c.color === p.color)!.id).short)
                .join(', ')}
            </span>
          </>
        ) : (
          <span className="faint small">{t('cal.hint')}</span>
        )}
      </div>
          <span className="cal-perf" aria-hidden />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
