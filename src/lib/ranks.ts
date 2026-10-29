// Twelve ranks by total hours on the bass. Names match the ones printed on the badges.
export interface Rank {
  n: number
  name: string
  hours: number
}

export const RANKS: Rank[] = [
  { n: 1, name: 'Dreamer', hours: 0 },
  { n: 2, name: 'Badbadnotgood', hours: 25 },
  { n: 3, name: 'Hopeful', hours: 75 },
  { n: 4, name: 'Slappa', hours: 150 },
  { n: 5, name: 'Hysterical', hours: 300 },
  { n: 6, name: 'Good', hours: 600 },
  { n: 7, name: 'The Bassist', hours: 1000 },
  { n: 8, name: 'Big Muff', hours: 2000 },
  { n: 9, name: 'Diva', hours: 3500 },
  { n: 10, name: 'Epic!', hours: 5000 },
  { n: 11, name: 'The Fish', hours: 7500 },
  { n: 12, name: 'Les Claypool', hours: 10000 },
]

export const badgeSrc = (n: number) => `${import.meta.env.BASE_URL}rank5-${String(n).padStart(2, '0')}.png`

export function rankFor(totalMinutes: number): { current: Rank; next: Rank | null; progress: number } {
  const h = totalMinutes / 60
  let current = RANKS[0]
  for (const r of RANKS) if (h >= r.hours) current = r
  const next = RANKS[current.n] ?? null
  const progress = next ? Math.min(1, (h - current.hours) / (next.hours - current.hours)) : 1
  return { current, next, progress }
}
