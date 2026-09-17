import type { LogEntry, Note, Session, Snapshot, Song, Topic } from '../types'

export type NewTopic = Pick<Topic, 'category' | 'title' | 'sort'>
export type NewSong = Pick<Song, 'artist' | 'title' | 'status' | 'link' | 'tab' | 'slot' | 'sort'>
export type NewNote = Pick<Note, 'text' | 'color' | 'x' | 'y' | 'rotate' | 'stuck' | 'page'>
export type NewSession = Pick<Session, 'date' | 'title' | 'note' | 'rating' | 'minutes'>
/** A session line; `id` is set when it already exists (edit), absent for a new one. */
export type NewItem = Pick<LogEntry, 'category' | 'topic_id' | 'song_id' | 'minutes' | 'fixed'> & { id?: string }
export type NewLog = Pick<
  LogEntry,
  'date' | 'category' | 'topic_id' | 'song_id' | 'minutes' | 'fixed' | 'note' | 'rating' | 'session_id'
>

export interface DataStore {
  load(): Promise<Snapshot>

  addTopics(items: NewTopic[]): Promise<Topic[]>
  updateTopic(id: string, patch: Partial<NewTopic>): Promise<void>
  deleteTopic(id: string): Promise<void>

  addSong(item: NewSong): Promise<Song>
  updateSong(id: string, patch: Partial<NewSong>): Promise<void>
  deleteSong(id: string): Promise<void>

  /** Creates the session and its lines together. */
  addSession(session: NewSession, items: NewItem[]): Promise<Session>
  /** Replaces the session's lines with `items`: lines with an id are updated, others inserted, missing ones deleted. */
  updateSession(id: string, patch: Partial<NewSession>, items: NewItem[]): Promise<void>
  /** Deletes the session and its lines. */
  deleteSession(id: string): Promise<void>

  addNote(item: NewNote): Promise<Note>
  updateNote(id: string, patch: Partial<NewNote>): Promise<void>
  deleteNote(id: string): Promise<void>

  addLog(item: NewLog): Promise<LogEntry>
  updateLog(id: string, patch: Partial<NewLog>): Promise<void>
  deleteLog(id: string): Promise<void>

  /** Local mode only: replace everything with an imported snapshot. */
  replaceAll?(snap: Snapshot): Promise<void>
}
