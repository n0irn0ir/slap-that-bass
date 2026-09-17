export type CategoryId =
  | 'technique'
  | 'theory'
  | 'groove'
  | 'ear'
  | 'creativity'
  | 'fun'

export interface Topic {
  id: string
  category: CategoryId
  title: string
  sort: number
  created_at: string
}

export type SongStatus = 'backlog' | 'learning' | 'learned'
export type SongSlot = 'easy' | 'growth' | 'dream' | null

export interface Song {
  id: string
  artist: string
  title: string
  status: SongStatus
  link: string | null
  slot: SongSlot
  sort: number
  created_at: string
  updated_at: string
}

/** One practice session: a diary entry with a total time and a rating. Its lines are LogEntry rows. */
export interface Session {
  id: string
  date: string // YYYY-MM-DD
  title: string | null // empty → a default label ("Daily practice")
  note: string | null
  rating: number | null // 1–5, how it felt; optional
  minutes: number // total for the session, as entered
  created_at: string
}

/** One line of a session: minutes against a category, and optionally a topic or a song. */
export interface LogEntry {
  id: string
  date: string // YYYY-MM-DD
  category: CategoryId
  topic_id: string | null
  song_id: string | null // songs always count towards "fun"
  minutes: number // resolved: either typed in (fixed) or an even share of the session's remainder
  fixed: boolean // minutes were typed in for this line
  note: string | null // legacy, before sessions existed
  rating: number | null // legacy
  session_id: string | null // null only until the one-off migration links it
  created_at: string
}

export interface Snapshot {
  topics: Topic[]
  songs: Song[]
  sessions: Session[]
  log: LogEntry[]
}
