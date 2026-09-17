import { AnimatePresence, motion, useAnimation, useMotionValue, useSpring } from 'motion/react'
import { useCallback, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Rhythm, WeeklyBars } from '../components/Charts'
import { Icon } from '../components/Icon'
import { Pep } from '../components/Pep'
import { Rose } from '../components/Rose'
import { Bolts, Jiggle, Wave, useTypedWord } from '../components/fun'
import { Burst, Counter } from '../components/ui'
import { daysAgoISO, fmtMinutes } from '../lib/format'
import { STRINGS, pluck as play } from '../lib/pluck'
import { countByStatus, minutesByCategory, minutesByTopic, useData } from '../state/DataContext'
import { plural, useT } from '../lib/i18n'

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
})

export function Dashboard() {
  const { log, sessions: allSessions, songs, topics, loading } = useData()
  const nav = useNavigate()
  const { t } = useT()
  const strum = useAnimation()
  const [strums, setStrums] = useState(0)
  const [ring, setRing] = useState(0)
  const [hint, setHint] = useState(false)
  const [slapBurst, setSlapBurst] = useState(0)
  const spinning = useRef(false)

  // Tap the bass: a quick wobble and an open string, E A D G in turn.
  async function pluck() {
    play(STRINGS[strums % STRINGS.length])
    setStrums((n) => n + 1)
    setRing(Date.now())
    if (strums === 2) {
      setHint(true)
      setTimeout(() => setHint(false), 2600)
    }
    if (spinning.current) return
    await strum.start({
      rotate: [0, -5, 4, -2, 1, 0],
      scale: [1, 1.04, 0.98, 1.02, 1],
      transition: { duration: 0.6, ease: 'easeOut' },
    })
  }

  // Type "slap" anywhere on this page.
  const slap = useCallback(async () => {
    if (spinning.current) return
    spinning.current = true
    setSlapBurst(Date.now())
    STRINGS.forEach((f, i) => setTimeout(() => play(f, { slap: true }), i * 90))
    await strum.start({
      rotate: [0, 360],
      scale: [1, 1.15, 1],
      transition: { duration: 0.9, ease: [0.34, 1.3, 0.64, 1] },
    })
    strum.set({ rotate: 0 })
    spinning.current = false
  }, [strum])
  useTypedWord('slap', slap)

  // The bass leans slightly toward the pointer.
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const rx = useSpring(tiltX, { stiffness: 120, damping: 14 })
  const ry = useSpring(tiltY, { stiffness: 120, damping: 14 })
  function lean(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    tiltY.set(((e.clientX - r.left) / r.width - 0.5) * 14)
    tiltX.set(-((e.clientY - r.top) / r.height - 0.5) * 10)
  }
  function unlean() {
    tiltX.set(0)
    tiltY.set(0)
  }

  const totalMin = log.reduce((a, l) => a + l.minutes, 0)
  const sessions = allSessions.length
  const since = daysAgoISO(6)
  const weekMin = log.filter((l) => l.date >= since).reduce((a, l) => a + l.minutes, 0)
  const weekSessions = allSessions.filter((s) => s.date >= since).length
  // one dot per day, oldest first; filled when something was logged
  const weekDays = Array.from({ length: 7 }, (_, i) => daysAgoISO(6 - i)).map((iso) => ({
    iso,
    on: log.some((l) => l.date === iso),
  }))
  const byCat = minutesByCategory(log)
  const byTopic = minutesByTopic(log)
  const touched = topics.filter((t) => (byTopic[t.id] ?? 0) > 0).length
  const status = countByStatus(songs)


  if (loading) return null

  return (
    <>
      <div className="dash-head" onMouseMove={lean} onMouseLeave={unlean}>
        <motion.div {...fadeUp(0)}>
          <h1 className="display">
            {totalMin === 0 ? (
              <>
                <Wave>{t('dash.empty1')}</Wave>
                <br />
                <span className="muted">
                  <Wave>{t('dash.empty2')}</Wave>
                </span>
              </>
            ) : (
              <>
                <strong>
                  <Jiggle>{fmtMinutes(totalMin)}</Jiggle>
                </strong>{' '}
                <Wave>{t('dash.onTheBass')}</Wave>
                <br />
                <Wave>{t('dash.across')}</Wave>{' '}
                <strong>
                  <Jiggle>{String(sessions)}</Jiggle>
                </strong>{' '}
                <Wave>{plural(sessions, 'session.', 'sessions.', 'сессию.', 'сессии.', 'сессий.')}</Wave>
              </>
            )}
          </h1>
        </motion.div>
        <div className="right has-burst">
          <Burst id={slapBurst} n={18} />
          <motion.div
            initial={{ opacity: 0, rotate: -14, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, rotate: -7, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.15 }}
            style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
          >
            <motion.div
              className="sticker-wrap"
              drag
              dragSnapToOrigin
              dragElastic={0.6}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 14 }}
              whileHover={{ scale: 1.03, rotate: 3 }}
              whileDrag={{ scale: 1.06, rotate: 6 }}
              animate={strum}
              onTap={pluck}
            >
              <Bolts id={ring} />
              <img
                className="sticker"
                src={`${import.meta.env.BASE_URL}bass.png`}
                alt={t('dash.bassAlt')}
                draggable={false}
              />
            </motion.div>
          </motion.div>
          <AnimatePresence>
            {hint && (
              <motion.span
                className="sticker-hint"
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                {t('dash.dragHint')}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.div {...fadeUp(2)} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Pep />
            <Link to="/journal" state={{ open: true }} className="btn">
              {t('dash.logTime')}
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="stat-row">
        <motion.div className="stat" style={tint('cyan')} {...fadeUp(1)}>
          <span className="stat-ic">
            <Icon name="calendar-week" />
          </span>
          <div className="num">
            <Counter value={weekMin} format={fmtMinutes} />
            <span className="suffix">
              {weekSessions} {plural(weekSessions, 'session', 'sessions', 'сессия', 'сессии', 'сессий')}
            </span>
          </div>
          <div className="label">{t('dash.last7')}</div>
          <div className="stat-days" aria-hidden>
            {weekDays.map((d, i) => (
              <motion.span
                key={d.iso}
                className={d.on ? 'on' : ''}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 0.3 + i * 0.05 }}
              />
            ))}
          </div>
        </motion.div>
        <motion.div className="stat" style={tint('violet')} {...fadeUp(2)}>
          <span className="stat-ic">
            <Icon name="book" />
          </span>
          <div className="num">
            <Counter value={touched} />
            <span className="suffix">{t('dash.of')} {topics.length}</span>
          </div>
          <div className="label">{t('dash.topicsTouched')}</div>
          <Track part={touched} total={topics.length} />
        </motion.div>
        <motion.div className="stat" style={tint('magenta')} {...fadeUp(3)}>
          <span className="stat-ic">
            <Icon name="headphones" />
          </span>
          <div className="num">
            <Counter value={status.learned} />
            <span className="suffix">{t('dash.of')} {songs.length}</span>
          </div>
          <div className="label">{t('dash.songsLearned')}</div>
          <Track part={status.learned} total={songs.length} />
        </motion.div>
      </div>

      <motion.section className="panel" {...fadeUp(4)}>
        <div className="panel-head">
          <div className="label"><Icon name="timer" /> {t('dash.whereTime')}</div>
          <span className="small faint">{t('dash.whereTimeHint')}</span>
        </div>
        <Rose minutes={byCat} onPick={(id) => nav(`/topics#${id}`)} />
      </motion.section>

      <motion.section className="panel" style={{ marginTop: 24 }} {...fadeUp(7)}>
        <div className="panel-head">
          <div className="label"><Icon name="calendar-days" /> {t('dash.rhythm')}</div>
          <span className="small faint">{t('dash.rhythmHint')}</span>
        </div>
        <Rhythm log={log} />
      </motion.section>

      <motion.section className="panel" style={{ marginTop: 24 }} {...fadeUp(8)}>
        <div className="panel-head">
          <div className="label"><Icon name="chart-bar" /> {t('dash.weeks')}</div>
          <span className="small faint">{t('dash.weeksHint')}</span>
        </div>
        <WeeklyBars log={log} />
      </motion.section>
    </>
  )
}

const tint = (c: 'cyan' | 'violet' | 'magenta') =>
  ({ '--c': `var(--${c})`, '--cd': `var(--${c}-d)` }) as CSSProperties

/** Thin progress track under a "part of total" number. */
function Track({ part, total }: { part: number; total: number }) {
  const w = total > 0 ? Math.min(1, part / total) : 0
  return (
    <div className="stat-track" aria-hidden>
      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: w }}
        transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.35 }}
      />
    </div>
  )
}
