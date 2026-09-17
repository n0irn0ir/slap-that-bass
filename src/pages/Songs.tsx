import { AnimatePresence, motion, useAnimation } from 'motion/react'
import { Notes } from '../components/fun'
import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Burst, Counter, Jelly, listItem } from '../components/ui'
import type { Song, SongSlot, SongStatus } from '../lib/types'
import { isSpotify, spotifyMeta, type SpotifyMeta } from '../lib/spotify'
import { Icon } from '../components/Icon'
import { useData } from '../state/DataContext'
import { useT, type Key } from '../lib/i18n'

const STATUSES: {
  id: SongStatus
  label: Key
  hint: Key
  color: string
  deep: string
}[] = [
  {
    id: 'backlog',
    label: 'songs.backlog',
    hint: 'songs.backlogHint',
    color: 'var(--cyan)',
    deep: 'var(--cyan-d)',
  },
  {
    id: 'learning',
    label: 'songs.learning',
    hint: 'songs.learningHint',
    color: 'var(--violet)',
    deep: 'var(--violet-d)',
  },
  {
    id: 'learned',
    label: 'songs.learned',
    hint: 'songs.learnedHint',
    color: 'var(--teal)',
    deep: 'var(--teal-d)',
  },
]

const SLOTS: { id: SongSlot; label: Key }[] = [
  { id: null, label: 'songs.slotNone' },
  { id: 'easy', label: 'songs.slotEasy' },
  { id: 'growth', label: 'songs.slotGrowth' },
  { id: 'dream', label: 'songs.slotDream' },
]

const slotKey = (s: SongSlot): Key => SLOTS.find((x) => x.id === s)?.label ?? 'songs.slotNone'

/** Cover + title for a Spotify link; null for anything else or while loading. */
function useSpotify(link: string | null | undefined): SpotifyMeta | null {
  const [meta, setMeta] = useState<SpotifyMeta | null>(null)
  useEffect(() => {
    let alive = true
    setMeta(null)
    if (isSpotify(link)) spotifyMeta(link!).then((m) => alive && setMeta(m))
    return () => {
      alive = false
    }
  }, [link])
  return meta
}

