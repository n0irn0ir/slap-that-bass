import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fmtMinutes } from '../lib/format'
import { useT } from '../lib/i18n'
import { RANKS, badgeSrc, rankFor } from '../lib/ranks'
import { Burst, Jelly } from './ui'

// Silhouette of the real badges (316×356 box, same disc, pill and number circle).
const BADGE_PATH =
  'M 8 298 A 48 48 0 0 1 56 250 L 63 250 A 139 139 0 1 1 269 250 L 258 250 A 48 48 0 0 1 306 298 A 48 48 0 0 1 258 346 L 56 346 A 48 48 0 0 1 8 298 Z'

/** Locked rank: the badge's own shape, muted, with a question mark. */
function Mystery({ n, name, hours, peel }: { n: number; name: string; hours: number; peel?: string }) {
  const clip = `mystery-clip-${n}`
  return (
    <svg className={`rank-mystery${peel ? ' peel' : ''}`} viewBox="0 0 316 356" aria-hidden>
      <defs>
        <clipPath id={clip}>
          <path d={BADGE_PATH} />
        </clipPath>
      </defs>
      {/* everything lives inside the badge silhouette */}
      <g clipPath={`url(#${clip})`}>
        {peel && <image href={peel} x="0" y="0" width="316" height="356" preserveAspectRatio="xMidYMid slice" />}
        {/* cover sheet; for the next rank its top-right corner is cut away along a curve (see .rank-cover-sheet) */}
        <path className="rank-cover-sheet" d={BADGE_PATH} fill="var(--bg)" />
        {peel && (
          <>
            <path className="rank-flap-shadow" d="M 150 0 Q 210 90 316 170 L 316 0 Z" fill="rgba(0,0,0,0.16)" />
            <path className="rank-flap" d="M 150 0 Q 210 90 316 170 Q 300 60 150 0 Z" />
          </>
        )}
      </g>
      <path d={BADGE_PATH} fill="none" stroke="var(--line-2)" strokeWidth="4" strokeDasharray="12 9" />
      <circle cx="72" cy="72" r="58" fill="var(--paper)" stroke="var(--line-2)" strokeWidth="4" />
      <text x="72" y="74" textAnchor="middle" dominantBaseline="middle" className="rank-mystery-n">
        {n}
      </text>
      <text x="166" y="165" textAnchor="middle" dominantBaseline="middle" className="rank-mystery-q">
        ?
      </text>
      <text x="158" y="283" textAnchor="middle" dominantBaseline="middle" className="rank-mystery-h">
        {name}
      </text>
      <text x="158" y="316" textAnchor="middle" dominantBaseline="middle" className="rank-mystery-sub">
        {hours} h
      </text>
    </svg>
  )
}

const CONFETTI_COLORS = ['var(--hot)', 'var(--hot-cyan)', 'var(--hot-lime)', 'var(--violet)', 'var(--teal)', 'var(--orange)']

/** Full-screen confetti rain. Re-render with a new `id` to fire. */
export function Confetti({ id, n = 90 }: { id: number; n?: number }) {
  const [live, setLive] = useState<number | null>(null)
  useEffect(() => {
    if (!id) return
    setLive(id)
    const t = setTimeout(() => setLive(null), 4200)
    return () => clearTimeout(t)
  }, [id])
  if (!live) return null
  let seed = live % 100003
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: n }).map((_, i) => {
        const x = rnd() * 100
        const drift = (rnd() - 0.5) * 30
        const dur = 2.6 + rnd() * 1.6
        const delay = rnd() * 0.9
        const spin = 360 + rnd() * 720
        return (
          <motion.i
            key={`${live}-${i}`}
            style={{ left: `${x}vw`, background: CONFETTI_COLORS[i % CONFETTI_COLORS.length], width: 6 + rnd() * 8, height: 10 + rnd() * 10 }}
            initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: '110vh', x: `${drift}vw`, rotate: spin, opacity: [1, 1, 0.9, 0] }}
            transition={{ duration: dur, delay, ease: [0.2, 0.6, 0.4, 1] }}
          />
        )
      })}
    </div>
  )
}

const SEEN_KEY = 'rank.seen'

