import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Calendar } from '../components/Calendar'
import { Toast } from '../components/fun'
import { Icon } from '../components/Icon'
import { TopicHistory } from '../components/TopicHistory'
import { Burst, Jelly, listItem } from '../components/ui'
import { CATEGORIES, CATEGORY_BY_ID } from '../lib/categories'
import { fmtDate, fmtMinutes, todayISO } from '../lib/format'
import { catText, plural, useT } from '../lib/i18n'
import { FACES, face, faceLabel } from '../lib/rating'
import { linesOf, sessionLabel, splitMinutes } from '../lib/sessions'
import type { NewItem, NewSession } from '../lib/store'
import type { CategoryId, LogEntry, Session, Song } from '../lib/types'
import { useData } from '../state/DataContext'

const QUICK = [15, 30, 45, 60, 90, 120]

interface Prefill {
  open?: boolean
  category?: CategoryId
  topic_id?: string
  date?: string
}

const songName = (s: Song) => `${s.artist} — ${s.title}`

export function Journal() {
  const { sessions, log, topics, songs, loading, addSession, updateSession, deleteSession } = useData()
  const { state } = useLocation() as { state: Prefill | null }
  const nav = useNavigate()
  const { t } = useT()

  const [open, setOpen] = useState(!!state?.open || !!state?.topic_id)
  const [editing, setEditing] = useState<Session | null>(null)
  const [prefill, setPrefill] = useState<Prefill | null>(state)
  const [burst, setBurst] = useState(0)
  const [toast, setToast] = useState<{ id: number; text: string }>({ id: 0, text: '' })
  const [flash, setFlash] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<string | null>(null)

  function jumpTo(iso: string) {
    document.getElementById(`day-${iso}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlash(iso)
    setTimeout(() => setFlash(null), 1400)
  }

  function newOn(iso: string) {
    setEditing(null)
    setPrefill({ date: iso })
    setOpen(true)
  }

  // Consume router state once, so a reload does not reopen the form.
  useEffect(() => {
    if (state) nav('.', { replace: true, state: null })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Search matches the title, the note, and the names of topics / songs on the lines.
  const q = query.trim().toLowerCase()
  const shown = useMemo(() => {
    if (!q) return sessions
    const topicName = new Map(topics.map((x) => [x.id, x.title.toLowerCase()]))
    const songNm = new Map(songs.map((x) => [x.id, songName(x).toLowerCase()]))
    return sessions.filter((s) => {
      if (s.title?.toLowerCase().includes(q) || s.note?.toLowerCase().includes(q)) return true
      if (!s.title && sessionLabel(s).toLowerCase().includes(q)) return true
      return log.some(
        (l) =>
          l.session_id === s.id &&
          ((l.topic_id && topicName.get(l.topic_id)?.includes(q)) ||
            (l.song_id && songNm.get(l.song_id)?.includes(q)) ||
            catText(l.category).name.toLowerCase().includes(q)),
      )
    })
  }, [q, sessions, log, topics, songs])

  const days = useMemo(() => {
    const map = new Map<string, Session[]>()
    for (const s of shown) {
      const arr = map.get(s.date) ?? []
      arr.push(s)
      map.set(s.date, arr)
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([d, items]) => ({
        date: d,
        items: items.sort((a, b) => b.created_at.localeCompare(a.created_at)),
        total: items.reduce((sum, s) => sum + s.minutes, 0),
      }))
  }, [shown])

  function openNew() {
    setEditing(null)
    setPrefill(null)
    setOpen(true)
  }

  function openEdit(s: Session) {
    setEditing(s)
    setPrefill(null)
    setOpen(true)
  }

  async function save(session: NewSession, items: NewItem[]) {
    if (editing) await updateSession(editing.id, session, items)
    else {
      const before = log.reduce((a, l) => a + l.minutes, 0)
      await addSession(session, items)
      const hoursBefore = Math.floor(before / 60)
      const hoursAfter = Math.floor((before + session.minutes) / 60)
      if (hoursAfter > hoursBefore) {
        setToast({
          id: Date.now(),
          text: t('journal.hours', {
            n: hoursAfter,
            hours: plural(hoursAfter, 'hour', 'hours', 'час', 'часа', 'часов'),
          }),
        })
      }
    }
    setOpen(false)
    setBurst(Date.now())
  }

  const lineName = (l: LogEntry) => {
    const topic = l.topic_id ? topics.find((x) => x.id === l.topic_id) : null
    if (topic) return topic.title
    const song = l.song_id ? songs.find((x) => x.id === l.song_id) : null
    if (song) return songName(song)
    return catText(l.category).name
  }

  if (loading) return null

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="display">{t('journal.title')}</h1>
          <p className="muted">{t('journal.lead')}</p>
        </div>
        <div className="add-topic has-burst">
          <Jelly type="button" className="btn" onClick={openNew}>
            <span className="plus" aria-hidden>
              +
            </span>
            {t('journal.button')}
          </Jelly>
          <Burst id={burst} />
        </div>
      </div>

      <Toast id={toast.id}>{toast.text}</Toast>
      <TopicHistory topicId={history} onClose={() => setHistory(null)} />

      <div className="log-layout">
        <div>
          {sessions.length > 0 && (
            <label className="search">
              <Icon name="search" />
              <input
                type="search"
                value={query}
                placeholder={t('journal.search')}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t('journal.search')}
              />
              {q && (
                <span className="small faint">
                  {t('journal.found', { n: shown.length })}
                </span>
              )}
            </label>
          )}
        {days.length === 0 ? (
          <div className="empty">{q ? t('journal.noMatch') : t('journal.empty')}</div>
        ) : (
          <div className="timeline">
            {days.map((d, di) => (
              <motion.section
                key={d.date}
                id={`day-${d.date}`}
                className={`day${flash === d.date ? ' flash' : ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(di, 10) * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
              >
                <span className="node" aria-hidden />
                <div className="day-head">
                  <span className="h3">{fmtDate(d.date)}</span>
                  {d.items.length > 1 && <span className="mono small muted">{fmtMinutes(d.total)}</span>}
                </div>
                <AnimatePresence initial={false}>
                  {d.items.map((s) => {
                    const lines = linesOf(log, s.id)
                    return (
                      <motion.article key={s.id} className="sess" layout="position" {...listItem}>
                        <div className="sess-head">
                          <span className="sess-title">{sessionLabel(s)}</span>
                          <span className="sess-meta mono small">
                            {face(s.rating) && <span className="face-sm">{face(s.rating)}</span>}
                            {fmtMinutes(s.minutes)}
                          </span>
                        </div>
                        {lines.length > 0 && (
                          <div className="sess-lines">
                            {lines.map((l) => (
                              <button
                                key={l.id}
                                type="button"
                                className={`line-chip${l.topic_id ? ' clickable' : ''}`}
                                style={{ '--c': CATEGORY_BY_ID[l.category].color } as CSSProperties}
                                onClick={() => l.topic_id && setHistory(l.topic_id)}
                                tabIndex={l.topic_id ? 0 : -1}
                              >
                                <span className="cat-dot" style={{ background: CATEGORY_BY_ID[l.category].color }} />
                                {lineName(l)}
                                {lines.length > 1 && <span className="line-min">{l.minutes}{t('unit.m')}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                        {s.note && <div className="note">{s.note}</div>}
                        <div className="acts">
                          <button type="button" className="link-btn" onClick={() => openEdit(s)}>
                            {t('journal.edit')}
                          </button>
                          <button
                            type="button"
                            className="link-btn danger"
                            onClick={() => confirm(t('journal.deleteConfirm')) && deleteSession(s.id)}
                          >
                            {t('journal.delete')}
                          </button>
                        </div>
                      </motion.article>
                    )
                  })}
                </AnimatePresence>
              </motion.section>
            ))}
          </div>
        )}
        </div>
        <aside className="log-side">
          <Calendar log={log} onPick={jumpTo} onNew={newOn} />
        </aside>
      </div>

      <EntryModal open={open} editing={editing} prefill={prefill} onClose={() => setOpen(false)} onSave={save} />
    </>
  )
}

/* ---------- the entry form, in a modal ---------- */

interface Line {
  key: number
  id?: string
  category: CategoryId
  topicId: string
  songId: string
  text: string
  minutes: string // '' → share the rest
}

let lineKey = 1
const blankLine = (category: CategoryId = 'technique', topicId = '', text = ''): Line => ({
  key: lineKey++,
  category,
  topicId,
  songId: '',
  text,
  minutes: '',
})

function EntryModal({
  open,
  editing,
  prefill,
  onClose,
  onSave,
}: {
  open: boolean
  editing: Session | null
  prefill: Prefill | null
  onClose: () => void
  onSave: (session: NewSession, items: NewItem[]) => Promise<void>
}) {
  const { topics, songs, log, createTopic } = useData()
  const { t } = useT()
  const [date, setDate] = useState(todayISO())
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState('')
  const [mins, setMins] = useState('')
  const [lines, setLines] = useState<Line[]>([blankLine()])
  const [note, setNote] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  // Fill the form each time it opens: from the entry being edited, from a prefill, or blank.
  useEffect(() => {
    if (!open) return
    if (editing) {
      setDate(editing.date)
      setTitle(editing.title ?? '')
      setHours(editing.minutes >= 60 ? String(Math.floor(editing.minutes / 60)) : '')
      setMins(editing.minutes % 60 ? String(editing.minutes % 60) : '')
      setNote(editing.note ?? '')
      setRating(editing.rating ?? null)
      const ls = linesOf(log, editing.id).map<Line>((l) => {
        const topic = l.topic_id ? topics.find((x) => x.id === l.topic_id) : null
        const song = l.song_id ? songs.find((x) => x.id === l.song_id) : null
        return {
          key: lineKey++,
          id: l.id,
          category: l.category,
          topicId: topic?.id ?? '',
          songId: song?.id ?? '',
          text: topic?.title ?? (song ? songName(song) : ''),
          minutes: l.fixed ? String(l.minutes) : '',
        }
      })
      setLines(ls.length ? ls : [blankLine()])
    } else {
      setDate(prefill?.date ?? todayISO())
      setTitle('')
      setHours('')
      setMins('')
      setNote('')
      setRating(null)
      const topic = prefill?.topic_id ? topics.find((x) => x.id === prefill.topic_id) : null
      setLines([blankLine(prefill?.category ?? topic?.category ?? 'technique', topic?.id ?? '', topic?.title ?? '')])
    }
  }, [open, editing, prefill]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const totalNum = (parseInt(hours, 10) || 0) * 60 + (parseInt(mins, 10) || 0)
  const typed = lines.map((l) => (l.minutes.trim() === '' ? null : Math.max(0, parseInt(l.minutes, 10) || 0)))
  const typedSum = typed.reduce<number>((a, m) => a + (m ?? 0), 0)
  const effectiveTotal = Math.max(totalNum, typedSum)
  const shares = splitMinutes(effectiveTotal, typed)
  const overflow = totalNum > 0 && typedSum > totalNum

  function patch(key: number, p: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)))
  }
  function remove(key: number) {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls))
  }
  function add() {
    setLines((ls) => [...ls, blankLine(ls[ls.length - 1]?.category ?? 'technique')])
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (effectiveTotal <= 0) return
    setBusy(true)
    const items: NewItem[] = []
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      let topicId: string | null = l.topicId || null
      const q = l.text.trim()
      if (!topicId && !l.songId && q) {
        const pool = topics.filter((x) => x.category === l.category)
        const exact = pool.find((x) => x.title.trim().toLowerCase() === q.toLowerCase())
        if (exact) topicId = exact.id
        else {
          const created = await createTopic({ category: l.category, title: q, sort: pool.length })
          topicId = created?.id ?? null
        }
      }
      items.push({
        id: l.id,
        category: l.category,
        topic_id: topicId,
        song_id: l.songId || null,
        minutes: shares[i],
        fixed: typed[i] !== null,
      })
    }
    await onSave(
      { date, title: title.trim() || null, note: note.trim() || null, rating, minutes: effectiveTotal },
      items,
    )
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
            className="modal log-form entry-form"
            role="dialog"
            aria-label={editing ? t('journal.editing') : t('journal.new')}
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            initial={{ opacity: 0, y: 40, scale: 0.94, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 24, scale: 0.96, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <div className="modal-head">
              <span className="label">{editing ? t('journal.editing') : t('journal.new')}</span>
              <button type="button" className="modal-close" onClick={onClose} aria-label={t('journal.cancel')}>
                ✕
              </button>
            </div>

            <input
              className="entry-title"
              value={title}
              placeholder={t('journal.defaultTitle')}
              aria-label={t('journal.titleField')}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus={!editing}
              autoComplete="off"
            />

            <div className="two">
              <div className="field">
                <span className="label">{t('journal.total')}</span>
                <div className="minutes-big">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={24}
                    placeholder="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    aria-label={t('journal.hoursField')}
                    className="hrs"
                  />
                  <span>{t('journal.h')}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={59}
                    placeholder="0"
                    value={mins}
                    onChange={(e) => setMins(e.target.value)}
                    aria-label={t('journal.minutesField')}
                  />
                  <span>{t('journal.min')}</span>
                </div>
              </div>
              <label className="field">
                <span className="label">{t('journal.date')}</span>
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
                  className={`chip${totalNum === q ? ' on' : ''}`}
                  onClick={() => {
                    setHours(q >= 60 ? String(Math.floor(q / 60)) : '')
                    setMins(q % 60 ? String(q % 60) : '')
                  }}
                  whileTap={{ scale: 0.85, rotate: -6 }}
                >
                  {fmtMinutes(q)}
                </motion.button>
              ))}
            </div>
            {totalNum >= 90 && (
              <motion.div className="small muted" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                {t('journal.long')}
              </motion.div>
            )}

            <div className="field">
              <span className="label">{t('journal.lines')}</span>
              <div className="lines">
                <AnimatePresence initial={false}>
                  {lines.map((l, i) => (
                    <LineRow
                      key={l.key}
                      line={l}
                      share={shares[i]}
                      canRemove={lines.length > 1}
                      onChange={(p) => patch(l.key, p)}
                      onRemove={() => remove(l.key)}
                    />
                  ))}
                </AnimatePresence>
              </div>
              <div className="lines-foot">
                <button type="button" className="link-btn" onClick={add}>
                  <span className="plus">+</span> {t('journal.addLine')}
                </button>
                <span className="small faint">
                  {overflow ? t('journal.overflow', { n: effectiveTotal }) : lines.length > 1 ? t('journal.split') : ''}
                </span>
              </div>
            </div>

            <div className="field">
              <span className="label">{t('journal.rating')}</span>
              <div className="rates" role="radiogroup" aria-label={t('journal.ratingAria')}>
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
              <span className="label">{t('journal.note')}</span>
              <textarea
                className="textarea"
                placeholder={t('journal.notePlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>

            <div className="modal-foot">
              <button className="btn ghost" type="button" onClick={onClose}>
                {t('journal.cancel')}
              </button>
              <Jelly className="btn" type="submit" disabled={effectiveTotal <= 0 || busy}>
                {editing ? t('journal.saveChanges') : t('journal.add')}
              </Jelly>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ---------- one line: category · topic/song · minutes ---------- */

function LineRow({
  line,
  share,
  canRemove,
  onChange,
  onRemove,
}: {
  line: Line
  share: number
  canRemove: boolean
  onChange: (p: Partial<Line>) => void
  onRemove: () => void
}) {
  const { topics, songs } = useData()
  const { t } = useT()
  const [focus, setFocus] = useState(false)
  const [catOpen, setCatOpen] = useState(false)

  const pool = topics.filter((x) => x.category === line.category)
  const query = line.text.trim().toLowerCase()
  const exact = pool.find((x) => x.title.trim().toLowerCase() === query)
  const topicMatches = query ? pool.filter((x) => x.title.toLowerCase().includes(query)) : pool
  const songMatches = query ? songs.filter((s) => songName(s).toLowerCase().includes(query)) : songs
  const canCreate = !!query && !exact && !line.songId
  const cat = CATEGORY_BY_ID[line.category]

  function pickTopic(x: { id: string; title: string }) {
    onChange({ topicId: x.id, songId: '', text: x.title })
    setFocus(false)
  }
  function pickSong(s: Song) {
    // songs always count towards Fun
    onChange({ songId: s.id, topicId: '', text: songName(s), category: 'fun' })
    setFocus(false)
  }

  return (
    <motion.div className="line" layout {...listItem}>
      <div className="cat-pick">
        <button
          type="button"
          className="cat-pick-btn"
          style={{ '--c': cat.color, '--cd': cat.deep } as CSSProperties}
          onClick={() => setCatOpen((v) => !v)}
          onBlur={() => setTimeout(() => setCatOpen(false), 120)}
          disabled={!!line.songId}
          aria-label={catText(line.category).name}
        >
          <span className="cat-dot" style={{ background: cat.color }} />
          {catText(line.category).short}
        </button>
        <AnimatePresence>
          {catOpen && (
            <motion.ul
              className="combo-list cat-list"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
              transition={{ duration: 0.15 }}
            >
              {CATEGORIES.map((c) => (
                <li
                  key={c.id}
                  className={c.id === line.category ? 'on' : ''}
                  onMouseDown={() => {
                    // a topic from another category does not travel with the line
                    onChange(
                      c.id === line.category ? { category: c.id } : { category: c.id, topicId: '', text: '' },
                    )
                    setCatOpen(false)
                  }}
                >
                  <span className="cat-dot" style={{ background: c.color }} />
                  {catText(c.id).name}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="combo">
        <input
          className="input"
          value={line.text}
          placeholder={t('journal.linePlaceholder')}
          onChange={(e) => onChange({ text: e.target.value, topicId: '', songId: '' })}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (exact) pickTopic(exact)
              else if (topicMatches.length === 1 && !canCreate) pickTopic(topicMatches[0])
              setFocus(false)
            }
          }}
          autoComplete="off"
        />
        <AnimatePresence>
          {focus && (topicMatches.length > 0 || songMatches.length > 0 || canCreate) && (
            <motion.ul
              className="combo-list"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
              transition={{ duration: 0.15 }}
            >
              {canCreate && (
                <li className="create" onMouseDown={() => setFocus(false)}>
                  <span className="plus">+</span>{' '}
                  {t('journal.createTopic', { cat: catText(line.category).name, title: line.text.trim() })}
                </li>
              )}
              {topicMatches.map((x) => (
                <li key={x.id} className={x.id === line.topicId ? 'on' : ''} onMouseDown={() => pickTopic(x)}>
                  {x.title}
                </li>
              ))}
              {songMatches.length > 0 && <li className="group">{t('journal.songs')}</li>}
              {songMatches.map((s) => (
                <li key={s.id} className={`song${s.id === line.songId ? ' on' : ''}`} onMouseDown={() => pickSong(s)}>
                  <span className="cat-dot" style={{ background: CATEGORY_BY_ID.fun.color }} />
                  {songName(s)}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="line-min-in">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={600}
          placeholder="0"
          title={String(share)}
          value={line.minutes}
          onChange={(e) => onChange({ minutes: e.target.value })}
          aria-label={t('journal.min')}
        />
        <span>{t('journal.min')}</span>
      </div>

      <button
        type="button"
        className={`line-x${canRemove ? '' : ' hidden'}`}
        onClick={onRemove}
        aria-label={t('journal.removeLine')}
        tabIndex={canRemove ? 0 : -1}
      >
        ✕
      </button>
    </motion.div>
  )
}