export function Songs() {
  const { songs, loading, addSong, updateSong } = useData()
  const { t } = useT()
  const [artist, setArtist] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<SongStatus>('backlog')
  const [slot, setSlot] = useState<SongSlot>(null)
  const [link, setLink] = useState('')
  const [tab, setTab] = useState('')
  const [open, setOpen] = useState(false)
  const [burst, setBurst] = useState(0)
  const [over, setOver] = useState<SongStatus | null>(null)
  const [cheer, setCheer] = useState(0)
  const [notes, setNotes] = useState(0)
  const spin = useAnimation()
  const spins = useRef(0)

  // Tap the disc: it spins up and notes fly out.
  async function play() {
    setNotes(Date.now())
    spins.current += 1
    await spin.start({
      rotate: spins.current * 360,
      transition: { type: 'spring', stiffness: 60, damping: 14 },
    })
  }
  const linkMeta = useSpotify(link)
  useEffect(() => {
    if (linkMeta && !title.trim()) setTitle(linkMeta.title)
  }, [linkMeta]) // eslint-disable-line react-hooks/exhaustive-deps

  function move(id: string, to: SongStatus) {
    const s = songs.find((x) => x.id === id)
    if (!s || s.status === to) return
    if (to === 'learned') setCheer(Date.now())
    updateSong(id, { status: to })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!artist.trim() || !title.trim()) return
    await addSong({
      artist: artist.trim(),
      title: title.trim(),
      status,
      slot,
      link: link.trim() || null,
      tab: tab.trim() || null,
      sort: songs.length,
    })
    setArtist('')
    setTitle('')
    setLink('')
    setTab('')
    setSlot(null)
    setOpen(false)
    setBurst(Date.now())
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function drop(e: DragEvent, to: SongStatus) {
    e.preventDefault()
    setOver(null)
    move(e.dataTransfer.getData('text/song'), to)
  }

  if (loading) return null

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="display">{t('songs.title')}</h1>
          <p className="muted">{t('songs.lead')}</p>
        </div>
        <div className="add-topic has-burst">
          <Jelly type="button" className="btn" onClick={() => setOpen(true)}>
            <span className="plus" aria-hidden>
              +
            </span>
            {t('songs.addSong')}
          </Jelly>
          <Burst id={burst} />
        </div>
        <motion.div
          className="disc-wrap has-burst"
          initial={{ opacity: 0, rotate: -20, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, rotate: 0, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 160,
            damping: 14,
            delay: 0.15,
          }}
        >
          <Notes id={notes} />
          <motion.img
            className="disc"
            src={`${import.meta.env.BASE_URL}cd-toys.png`}
            alt=""
            draggable={false}
            drag
            dragSnapToOrigin
            dragElastic={0.6}
            dragTransition={{ bounceStiffness: 300, bounceDamping: 14 }}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.08 }}
            animate={spin}
            onTap={play}
          />
        </motion.div>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              onClick={() => setOpen(false)}
            >
              <motion.form
                className="modal log-form song-form"
                role="dialog"
                aria-label={t('songs.addSong')}
                onClick={(e) => e.stopPropagation()}
                onSubmit={submit}
                initial={{ opacity: 0, y: 40, scale: 0.94, rotate: 1.5 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{
                  opacity: 0,
                  y: 24,
                  scale: 0.96,
                  transition: { duration: 0.15 },
                }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              >
                <div className="modal-head">
                  <span className="label">{t('songs.addSong')}</span>
                  <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label={t('songs.cancel')}>
                    ✕
                  </button>
                </div>
                <div className="two">
                  <label className="field">
                    <span className="label">{t('songs.artist')}</span>
                    <input className="input" value={artist} onChange={(e) => setArtist(e.target.value)} autoFocus required />
                  </label>
                  <label className="field">
                    <span className="label">{t('songs.songTitle')}</span>
                    <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </label>
                  <label className="field">
                    <span className="label">{t('songs.status')}</span>
                    <select className="select" value={status} onChange={(e) => setStatus(e.target.value as SongStatus)}>
                      {STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {t(s.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="label">{t('songs.slot')}</span>
                    <select className="select" value={slot ?? ''} onChange={(e) => setSlot((e.target.value || null) as SongSlot)}>
                      {SLOTS.map((s) => (
                        <option key={s.id ?? 'none'} value={s.id ?? ''}>
                          {t(s.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="label">{t('songs.link')}</span>
                    <input
                      className="input"
                      type="url"
                      placeholder={t('songs.linkPlaceholder')}
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="label">{t('songs.tab')}</span>
                    <input
                      className="input"
                      type="url"
                      placeholder={t('songs.tabPlaceholder')}
                      value={tab}
                      onChange={(e) => setTab(e.target.value)}
                    />
                  </label>
                </div>
                <div className="modal-foot">
                  <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
                    {t('songs.cancel')}
                  </button>
                  <Jelly className="btn" type="submit" disabled={!artist.trim() || !title.trim()}>
                    {t('songs.add')}
                  </Jelly>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <div className="board">
        {STATUSES.map((col) => {
          const items = songs.filter((s) => s.status === col.id)
          return (
            <div
              key={col.id}
              id={col.id}
              className={`col${over === col.id ? ' over' : ''}${col.id === 'learned' ? ' done' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                if (over !== col.id) setOver(col.id)
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => drop(e, col.id)}
              style={
                {
                  scrollMarginTop: 88,
                  '--c': col.color,
                  '--cd': col.deep,
                } as CSSProperties
              }
            >
              <div className="col-head has-burst">
                <div>
                  <h2 className="h3">{t(col.label)}</h2>
                  <span className="small faint">{t(col.hint)}</span>
                </div>
                <span className="n">
                  <Counter value={items.length} />
                </span>
                {col.id === 'learned' && <Burst id={cheer} n={14} />}
              </div>
              <AnimatePresence initial={false}>
                {items.map((s) => (
                  <SongCard key={s.id} song={s} />
                ))}
              </AnimatePresence>
              {items.length === 0 && (
                <div className="drop-slot">
                  <span className="cover placeholder" aria-hidden />
                  <span className="small">{t('songs.drop')}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function SongCard({ song }: { song: Song }) {
  const { updateSong, deleteSong } = useData()
  const { t } = useT()
  const cover = useSpotify(song.link)
  const [editing, setEditing] = useState(false)
  const [artist, setArtist] = useState(song.artist)
  const [title, setTitle] = useState(song.title)
  const [slot, setSlot] = useState<SongSlot>(song.slot)
  const [link, setLink] = useState(song.link ?? '')
  const [tab, setTab] = useState(song.tab ?? '')

  async function save(e: FormEvent) {
    e.preventDefault()
    await updateSong(song.id, {
      artist: artist.trim() || song.artist,
      title: title.trim() || song.title,
      slot,
      link: link.trim() || null,
      tab: tab.trim() || null,
    })
    setEditing(false)
  }

  return (
    <motion.div layout layoutId={song.id} {...listItem} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
      <article className="song" draggable={!editing} onDragStart={(e) => e.dataTransfer.setData('text/song', song.id)}>
        {editing ? (
          <form onSubmit={save} style={{ display: 'grid', gap: 8 }}>
            <input className="input" value={artist} onChange={(e) => setArtist(e.target.value)} aria-label={t('songs.artist')} />
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-label={t('songs.songTitle')} />
            <select
              className="select"
              value={slot ?? ''}
              onChange={(e) => setSlot((e.target.value || null) as SongSlot)}
              aria-label={t('songs.slot')}
            >
              {SLOTS.map((s) => (
                <option key={s.id ?? 'none'} value={s.id ?? ''}>
                  {t(s.label)}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={t('songs.link')}
              aria-label={t('songs.link')}
            />
            <input
              className="input"
              type="url"
              value={tab}
              onChange={(e) => setTab(e.target.value)}
              placeholder={t('songs.tab')}
              aria-label={t('songs.tab')}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn sm" type="submit">
                {t('songs.save')}
              </button>
              <button className="btn sm ghost" type="button" onClick={() => setEditing(false)}>
                {t('songs.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="song-row">
              {cover && song.link ? (
                <motion.a
                  className="cover"
                  href={song.link}
                  target="_blank"
                  rel="noreferrer"
                  title={t('songs.openSpotify')}
                  draggable={false}
                  whileHover={{ scale: 1.08, rotate: -4 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                >
                  <img src={cover.thumb} alt="" draggable={false} />
                </motion.a>
              ) : (
                <span className="cover placeholder" aria-hidden>
                  <Icon name="headphones" size={20} />
                </span>
              )}
              <div className="text">
                <div className="artist">{song.artist}</div>
                <div className="h3">{song.title}</div>
              </div>
              {song.slot && <span className={`slot ${song.slot}`}>{t(slotKey(song.slot))}</span>}
            </div>
            <div className="foot">
              {song.link && (
                <a className="link-btn" href={song.link} target="_blank" rel="noreferrer">
                  {isSpotify(song.link) ? t('songs.spotify') : t('songs.open')}
                </a>
              )}
              {song.tab && (
                <a className="link-btn" href={song.tab} target="_blank" rel="noreferrer">
                  {t('songs.tabShort')}
                </a>
              )}
              <button type="button" className="link-btn" onClick={() => setEditing(true)}>
                {t('songs.edit')}
              </button>
              <button
                type="button"
                className="link-btn danger"
                onClick={() => confirm(t('songs.removeConfirm', { title: song.title })) && deleteSong(song.id)}
              >
                {t('songs.remove')}
              </button>
            </div>
          </>
        )}
      </article>
    </motion.div>
  )
}
