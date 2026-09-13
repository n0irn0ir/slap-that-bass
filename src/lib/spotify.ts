// Cover art and title for a Spotify link via the public oEmbed endpoint (no auth, CORS open).

export interface SpotifyMeta {
  title: string
  thumb: string
}

const RE = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode)\/[A-Za-z0-9]+/i

export function isSpotify(url: string | null | undefined): boolean {
  return !!url && RE.test(url)
}

const KEY = 'spotify-oembed.v1'
const mem = new Map<string, SpotifyMeta | null>()

function readCache(): Record<string, SpotifyMeta> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, SpotifyMeta>
  } catch {
    return {}
  }
}

function writeCache(url: string, meta: SpotifyMeta) {
  try {
    const all = readCache()
    all[url] = meta
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* storage unavailable: fine, memory cache still works */
  }
}

export async function spotifyMeta(url: string): Promise<SpotifyMeta | null> {
  if (!isSpotify(url)) return null
  const clean = url.split('?')[0]
  if (mem.has(clean)) return mem.get(clean) ?? null
  const cached = readCache()[clean]
  if (cached) {
    mem.set(clean, cached)
    return cached
  }
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(clean)}`)
    if (!res.ok) throw new Error(String(res.status))
    const j = (await res.json()) as { title?: string; thumbnail_url?: string }
    if (!j.thumbnail_url) throw new Error('no thumbnail')
    const meta = { title: j.title ?? '', thumb: j.thumbnail_url }
    mem.set(clean, meta)
    writeCache(clean, meta)
    return meta
  } catch {
    mem.set(clean, null)
    return null
  }
}
