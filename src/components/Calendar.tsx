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
      {/* spiral binding with the hanger wire threaded through it, up to the nail */}
      <img className="cal-nail" src={`${import.meta.env.BASE_URL}nail.png`} alt="" draggable={false} />
      <svg className="cal-spiral" aria-hidden viewBox="0 -72 360 116" width="360" height="116">
          {/* the wire: horizontal through the coils, rising into the hanging loop */}
          <path
            d="M 2 9 L 96 9 C 148 9 163 8 166 -18 A 14 14 0 0 1 194 -18 C 197 8 212 9 264 9 L 358 9"
            fill="none"
            stroke="var(--hot)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {Array.from({ length: 20 }, (_, i) => i)
            .filter((i) => i < 8 || i > 11)
            .map((i) => (
              <g key={i} transform={`translate(${i * 18} 0)`}>
                <circle cx="9" cy="22" r="2.6" fill="#5c6462" />
                <path
                  d="M6.5 22 C 4 12, 4 4, 9 3 C 14 4, 14 12, 11.5 22"
                  fill="none"
                  stroke="#c6ccca"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </g>
            ))}
      </svg>
      <span className="cal-shadow" aria-hidden />
      <div className="cal-paper">
        <div className="cal-binding" aria-hidden />
      <button type="button" className="cal-nav prev" onClick={() => { dir.current = -1; move(-1) }} aria-label={t('cal.prev')}>
        ‹
      </button>
      <button type="button" className="cal-nav next" onClick={() => { dir.current = 1; move(1) }} aria-label={t('cal.next')}>
        ›
      </button>

      {/* `custom` carries the direction to the exiting page too, so both pages agree on the move. */}
      <AnimatePresence mode="popLayout" initial={false} custom={dir.current}>
        <motion.div
          key={`${cursor.y}-${cursor.m}`}
          className="cal-page"
          style={{ transformOrigin: '50% 0%', transformPerspective: 900 }}
          custom={dir.current}
          variants={{
            // Forward: the old page flips up over the spiral; the next one is already underneath.
            // Back: the previous page swings down from the top onto the current one.
            enter: (d: number) => (d > 0 ? { opacity: 1, rotateX: 0 } : { opacity: 0, rotateX: -100 }),
            show: (d: number) => ({
              opacity: 1,
              rotateX: 0,
              zIndex: 1,
              transition: d > 0 ? { duration: 0.2 } : { type: 'spring', stiffness: 220, damping: 22 },
            }),
            leave: (d: number) =>
              d > 0
                ? { opacity: [1, 1, 0], rotateX: -100, zIndex: 2, transition: { duration: 0.42, ease: [0.4, 0, 0.8, 1] } }
                : { opacity: 0, zIndex: 0, transition: { duration: 0.1 } },
          }}
          initial="enter"
          animate="show"
          exit="leave"
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
            if (!iso) return <span key={`e${i}`} className="cal-empty" />
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
        ) : null}
      </div>
          <span className="cal-perf" aria-hidden />
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  )
}
