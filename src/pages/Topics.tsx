import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sticker } from '../components/fun'
import { Icon } from '../components/Icon'
import { Jelly, listItem } from '../components/ui'
import { CATEGORIES, type Category } from '../lib/categories'
import { fmtMinutes, pct } from '../lib/format'
import type { CategoryId } from '../lib/types'
import type { Topic } from '../lib/types'
import { minutesByCategory, minutesByTopic, useData } from '../state/DataContext'
import { catText, useT } from '../lib/i18n'

// What the stickers say when tapped. Encouraging, a bit rude, never preachy.
const PEP_EN = [
  "you're smart enough for that shit",
  'your hands are fine. the chord is weird.',
  "nobody's watching. play it wrong.",
  "you'll hate this shape for a week, then never think about it again",
  'ten more minutes and it’s yours',
  'your fingers don’t know it’s hard',
  'slow is a flex',
  'the metronome is not your boss',
  'you did harder things today',
  'wrong note, right time. still counts.',
  'that stretch will come. give it a month, not a minute.',
  'you’re not behind. there’s no line.',
]
const PEP_RU = [
  'ты достаточно умная для этой хрени',
  'руки в порядке. это аккорд странный.',
  'никто не смотрит. сыграй криво.',
  'неделю будешь ненавидеть эту аппликатуру, потом забудешь, что она была сложной',
  'ещё десять минут — и оно твоё',
  'пальцы не знают, что это сложно',
  'медленно — это флекс',
  'метроном тебе не начальник',
  'сегодня ты уже делала вещи посложнее',
  'не та нота, но вовремя. засчитано.',
  'растяжка придёт. дай месяц, а не минуту.',
  'ты не отстаёшь. тут нет очереди.',
]

export function Topics() {
  const { topics, log, loading, addTopic } = useData()
  const { hash } = useLocation()
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)
  const [newCat, setNewCat] = useState<CategoryId>('technique')
  const [newTitle, setNewTitle] = useState('')

  async function submitNew(e: FormEvent) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    await addTopic({ category: newCat, title, sort: topics.filter((t) => t.category === newCat).length })
    setNewTitle('')
    setOpen(false)
    document.getElementById(newCat)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const byCat = minutesByCategory(log)
  const byTopic = minutesByTopic(log)
  const total = Object.values(byCat).reduce((a, b) => a + b, 0)

  useEffect(() => {
    if (!hash || loading) return
    const el = document.getElementById(hash.slice(1))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash, loading])

  if (loading) return null

  const B = import.meta.env.BASE_URL
  const pep = lang === 'ru' ? PEP_RU : PEP_EN

  return (
    <>
      {/* stickers live in the empty space: right of the heading, and in the side margins on wide screens */}
      <Sticker src={`${B}st-hand1.png`} width={118} rotate={8} style={{ right: 500, top: 22 }} lines={pep} />
      <Sticker src={`${B}st-ritard.png`} width={160} rotate={-6} style={{ right: 320, top: 50 }} delay={0.15} lines={pep} />
      <Sticker src={`${B}st-short.png`} width={128} rotate={5} className="margin-only" style={{ left: -150, top: 420 }} delay={0.3} lines={pep} />
      <Sticker src={`${B}st-hand3.png`} width={128} rotate={-4} className="margin-only" style={{ right: -150, top: 420 }} delay={0.4} lines={pep} />
      <Sticker src={`${B}st-hand2.png`} width={128} rotate={6} className="margin-only" style={{ left: -150, top: 900 }} delay={0.5} lines={pep} />
      <Sticker src={`${B}st-veryhard.png`} width={128} rotate={-5} className="margin-only" style={{ right: -150, top: 900 }} delay={0.6} lines={pep} />
      <Sticker src={`${B}st-hand4.png`} width={128} rotate={4} className="margin-only" style={{ left: -150, top: 1380 }} delay={0.7} lines={pep} />
      <div className="page-head">
        <div>
          <h1 className="display">{t('topics.title')}</h1>
          <p className="muted">{t('topics.lead')}</p>
        </div>
        <div className="add-topic">
          <Jelly type="button" className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <span className="plus" aria-hidden>
              +
            </span>
            {t('topics.add')}
          </Jelly>
          <AnimatePresence>
            {open && (
              <motion.form
                className="add-topic-panel"
                onSubmit={submitNew}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              >
                <label className="field">
                  <span className="label">{t('topics.category')}</span>
                  <select className="select" value={newCat} onChange={(e) => setNewCat(e.target.value as CategoryId)}>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {catText(c.id).name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="label">{t('topics.topic')}</span>
                  <input
                    className="input"
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t('topics.placeholder')}
                    onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
                  />
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn ghost sm" onClick={() => setOpen(false)}>
                    {t('topics.cancel')}
                  </button>
                  <Jelly type="submit" className="btn sm" disabled={!newTitle.trim()}>
                    {t('topics.addShort')}
                  </Jelly>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="cat-grid">
        {CATEGORIES.map((c, i) => (
          <CategoryBlock
            key={c.id}
            index={i}
            category={c}
            total={byCat[c.id]}
            share={pct(byCat[c.id], total)}
            topics={topics.filter((t) => t.category === c.id)}
            byTopic={byTopic}
          />
        ))}
      </div>
    </>
  )
}

function CategoryBlock({
  index,
  category,
  total,
  share,
  topics,
  byTopic,
}: {
  index: number
  category: Category
  total: number
  share: number
  topics: Topic[]
  byTopic: Record<string, number>
}) {
  const { addTopic } = useData()
  const { t } = useT()
  const [draft, setDraft] = useState('')
  const max = Math.max(...topics.map((t) => byTopic[t.id] ?? 0), 1)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    setDraft('')
    await addTopic({ category: category.id, title, sort: topics.length })
  }

  return (
    <motion.section
      className="cat"
      id={category.id}
      style={{ '--c': category.color, '--cd': category.deep, scrollMarginTop: 88 } as CSSProperties}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.06, type: 'spring', stiffness: 200, damping: 22 }}
      whileHover={{ y: -3 }}
    >
      <div className="cat-head">
        <motion.span
          className="cat-badge"
          whileHover={{ rotate: -12, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 14 }}
        >
          <Icon name={category.icon} size={22} />
        </motion.span>
        <div className="cat-title">
          <h2 className="h2">{catText(category.id).name}</h2>
          <p className="cat-scope">{catText(category.id).scope}</p>
        </div>
        <div className="cat-num">
          <span className="big">{total === 0 ? '—' : fmtMinutes(total)}</span>
          {total > 0 && <span className="small faint">{share}{t('topics.ofAll')}</span>}
        </div>
      </div>

      <div className="cat-list">
        <AnimatePresence initial={false}>
          {topics.map((t) => (
            <TopicRow key={t.id} topic={t} minutes={byTopic[t.id] ?? 0} max={max} />
          ))}
        </AnimatePresence>

        <form className="topic-add" onSubmit={submit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('topics.addInline')}
            aria-label={`${t('topics.addInline')}: ${catText(category.id).name}`}
          />
          {draft.trim() && (
            <Jelly type="submit" className="btn sm ghost">
              {t('topics.addShort')}
            </Jelly>
          )}
        </form>
      </div>
    </motion.section>
  )
}

