import { CATEGORIES } from './categories'
import { daysAgoISO } from './format'
import type { CategoryId, Session, Snapshot, Song, Topic } from './types'

// Sample data for looking around in local mode. Not anyone's real preferences.
const SAMPLE_SONGS: Array<Pick<Song, 'artist' | 'title' | 'status' | 'slot'>> = [
  { artist: 'Sample', title: 'Easy riff in E', status: 'learned', slot: null },
  { artist: 'Sample', title: 'Verse groove, eighths', status: 'learned', slot: null },
  { artist: 'Sample', title: 'Chorus with rests', status: 'learning', slot: 'easy' },
  { artist: 'Sample', title: 'Slap fragment', status: 'learning', slot: 'growth' },
  { artist: 'Sample', title: 'Twelve-bar walking line', status: 'backlog', slot: 'dream' },
  { artist: 'Sample', title: 'Sixteenth-note funk part', status: 'backlog', slot: null },
  { artist: 'Sample', title: 'Ballad with slides', status: 'backlog', slot: null },
]

// Deterministic pseudo-random so the demo looks the same every time.
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function buildDemo(topics: Topic[]): Snapshot {
  const rand = rng(7)
  const now = new Date().toISOString()
  const weights: Record<CategoryId, number> = {
    technique: 0.3,
    fun: 0.28,
    groove: 0.16,
    theory: 0.12,
    ear: 0.09,
    creativity: 0.05,
  }
  const pickCat = (): CategoryId => {
    let r = rand()
    for (const c of CATEGORIES) {
      r -= weights[c.id]
      if (r <= 0) return c.id
    }
    return 'technique'
  }

  const songs: Song[] = SAMPLE_SONGS.map((s, i) => ({
    ...s,
    id: crypto.randomUUID(),
    link: null,
    sort: i,
    created_at: now,
    updated_at: now,
  }))

  const TITLES = ['Slow and clean', 'Groove night', 'Fretboard drill', 'Song day', null, null, null]
  const sessions: Session[] = []
  const log: Snapshot['log'] = []
  for (let d = 34; d >= 0; d--) {
    if (rand() < 0.35) continue // rest days
    const date = daysAgoISO(d)
    const sid = crypto.randomUUID()
    const blocks = 1 + Math.floor(rand() * 3)
    let total = 0
    for (let b = 0; b < blocks; b++) {
      const minutes = [5, 8, 10, 10, 12, 15, 20, 25][Math.floor(rand() * 8)]
      total += minutes
      const isSong = rand() < 0.2
      const category = isSong ? 'fun' : pickCat()
      const pool = topics.filter((t) => t.category === category)
      const topic = !isSong && pool.length && rand() < 0.8 ? pool[Math.floor(rand() * Math.min(pool.length, 5))] : null
      const song = isSong ? songs[Math.floor(rand() * songs.length)] : null
      log.push({
        id: crypto.randomUUID(),
        date,
        category,
        topic_id: topic?.id ?? null,
        song_id: song?.id ?? null,
        minutes,
        fixed: true,
        note: null,
        rating: null,
        session_id: sid,
        created_at: now,
      })
    }
    sessions.push({
      id: sid,
      date,
      title: TITLES[Math.floor(rand() * TITLES.length)],
      note: rand() < 0.3 ? 'Kept it slow. Clean attacks before speed.' : null,
      rating: rand() < 0.7 ? 2 + Math.floor(rand() * 4) : null,
      minutes: total,
      created_at: now,
    })
  }

  return { topics, songs, sessions, log }
}
