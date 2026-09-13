import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Toast } from '../components/fun'
import { Burst, Jelly, Segmented, listItem } from '../components/ui'
import { CATEGORIES, CATEGORY_BY_ID } from '../lib/categories'
import { fmtDate, fmtMinutes, todayISO } from '../lib/format'
import { catText, plural, useT } from '../lib/i18n'
import { FACES, face, faceLabel } from '../lib/rating'
import type { CategoryId, LogEntry } from '../lib/types'
import { useData } from '../state/DataContext'

const QUICK = [10, 15, 20, 25, 30, 45]

interface Prefill {
  open?: boolean
  category?: CategoryId
  topic_id?: string
}

export function Log() {
  const { log, topics, loading, addLog, updateLog, deleteLog } = useData()
  const { state } = useLocation() as { state: Prefill | null }
  const nav = useNavigate()
  const { t } = useT()

  const [open, setOpen] = useState(!!state?.open || !!state?.topic_id)
  const [editing, setEditing] = useState<LogEntry | null>(null)
  const [prefill, setPrefill] = useState<Prefill | null>(state)
  const [burst, setBurst] = useState(0)
  const [toast, setToast] = useState<{ id: number; text: string }>({ id: 0, text: '' })

  // Consume router state once, so a reload does not reopen the form.
  useEffect(() => {
    if (state) nav('.', { replace: true, state: null })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => {
    const map = new Map<string, LogEntry[]>()
    for (const l of log) {
      const arr = map.get(l.date) ?? []
      arr.push(l)
      map.set(l.date, arr)
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([d, items]) => ({
        date: d,
        items: items.sort((a, b) => b.created_at.localeCompare(a.created_at)),
        total: items.reduce((s, l) => s + l.minutes, 0),
      }))
  }, [log])

  function openNew() {
    setEditing(null)
    setPrefill(null)
    setOpen(true)
  }

  function openEdit(l: LogEntry) {
    setEditing(l)
    setPrefill(null)
    setOpen(true)
  }

  async function save(payload: Omit<LogEntry, 'id' | 'created_at'>) {
    if (editing) await updateLog(editing.id, payload)
    else {
      const before = log.reduce((a, l) => a + l.minutes, 0)
      await addLog(payload)
      const hoursBefore = Math.floor(before / 60)
      const hoursAfter = Math.floor((before + payload.minutes) / 60)
      if (hoursAfter > hoursBefore) {
        setToast({
          id: Date.now(),
          text: t('log.hours', { n: hoursAfter, hours: plural(hoursAfter, 'hour', 'hours', 'час', 'часа', 'часов') }),
        })
      }
    }
    setOpen(false)
    setBurst(Date.now())
  }

  const topicName = (id: string | null) => topics.find((t) => t.id === id)?.title

  if (loading) return null

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="display">{t('log.title')}</h1>
          <p className="muted">{t('log.lead')}</p>
        </div>
        <div className="add-topic has-burst">
          <Jelly type="button" className="btn" onClick={openNew}>
            <span className="plus" aria-hidden>
              +
            </span>
            {t('log.button')}
          </Jelly>
          <Burst id={burst} />
        </div>
      </div>

      <Toast id={toast.id}>{toast.text}</Toast>

      {days.length === 0 ? (
        <div className="empty">{t('log.empty')}</div>
      ) : (
        <div className="timeline">
          {days.map((d, di) => (
            <motion.section
              key={d.date}
              className="day"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(di, 10) * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
            >
              <span className="node" aria-hidden />
              <div className="day-head">
                <span className="h3">{fmtDate(d.date)}</span>
                <span className="mono small muted">{fmtMinutes(d.total)}</span>
              </div>
              <AnimatePresence initial={false}>
                {d.items.map((l) => (
                  <motion.div key={l.id} className="entry" layout="position" {...listItem}>
                    <span className="m">
                      {l.minutes}
                      {t('unit.m')}
                      {face(l.rating) && <span className="face-sm">{face(l.rating)}</span>}
                    </span>
                    <div>
                      <span className="cat-dot" style={{ background: CATEGORY_BY_ID[l.category].color }} />
                      <span className="cat">{catText(l.category).name}</span>
                      {l.topic_id && topicName(l.topic_id) && (
                        <span className="topic-name"> · {topicName(l.topic_id)}</span>
                      )}
                      {l.note && <div className="note">{l.note}</div>}
                    </div>
                    <div className="acts">
                      <button type="button" className="link-btn" onClick={() => openEdit(l)}>
                        {t('log.edit')}
                      </button>
                      <button
                        type="button"
                        className="link-btn danger"
                        onClick={() => confirm(t('log.deleteConfirm')) && deleteLog(l.id)}
                      >
                        {t('log.delete')}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.section>
          ))}
        </div>
      )}

      <LogModal
        open={open}
        editing={editing}
        prefill={prefill}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  )
}

/* ---------- the form, in a modal ---------- */

function LogModal({
  open,
  editing,
  prefill,
  onClose,
  onSave,
}: {
  open: boolean
  editing: LogEntry | null
  prefill: Prefill | null
  onClose: () => void
  onSave: (payload: Omit<LogEntry, 'id' | 'created_at'>) => Promise<void>
}) {
  const { topics, createTopic } = useData()
  const { t } = useT()
  const [date, setDate] = useState(todayISO())
  const [category, setCategory] = useState<CategoryId>('technique')
  const [topicId, setTopicId] = useState('')
  const [topicText, setTopicText] = useState('')
  const [topicFocus, setTopicFocus] = useState(false)
  const [minutes, setMinutes] = useState('')
  const [note, setNote] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  // Fill the form each time it opens: from the entry being edited, from a prefill, or blank.
  useEffect(() => {
    if (!open) return
    if (editing) {
      setDate(editing.date)
      setCategory(editing.category)
      setTopicId(editing.topic_id ?? '')
      setTopicText(topics.find((x) => x.id === editing.topic_id)?.title ?? '')
      setMinutes(String(editing.minutes))
      setNote(editing.note ?? '')
      setRating(editing.rating ?? null)
    } else {
      setDate(todayISO())
      setCategory(prefill?.category ?? 'technique')
      setTopicId(prefill?.topic_id ?? '')
      setTopicText(topics.find((x) => x.id === prefill?.topic_id)?.title ?? '')
      setMinutes('')
      setNote('')
      setRating(null)
    }
  }, [open, editing, prefill]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const catTopics = topics.filter((x) => x.category === category)
  useEffect(() => {
    // Switching category drops a topic that belongs elsewhere.
    if (topicId && !catTopics.some((x) => x.id === topicId)) {
      setTopicId('')
      setTopicText('')
    }
  }, [category, topicId, catTopics])

  const query = topicText.trim().toLowerCase()
  const exact = catTopics.find((x) => x.title.trim().toLowerCase() === query)
  const matches = query ? catTopics.filter((x) => x.title.toLowerCase().includes(query)) : catTopics
  const canCreate = !!query && !exact

  function pick(x: { id: string; title: string }) {
    setTopicId(x.id)
    setTopicText(x.title)
    setTopicFocus(false)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const m = parseInt(minutes, 10)
    if (!m || m <= 0) return
    setBusy(true)
    let tid: string | null = topicId || exact?.id || null
    if (!tid && canCreate) {
      const created = await createTopic({ category, title: topicText.trim(), sort: catTopics.length })
      tid = created?.id ?? null
    }
    await onSave({ date, category, topic_id: tid, minutes: m, note: note.trim() || null, rating })
    setBusy(false)
  }

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
          <motion.form
            className="modal log-form"
            role="dialog"
            aria-label={editing ? t('log.editing') : t('log.new')}
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            initial={{ opacity: 0, y: 40, scale: 0.94, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 24, scale: 0.96, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <div className="modal-head">
              <span className="label">{editing ? t('log.editing') : t('log.new')}</span>
              <button type="button" className="link-btn" onClick={onClose} aria-label={t('log.cancel')}>
                ✕
              </button>
            </div>

            <div className="field">
              <span className="label">{t('log.category')}</span>
              <Segmented
                name="category"
                className="grid3"
                color={CATEGORY_BY_ID[category].deep}
                value={category}
                options={CATEGORIES.map((c) => ({ value: c.id, label: catText(c.id).short }))}
                onChange={setCategory}
              />
            </div>

            <div className="field combo">
              <span className="label">{t('log.topic')}</span>
              <input
                className="input"
                value={topicText}
                placeholder={t('log.topicPlaceholder')}
                onChange={(e) => {
                  setTopicText(e.target.value)
                  setTopicId('')
                }}
                onFocus={() => setTopicFocus(true)}
                onBlur={() => setTimeout(() => setTopicFocus(false), 120)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (exact) pick(exact)
                    else if (matches.length === 1 && !canCreate) pick(matches[0])
                    setTopicFocus(false)
                  }
                }}
                autoComplete="off"
              />
              <AnimatePresence>
                {topicFocus && (matches.length > 0 || canCreate) && (
                  <motion.ul
                    className="combo-list"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.15 }}
                  >
                    {canCreate && (
                      <li className="create" onMouseDown={() => setTopicFocus(false)}>
                        <span className="plus">+</span>{' '}
                        {t('log.createTopic', { cat: catText(category).name, title: topicText.trim() })}
                      </li>
                    )}
                    {matches.map((x) => (
                      <li key={x.id} className={x.id === topicId ? 'on' : ''} onMouseDown={() => pick(x)}>
                        {x.title}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <div className="two">
              <div className="field">
                <span className="label">{t('log.minutes')}</span>
                <div className="minutes-big">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={600}
                    placeholder="25"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    aria-label={t('log.minutes')}
                    autoFocus
                    required
                  />
                  <span>{t('log.min')}</span>
                </div>
              </div>
              <label className="field">
                <span className="label">{t('log.date')}</span>
                <input
                  className="input mono"
                  type="date"
                  value={date}
                  max={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            </div>
            <div className="chips">
              {QUICK.map((q) => (
                <motion.button
                  key={q}
                  type="button"
                  className={`chip${minutes === String(q) ? ' on' : ''}`}
                  onClick={() => setMinutes(String(q))}
                  whileTap={{ scale: 0.85, rotate: -6 }}
                >
                  {q}
                </motion.button>
              ))}
            </div>
            {parseInt(minutes, 10) >= 90 && (
              <motion.div className="small muted" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                {t('log.long')}
              </motion.div>
            )}

            <div className="field">
              <span className="label">{t('log.rating')}</span>
              <div className="rates" role="radiogroup" aria-label={t('log.ratingAria')}>
                {FACES.map((f, i) => {
                  const v = i + 1
                  const on = rating === v
                  return (
                    <motion.button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={faceLabel(i)}
                      title={faceLabel(i)}
                      className={`rate${on ? ' on' : ''}${rating && !on ? ' dim' : ''}`}
                      onClick={() => setRating(on ? null : v)}
                      whileHover={{ scale: 1.25, rotate: i % 2 ? 8 : -8 }}
                      whileTap={{ scale: 0.8 }}
                      animate={on ? { scale: [1, 1.5, 1.2], rotate: [0, -12, 0] } : { scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                    >
                      {f}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <label className="field">
              <span className="label">{t('log.note')}</span>
              <textarea
                className="textarea"
                placeholder={t('log.notePlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>

            <div className="modal-foot">
              <button className="btn ghost" type="button" onClick={onClose}>
                {t('log.cancel')}
              </button>
              <Jelly className="btn" type="submit" disabled={!minutes || busy}>
                {editing ? t('log.saveChanges') : t('log.addEntry')}
              </Jelly>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