function TopicRow({ topic, minutes, max }: { topic: Topic; minutes: number; max: number }) {
  const { updateTopic, deleteTopic } = useData()
  const nav = useNavigate()
  const { t } = useT()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(topic.title)

  async function commit() {
    setEditing(false)
    const t = title.trim()
    if (!t || t === topic.title) {
      setTitle(topic.title)
      return
    }
    await updateTopic(topic.id, { title: t })
  }

  function key(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') {
      setTitle(topic.title)
      setEditing(false)
    }
  }

  return (
    <motion.div className="topic" layout="position" {...listItem}>
      <div className="title">
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commit}
            onKeyDown={key}
            aria-label={t('topics.titleAria')}
          />
        ) : (
          <span onDoubleClick={() => setEditing(true)}>{topic.title}</span>
        )}
      </div>
      <div className="acts">
        <button
          type="button"
          className="link-btn"
          onClick={() => nav('/log', { state: { category: topic.category, topic_id: topic.id } })}
        >
          {t('topics.log')}
        </button>
        <button type="button" className="link-btn" onClick={() => setEditing(true)}>
          {t('topics.rename')}
        </button>
        <button
          type="button"
          className="link-btn danger"
          onClick={() => {
            if (minutes === 0 || confirm(t('topics.removeConfirm', { title: topic.title }))) deleteTopic(topic.id)
          }}
        >
          {t('topics.remove')}
        </button>
      </div>
      <span className={`m${minutes === 0 ? ' zero' : ''}`}>{minutes === 0 ? '—' : fmtMinutes(minutes)}</span>
      {minutes > 0 && (
        <motion.span
          className="bar"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: `${(minutes / max) * 100}%` }}
        />
      )}
    </motion.div>
  )
}
