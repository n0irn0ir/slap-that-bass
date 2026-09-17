import { CATEGORIES } from './categories'
import type { LogEntry, Session, Song, Topic } from './types'

/**
 * One-off stickers for things worth noticing once. No streaks, nothing to lose:
 * a sticker, once earned, stays earned even if the data behind it later changes.
 */
export interface Achievement {
  id: string
  glyph: string
  earned(ctx: Ctx): boolean
}

export interface Ctx {
  sessions: Session[]
  log: LogEntry[]
  topics: Topic[]
  songs: Song[]
}

const DAY = 86400000
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY)

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_entry', glyph: '✍️', earned: ({ sessions }) => sessions.length > 0 },
  { id: 'first_song', glyph: '🎵', earned: ({ log }) => log.some((l) => !!l.song_id) },
  {
    id: 'three_things',
    glyph: '🧩',
    earned: ({ sessions, log }) =>
      sessions.some((s) => log.filter((l) => l.session_id === s.id).length >= 3),
  },
  { id: 'two_hours', glyph: '⏱️', earned: ({ sessions }) => sessions.some((s) => s.minutes >= 120) },
  {
    id: 'all_six',
    glyph: '🎯',
    // every category within some seven-day window
    earned: ({ log }) => {
      const dates = [...new Set(log.map((l) => l.date))].sort()
      return dates.some((d0) => {
        const seen = new Set(log.filter((l) => days(d0, l.date) >= 0 && days(d0, l.date) < 7).map((l) => l.category))
        return CATEGORIES.every((c) => seen.has(c.id))
      })
    },
  },
  { id: 'first_learned', glyph: '✅', earned: ({ songs }) => songs.some((s) => s.status === 'learned') },
  {
    id: 'ten_topics',
    glyph: '🔟',
    earned: ({ log }) => new Set(log.map((l) => l.topic_id).filter(Boolean)).size >= 10,
  },
  {
    id: 'five_faces',
    glyph: '🎭',
    earned: ({ sessions }) => new Set(sessions.map((s) => s.rating).filter(Boolean)).size >= 5,
  },
  {
    id: 'comeback',
    glyph: '🔁',
    // a session after a gap of two weeks or more — showing up again is the point
    earned: ({ sessions }) => {
      const dates = [...new Set(sessions.map((s) => s.date))].sort()
      return dates.some((d, i) => i > 0 && days(dates[i - 1], d) >= 14)
    },
  },
  {
    id: 'note_taker',
    glyph: '📝',
    earned: ({ sessions }) => sessions.filter((s) => s.note?.trim()).length >= 10,
  },
]

export const earnedIds = (ctx: Ctx): string[] => ACHIEVEMENTS.filter((a) => a.earned(ctx)).map((a) => a.id)
