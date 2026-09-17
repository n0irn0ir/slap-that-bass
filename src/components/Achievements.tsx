import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ACHIEVEMENTS, earnedIds } from '../lib/achievements'
import { useT, type Key } from '../lib/i18n'
import { useData } from '../state/DataContext'
import { Confetti } from './Ranks'
import { Burst, Jelly } from './ui'

const SEEN_KEY = 'ach.seen'

function readSeen(): string[] | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}
function writeSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids))
  } catch {
    /* fine */
  }
}

/** Ids earned now, plus anything earned before on this device (a sticker never comes off). */
export function useEarned(): Set<string> {
  const { sessions, log, topics, songs } = useData()
  return useMemo(() => {
    const now = earnedIds({ sessions, log, topics, songs })
    return new Set([...now, ...(readSeen() ?? [])])
  }, [sessions, log, topics, songs])
}

/** Shows each newly earned sticker once, with confetti. Lives in the shell. */
export function AchievementWatcher({ ready }: { ready: boolean }) {
  const { t } = useT()
  const { sessions, log, topics, songs } = useData()
  const [queue, setQueue] = useState<string[]>([])
  const [confetti, setConfetti] = useState(0)
  const primed = useRef(false)

  useEffect(() => {
    if (!ready) return
    const now = earnedIds({ sessions, log, topics, songs })
    const seen = readSeen()
    // First load with no record: adopt everything earned so far without a popup.
    if (!primed.current) {
      primed.current = true
      if (seen === null) {
        writeSeen(now)
        return
      }
    }
    const fresh = now.filter((id) => !(seen ?? []).includes(id))
    if (fresh.length) {
      writeSeen([...(seen ?? []), ...fresh])
      setQueue((q) => [...q, ...fresh])
      setConfetti(Date.now())
    }
  }, [sessions, log, topics, songs, ready])

  const id = queue[0]
  const a = ACHIEVEMENTS.find((x) => x.id === id)
  const close = () => setQueue((q) => q.slice(1))

  return (
    <>
      <Confetti id={confetti} n={60} />
      {createPortal(
        <AnimatePresence>
          {a && (
            <motion.div
              key={a.id}
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              onClick={close}
            >
              <motion.div
                className="modal levelup"
                role="dialog"
                aria-label={t('ach.new')}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 40, scale: 0.9, rotate: 3 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <span className="label" style={{ justifyContent: 'center' }}>
                  {t('ach.new')}
                </span>
                <motion.div
                  className="ach-stamp big has-burst"
                  initial={{ scale: 0.3, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: -6, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.2 }}
                >
                  <span className="glyph">{a.glyph}</span>
                  <Burst id={confetti} n={14} />
                </motion.div>
                <h2 className="h2">{t(`ach.${a.id}.name` as Key)}</h2>
                <p className="muted small" style={{ margin: '0 0 20px' }}>
                  {t(`ach.${a.id}.desc` as Key)}
                </p>
                <Jelly type="button" className="btn" onClick={close}>
                  {t('ach.ok')}
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

/** All stickers, earned ones in colour, the rest waiting. For the ranks modal. */
export function AchievementGrid() {
  const { t } = useT()
  const earned = useEarned()
  return (
    <div className="ach-grid">
      {ACHIEVEMENTS.map((a, i) => {
        const on = earned.has(a.id)
        return (
          <motion.div
            key={a.id}
            className={`ach${on ? ' on' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 + i * 0.04 }}
            whileHover={on ? { rotate: i % 2 ? 3 : -3, scale: 1.04 } : undefined}
          >
            <span className="ach-stamp">
              <span className="glyph">{on ? a.glyph : '?'}</span>
            </span>
            <span className="ach-name">{t(`ach.${a.id}.name` as Key)}</span>
            <span className="ach-desc">{t(`ach.${a.id}.desc` as Key)}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
