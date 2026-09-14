import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { fmtMinutes } from '../lib/format'
import { useT } from '../lib/i18n'
import { RANKS, badgeSrc, rankFor } from '../lib/ranks'
import { Burst } from './ui'

// Silhouette of the real badges (316×356 box, same disc, pill and number circle).
const BADGE_PATH =
  'M 8 298 A 48 48 0 0 1 56 250 L 63 250 A 139 139 0 1 1 269 250 L 258 250 A 48 48 0 0 1 306 298 A 48 48 0 0 1 258 346 L 56 346 A 48 48 0 0 1 8 298 Z'

/** Locked rank: the badge's own shape, muted, with a question mark. */
function Mystery({ n, hours, remaining }: { n: number; hours: number; remaining: string | null }) {
  return (
    <svg className="rank-mystery" viewBox="0 0 316 356" aria-hidden>
      <path d={BADGE_PATH} fill="var(--bg)" stroke="var(--line-2)" strokeWidth="4" strokeDasharray="12 9" />
      <circle cx="72" cy="72" r="58" fill="var(--paper)" stroke="var(--line-2)" strokeWidth="4" />
      <text x="72" y="74" textAnchor="middle" dominantBaseline="middle" className="rank-mystery-n">
        {n}
      </text>
      <text x="166" y="170" textAnchor="middle" dominantBaseline="middle" className="rank-mystery-q">
        ?
      </text>
      <text x="158" y={remaining ? 280 : 298} textAnchor="middle" dominantBaseline="middle" className="rank-mystery-h">
        {remaining ?? `${hours} h`}
      </text>
      {remaining && (
        <text x="158" y="316" textAnchor="middle" dominantBaseline="middle" className="rank-mystery-sub">
          {hours} h
        </text>
      )}
    </svg>
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
                const left = isNext ? Math.max(0, r.hours * 60 - totalMinutes) : 0
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
                    ) : isNext ? (
                      <div className="rank-peel">
                        {/* the real badge underneath, only its corner showing */}
                        <img src={badgeSrc(r.n)} alt="" draggable={false} className="rank-peel-under" />
                        <div className="rank-peel-cover">
                          <Mystery n={r.n} hours={r.hours} remaining={t('rank.left', { t: fmtMinutes(left) })} />
                        </div>
                        <span className="rank-peel-flap" aria-hidden />
                      </div>
                    ) : (
                      <Mystery n={r.n} hours={r.hours} remaining={null} />
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
