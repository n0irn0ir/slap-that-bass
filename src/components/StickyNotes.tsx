import { AnimatePresence, motion, useMotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useT } from '../lib/i18n'
import type { Note, NoteColor } from '../lib/types'
import { useData } from '../state/DataContext'

const COLORS: NoteColor[] = ['yellow', 'pink', 'cyan', 'lime']
const W = 200 // note width; height grows with the text

/**
 * Sticky notes over every page: a pad in the corner makes new ones, each note drags around,
 * peels off into the pocket, or gets tossed. Positions are viewport pixels.
 */
export function StickyNotes() {
  const { notes, addNote, updateNote, deleteNote } = useData()
  const { t } = useT()
  const [pocketOpen, setPocketOpen] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)

  const stuck = notes.filter((n) => n.stuck)
  const peeled = notes.filter((n) => !n.stuck)

  async function create() {
    // near the pad, each new one a little further in so they do not pile up exactly
    const k = stuck.length % 5
    const n = await addNote({
      text: '',
      color: COLORS[notes.length % COLORS.length],
      x: Math.max(16, window.innerWidth - W - 120 - k * 40),
      y: Math.max(80, window.innerHeight - 260 - k * 30),
      rotate: Math.round((Math.random() * 8 - 4) * 10) / 10,
      stuck: true,
    })
    if (n) setFocusId(n.id)
  }

  function stick(n: Note) {
    updateNote(n.id, {
      stuck: true,
      x: Math.max(16, window.innerWidth - W - 140),
      y: Math.max(80, window.innerHeight - 300),
    })
    setPocketOpen(false)
  }

  return (
    <>
      <AnimatePresence>
        {stuck.map((n) => (
          <StickyNote
            key={n.id}
            note={n}
            autoFocus={focusId === n.id}
            onChange={(p) => updateNote(n.id, p)}
            onPeel={() => updateNote(n.id, { stuck: false })}
            onToss={() => deleteNote(n.id)}
          />
        ))}
      </AnimatePresence>

      <div className="notes-pad-wrap">
        <AnimatePresence>
          {pocketOpen && (
            <motion.div
              className="notes-pocket"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            >
              <div className="label" style={{ marginBottom: 8 }}>
                {t('notes.pocket')}
              </div>
              {peeled.length === 0 ? (
                <div className="small faint">{t('notes.empty')}</div>
              ) : (
                peeled.map((n) => (
                  <div key={n.id} className={`pocket-row c-${n.color}`}>
                    <span className="pocket-text">{n.text.trim() || t('notes.blank')}</span>
                    <button type="button" className="link-btn" onClick={() => stick(n)}>
                      {t('notes.stick')}
                    </button>
                    <button type="button" className="link-btn danger" onClick={() => deleteNote(n.id)}>
                      {t('notes.toss')}
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="notes-pad">
          {peeled.length > 0 && (
            <button
              type="button"
              className={`pocket-tab${pocketOpen ? ' on' : ''}`}
              onClick={() => setPocketOpen((v) => !v)}
              aria-expanded={pocketOpen}
            >
              {t('notes.pocket')} · {peeled.length}
            </button>
          )}
          <motion.button
            type="button"
            className="pad"
            onClick={create}
            title={t('notes.new')}
            aria-label={t('notes.new')}
            whileHover={{ y: -3, rotate: -3 }}
            whileTap={{ scale: 0.92, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          >
            <span className="sheet s3" />
            <span className="sheet s2" />
            <span className="sheet s1">+</span>
          </motion.button>
        </div>
      </div>
    </>
  )
}

function StickyNote({
  note,
  autoFocus,
  onChange,
  onPeel,
  onToss,
}: {
  note: Note
  autoFocus: boolean
  onChange: (p: Partial<Note>) => void
  onPeel: () => void
  onToss: () => void
}) {
  const { t } = useT()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState(note.text)
  const [tossing, setTossing] = useState(false)

  useEffect(() => setText(note.text), [note.text])
  useEffect(() => {
    if (autoFocus) areaRef.current?.focus()
  }, [autoFocus])

  // the textarea grows with its text
  useEffect(() => {
    const a = areaRef.current
    if (!a) return
    a.style.height = '0px'
    a.style.height = `${Math.max(72, a.scrollHeight)}px`
  }, [text])

  function commit() {
    if (text !== note.text) onChange({ text })
  }

  function toss() {
    setTossing(true)
    setTimeout(onToss, 420)
  }

  // Keep it on screen after a resize. A drag moves the transform; on release the offset is
  // folded into the stored position and the transform reset in the same frame.
  const x = Math.min(note.x, Math.max(16, window.innerWidth - W - 16))
  const y = Math.min(note.y, Math.max(72, window.innerHeight - 120))

  return (
    <motion.div
      className={`note c-${note.color}${tossing ? ' tossing' : ''}`}
      style={{ left: x, top: y, width: W, x: mx, y: my }}
      drag={!tossing}
      dragMomentum={false}
      onDragEnd={() => {
        onChange({ x: Math.round(x + mx.get()), y: Math.round(y + my.get()) })
        mx.set(0)
        my.set(0)
      }}
      initial={{ opacity: 0, scale: 0.6, rotate: note.rotate - 12 }}
      animate={
        tossing
          ? { opacity: 0, scale: 0.15, rotate: note.rotate + 540, marginTop: 260, transition: { duration: 0.42, ease: [0.4, 0, 1, 1] } }
          : { opacity: 1, scale: 1, rotate: note.rotate, marginTop: 0 }
      }
      exit={{ opacity: 0, scale: 0.8, rotate: note.rotate + 18, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      whileDrag={{ scale: 1.04, rotate: note.rotate + 2, boxShadow: '0 24px 40px -18px rgba(0,0,0,0.45)' }}
    >
      <span className="tape" aria-hidden />
      <textarea
        ref={areaRef}
        value={text}
        placeholder={t('notes.placeholder')}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onPointerDown={(e) => e.stopPropagation()}
        spellCheck={false}
      />
      <div className="note-acts">
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={onPeel} title={t('notes.peel')}>
          {t('notes.peel').toLowerCase()}
        </button>
        <button type="button" className="danger" onPointerDown={(e) => e.stopPropagation()} onClick={toss} title={t('notes.toss')}>
          {t('notes.toss')}
        </button>
      </div>
    </motion.div>
  )
}
