import { tr, type Key } from './i18n'

// Five faces for "how did it go". Index = rating - 1.
export const FACES = ['😖', '😕', '😐', '🙂', '😄'] as const
export const faceLabel = (i: number) => tr(`rate.${i + 1}` as Key)

export const face = (r: number | null | undefined) => (r && r >= 1 && r <= 5 ? FACES[r - 1] : null)
