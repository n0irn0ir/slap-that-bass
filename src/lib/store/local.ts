import type { LogEntry, Note, Session, Snapshot, Song, Topic } from '../types'
import type { DataStore, NewItem, NewLog, NewNote, NewSession, NewSong, NewTopic } from './types'

const KEY = 'slapthatbass.v1'
const OLD_KEY = 'lowend.v1'

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY)
    if (raw) return normalize(JSON.parse(raw) as Partial<Snapshot>)
  } catch {
    /* corrupted or blocked storage: start empty */
  }
  return { topics: [], songs: [], sessions: [], log: [], notes: [] }
}

// Older snapshots (exports included) have no sessions and no song/fixed fields on lines.
function normalize(raw: Partial<Snapshot>): Snapshot {
  return {
    topics: raw.topics ?? [],
    songs: (raw.songs ?? []).map((x) => ({ ...x, tab: x.tab ?? null })),
    sessions: raw.sessions ?? [],
    notes: raw.notes ?? [],
    log: (raw.log ?? []).map((l) => ({
      ...l,
      song_id: l.song_id ?? null,
      fixed: l.fixed ?? false,
      session_id: l.session_id ?? null,
    })),
  }
}

function write(snap: Snapshot) {
  localStorage.setItem(KEY, JSON.stringify(snap))
}

const now = () => new Date().toISOString()
const uid = () => crypto.randomUUID()

export const localStore: DataStore = {
  async load() {
    return read()
  },

  async addTopics(items: NewTopic[]) {
    const snap = read()
    const created: Topic[] = items.map((t) => ({ ...t, id: uid(), created_at: now() }))
    snap.topics.push(...created)
    write(snap)
    return created
  },
  async updateTopic(id, patch) {
    const snap = read()
    snap.topics = snap.topics.map((t) => (t.id === id ? { ...t, ...patch } : t))
    write(snap)
  },
  async deleteTopic(id) {
    const snap = read()
    snap.topics = snap.topics.filter((t) => t.id !== id)
    snap.log = snap.log.map((l) => (l.topic_id === id ? { ...l, topic_id: null } : l))
    write(snap)
  },

  async addSong(item: NewSong) {
    const snap = read()
    const s: Song = { ...item, id: uid(), created_at: now(), updated_at: now() }
    snap.songs.push(s)
    write(snap)
    return s
  },
  async updateSong(id, patch) {
    const snap = read()
    snap.songs = snap.songs.map((s) =>
      s.id === id ? { ...s, ...patch, updated_at: now() } : s,
    )
    write(snap)
  },
  async deleteSong(id) {
    const snap = read()
    snap.songs = snap.songs.filter((s) => s.id !== id)
    snap.log = snap.log.map((l) => (l.song_id === id ? { ...l, song_id: null } : l))
    write(snap)
  },

  async addSession(session: NewSession, items: NewItem[]) {
    const snap = read()
    const s: Session = { ...session, id: uid(), created_at: now() }
    snap.sessions.push(s)
    snap.log.push(...items.map((it) => lineOf(s, it)))
    write(snap)
    return s
  },
  async updateSession(id, patch, items) {
    const snap = read()
    snap.sessions = snap.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s))
    const s = snap.sessions.find((x) => x.id === id)
    if (!s) return
    const keep = new Set(items.map((it) => it.id).filter(Boolean))
    snap.log = snap.log.filter((l) => l.session_id !== id || keep.has(l.id))
    for (const it of items) {
      const { id: lid, ...fields } = it
      if (lid) snap.log = snap.log.map((l) => (l.id === lid ? { ...l, ...fields, date: s.date } : l))
      else snap.log.push(lineOf(s, it))
    }
    write(snap)
  },
  async deleteSession(id) {
    const snap = read()
    snap.sessions = snap.sessions.filter((s) => s.id !== id)
    snap.log = snap.log.filter((l) => l.session_id !== id)
    write(snap)
  },

  async addNote(item: NewNote) {
    const snap = read()
    const n: Note = { ...item, id: uid(), created_at: now() }
    snap.notes.push(n)
    write(snap)
    return n
  },
  async updateNote(id, patch) {
    const snap = read()
    snap.notes = snap.notes.map((n) => (n.id === id ? { ...n, ...patch } : n))
    write(snap)
  },
  async deleteNote(id) {
    const snap = read()
    snap.notes = snap.notes.filter((n) => n.id !== id)
    write(snap)
  },

  async addLog(item: NewLog) {
    const snap = read()
    const l: LogEntry = { ...item, id: uid(), created_at: now() }
    snap.log.push(l)
    write(snap)
    return l
  },
  async updateLog(id, patch) {
    const snap = read()
    snap.log = snap.log.map((l) => (l.id === id ? { ...l, ...patch } : l))
    write(snap)
  },
  async deleteLog(id) {
    const snap = read()
    snap.log = snap.log.filter((l) => l.id !== id)
    write(snap)
  },

  async replaceAll(snap) {
    write(normalize(snap))
  },
}

function lineOf(s: Session, it: NewItem): LogEntry {
  return {
    id: uid(),
    date: s.date,
    category: it.category,
    topic_id: it.topic_id,
    song_id: it.song_id,
    minutes: it.minutes,
    fixed: it.fixed,
    note: null,
    rating: null,
    session_id: s.id,
    created_at: now(),
  }
}
