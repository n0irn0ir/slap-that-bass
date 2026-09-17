import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CATEGORY_BY_ID } from '../lib/categories'
import { fmtDate, fmtMinutes } from '../lib/format'
import { catText, plural, useT } from '../lib/i18n'
import { face } from '../lib/rating'
import { sessionLabel } from '../lib/sessions'
import { useData } from '../state/DataContext'
import { Jelly } from './ui'

/** Everything the journal knows about one topic: every session it appeared in, newest first. */
export function TopicHistory({ topicId, onClose }: { topicId: string | null; onClose: () => void }) {
  const { topics, sessions, log } = useData()
  const nav = useNavigate()
  const { t } = useT()
  const topic = topics.find((x) => x.id === topicId) ?? null

  useEffect(() => {
    if (!topicId) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [topicId, onClose])

  const rows = useMemo(() => {
    if (!topic) return []
    return log
      .filter((l) => l.topic_id === topic.id)
      .map((l) => ({ line: l, session: sessions.find((s) => s.id === l.session_id) ?? null }))
      .sort((a, b) => (a.line.date < b.line.date ? 1 : a.line.date > b.line.date ? -1 : 0))
  }, [topic, log, sessions])

  const total = rows.reduce((a, r) => a + r.line.minutes, 0)
  const cat = topic ? CATEGORY_BY_ID[topic.category] : null

  return createPortal(
    <AnimatePresence>
      {topic && cat && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onClick={onClose}
        >
          <motion.div
            className="modal topic-history"
            role="dialog"
            aria-label={topic.title}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <div className="modal-head">
              <div>
                <span className="label" style={{ color: cat.deep }}>
                  <span className="cat-dot" style={{ background: cat.color, marginRight: 0 }} />
                  {catText(topic.category).name}
                </span>
                <h2 className="h2" style={{ margin: '6px 0 4px' }}>
                  {topic.title}
                </h2>
                <div className="small muted">
                  {rows.length === 0
                    ? t('history.never')
                    : t('history.sum', {
                        time: fmtMinutes(total),
                        n: rows.length,
                        sessions: plural(rows.length, 'session', 'sessions', 'сессия', 'сессии', 'сессий'),
                      })}
                </div>
              </div>
              <button type="button" className="modal-close" onClick={onClose} aria-label={t('journal.cancel')}>
                ✕
              </button>
            </div>

            {rows.length > 0 && (
              <div className="history">
                {rows.map(({ line, session }, i) => (
                  <motion.div
                    key={line.id}
                    className="history-row"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i, 12) * 0.03 }}
                  >
                    <span className="t mono small">{fmtDate(line.date)}</span>
                    <span className="body">
                      <span className="ttl">
                        {session ? sessionLabel(session) : t('journal.defaultTitle')}
                        {session && face(session.rating) && <span className="face-sm">{face(session.rating)}</span>}
                      </span>
                      {session?.note && <span className="note">{session.note}</span>}
                    </span>
                    <span className="m mono small">{fmtMinutes(line.minutes)}</span>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="modal-foot" style={{ marginTop: 18 }}>
              <Jelly
                type="button"
                className="btn"
                onClick={() => {
                  onClose()
                  nav('/journal', { state: { category: topic.category, topic_id: topic.id } })
                }}
              >
                {t('history.log')}
              </Jelly>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
