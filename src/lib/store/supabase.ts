import type { SupabaseClient } from '@supabase/supabase-js'
import type { LogEntry, Note, Session, Song, Topic } from '../types'
import type { DataStore, NewItem, NewLog, NewNote, NewSession, NewSong, NewTopic } from './types'

// Tables: topics, songs, sessions, log_entries, notes. See supabase/schema.sql.
// user_id is filled by a column default (auth.uid()) and scoped by RLS.
export function createSupabaseStore(sb: SupabaseClient): DataStore {
  const fail = (e: { message: string } | null) => {
    if (e) throw new Error(e.message)
  }

  return {
    async load() {
      const [t, s, ss, l, n] = await Promise.all([
        sb.from('topics').select('*').order('sort').order('created_at'),
        sb.from('songs').select('*').order('sort').order('created_at'),
        sb
          .from('sessions')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        sb
          .from('log_entries')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        sb.from('notes').select('*').order('created_at'),
      ])
      fail(t.error)
      fail(s.error)
      if (ss.error?.code === '42P01' || ss.error?.code === 'PGRST205') {
        // the sessions table is missing: the SQL migration was not run yet
        throw new Error('Run supabase/migrations/003_sessions.sql in the Supabase SQL editor, then reload.')
      }
      fail(ss.error)
      fail(l.error)
      if (n.error?.code === '42P01' || n.error?.code === 'PGRST205') {
        throw new Error('Run supabase/migrations/005_notes.sql in the Supabase SQL editor, then reload.')
      }
      fail(n.error)
      return {
        topics: (t.data ?? []) as Topic[],
        songs: (s.data ?? []) as Song[],
        sessions: (ss.data ?? []) as Session[],
        log: (l.data ?? []) as LogEntry[],
        notes: (n.data ?? []) as Note[],
      }
    },

    async addTopics(items: NewTopic[]) {
      const { data, error } = await sb.from('topics').insert(items).select('*')
      fail(error)
      return (data ?? []) as Topic[]
    },
    async updateTopic(id, patch) {
      fail((await sb.from('topics').update(patch).eq('id', id)).error)
    },
    async deleteTopic(id) {
      fail((await sb.from('topics').delete().eq('id', id)).error)
    },

    async addSong(item: NewSong) {
      const { data, error } = await sb.from('songs').insert(item).select('*').single()
      fail(error)
      return data as Song
    },
    async updateSong(id, patch) {
      const res = await sb
        .from('songs')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
      fail(res.error)
    },
    async deleteSong(id) {
      fail((await sb.from('songs').delete().eq('id', id)).error)
    },

    async addSession(session: NewSession, items: NewItem[]) {
      const { data, error } = await sb.from('sessions').insert(session).select('*').single()
      fail(error)
      const s = data as Session
      if (items.length) fail((await sb.from('log_entries').insert(items.map((it) => lineOf(s, it)))).error)
      return s
    },
    async updateSession(id, patch, items) {
      const { data, error } = await sb.from('sessions').update(patch).eq('id', id).select('*').single()
      fail(error)
      const s = data as Session
      const keep = items.map((it) => it.id).filter((x): x is string => !!x)
      let del = sb.from('log_entries').delete().eq('session_id', id)
      if (keep.length) del = del.not('id', 'in', `(${keep.join(',')})`)
      fail((await del).error)
      const fresh = items.filter((it) => !it.id).map((it) => lineOf(s, it))
      if (fresh.length) fail((await sb.from('log_entries').insert(fresh)).error)
      for (const it of items) {
        if (!it.id) continue
        const { id: lid, ...fields } = it
        fail((await sb.from('log_entries').update({ ...fields, date: s.date }).eq('id', lid)).error)
      }
    },
    async deleteSession(id) {
      // lines go with it (on delete cascade)
      fail((await sb.from('sessions').delete().eq('id', id)).error)
    },

    async addNote(item: NewNote) {
      const { data, error } = await sb.from('notes').insert(item).select('*').single()
      fail(error)
      return data as Note
    },
    async updateNote(id, patch) {
      fail((await sb.from('notes').update(patch).eq('id', id)).error)
    },
    async deleteNote(id) {
      fail((await sb.from('notes').delete().eq('id', id)).error)
    },

    async addLog(item: NewLog) {
      const { data, error } = await sb.from('log_entries').insert(item).select('*').single()
      fail(error)
      return data as LogEntry
    },
    async updateLog(id, patch) {
      fail((await sb.from('log_entries').update(patch).eq('id', id)).error)
    },
    async deleteLog(id) {
      fail((await sb.from('log_entries').delete().eq('id', id)).error)
    },
  }
}

function lineOf(s: Session, it: NewItem): NewLog {
  return {
    date: s.date,
    category: it.category,
    topic_id: it.topic_id,
    song_id: it.song_id,
    minutes: it.minutes,
    fixed: it.fixed,
    note: null,
    rating: null,
    session_id: s.id,
  }
}