/** Watches total minutes; when a new rank is crossed, celebrates once. */
export function LevelUpWatcher({ totalMinutes, ready }: { totalMinutes: number; ready: boolean }) {
  const { t } = useT()
  const { current } = rankFor(totalMinutes)
  const [show, setShow] = useState<number | null>(null)
  const [confetti, setConfetti] = useState(0)
  const primed = useRef(false)

  useEffect(() => {
    if (!ready) return
    let seen = 0
    try {
      seen = Number(localStorage.getItem(SEEN_KEY) ?? '0')
    } catch {
      /* no storage */
    }
    // First load with no record: adopt the current rank silently (no popup for old progress).
    if (!primed.current) {
      primed.current = true
      if (!seen) {
        try {
          localStorage.setItem(SEEN_KEY, String(current.n))
        } catch {
          /* fine */
        }
        return
      }
    }
    if (current.n > seen) {
      try {
        localStorage.setItem(SEEN_KEY, String(current.n))
      } catch {
        /* fine */
      }
      setShow(current.n)
      setConfetti(Date.now())
    }
  }, [current.n, ready])

  const rank = RANKS.find((r) => r.n === show)
  return (
    <>
      <Confetti id={confetti} />
      {createPortal(
        <AnimatePresence>
          {rank && (
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              onClick={() => setShow(null)}
            >
              <motion.div
                className="modal levelup"
                role="dialog"
                aria-label={t('rank.up')}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 40, scale: 0.9, rotate: -3 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <span className="label" style={{ justifyContent: 'center' }}>
                  {t('rank.up')} · {t('rank.level')} {rank.n}
                </span>
                <motion.div
                  className="rank-cell has-burst"
                  initial={{ scale: 0.3, rotate: -25, filter: 'blur(8px)', opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, filter: 'blur(0px)', opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.25 }}
                >
                  <img src={badgeSrc(rank.n)} alt="" draggable={false} />
                  <Burst id={confetti} n={18} />
                </motion.div>
                <h2 className="h2">{rank.name}</h2>
                <p className="muted small" style={{ margin: '0 0 20px' }}>
                  {t('rank.upSub')}
                </p>
                <Jelly type="button" className="btn" onClick={() => setShow(null)}>
                  {t('rank.upOk')}
                </Jelly>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

/** Current-rank badge for the top bar; opens the full map on click. */
export function RankBadge({ totalMinutes }: { totalMinutes: number }) {
  const { current, next, progress } = rankFor(totalMinutes)
  const [open, setOpen] = useState(false)
  const { t } = useT()
  const R = 15
  const C = 2 * Math.PI * R
  return (
    <>
      <motion.button
        type="button"
        className="rank-btn"
        onClick={() => setOpen(true)}
        title={next ? `${current.name} · ${t('rank.next', { name: next.name, h: next.hours })}` : current.name}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      >
        <span className="rank-ring">
          <svg viewBox="0 0 36 36" aria-hidden>
            <circle cx="18" cy="18" r={R} fill="none" stroke="var(--line)" strokeWidth="2.5" />
            <motion.circle
              cx="18"
              cy="18"
              r={R}
              fill="none"
              stroke="var(--hot)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - progress) }}
              transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.3 }}
              transform="rotate(-90 18 18)"
            />
          </svg>
          <motion.img
            key={current.n}
            src={badgeSrc(current.n)}
            alt=""
            draggable={false}
            initial={{ scale: 0.5, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 16 }}
          />
        </span>
        <span className="rank-text">
          <span className="rank-level">
            {t('rank.level')} {current.n}
          </span>
          <span className="rank-name">{current.name}</span>
        </span>
      </motion.button>
      <RankMap open={open} onClose={() => setOpen(false)} totalMinutes={totalMinutes} />
    </>
  )
}

function RankMap({ open, onClose, totalMinutes }: { open: boolean; onClose: () => void; totalMinutes: number }) {
  const { t } = useT()
  const { current, next, progress } = rankFor(totalMinutes)
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    if (!open) return
    setBurst(Date.now())
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onClick={onClose}
        >
          <motion.div
            className="modal rank-map"
            role="dialog"
            aria-label={t('rank.map')}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <div className="modal-head">
              <div>
                <span className="label">{t('rank.map')}</span>
                <div className="rank-summary">
                  <strong>{current.name}</strong>
                  <span className="muted">
                    {' · '}
                    {fmtMinutes(totalMinutes)}
                    {next && (
                      <>
                        {' · '}
                        {t('rank.next', { name: next.name, h: next.hours })}
                      </>
                    )}
                  </span>
                </div>
                {next && (
                  <div className="rank-track">
                    <motion.div
                      className="rank-fill"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: progress }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.3 }}
                    />
                  </div>
                )}
              </div>
              <button type="button" className="link-btn" onClick={onClose} aria-label={t('log.cancel')}>
                ✕
              </button>
            </div>

            <div className="rank-grid">
              {RANKS.map((r, i) => {
                const earned = r.n <= current.n
                const isCurrent = r.n === current.n
                const isNext = next?.n === r.n
                return (
                  <motion.div
                    key={r.n}
                    className={`rank-cell${earned ? ' earned' : ' locked'}${isCurrent ? ' current has-burst' : ''}${isNext ? ' next' : ''}`}
                    initial={{ opacity: 0, y: 14, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 + i * 0.05 }}
                    whileHover={earned ? { scale: 1.06, rotate: i % 2 ? 2 : -2 } : { scale: 1.03 }}
                    title={earned ? r.name : `${t('rank.level')} ${r.n} · ${r.hours} h`}
                  >
                    {earned ? (
                      <img src={badgeSrc(r.n)} alt={`${r.n} ${r.name}`} draggable={false} />
                    ) : (
                      <Mystery n={r.n} name={r.name} hours={r.hours} peel={isNext ? badgeSrc(r.n) : undefined} />
                    )}
                    {isCurrent && <Burst id={burst} n={14} />}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
