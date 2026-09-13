import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Burst } from './ui'

/** A pink guitar pick that trails the pointer and tilts over anything clickable. Pointer devices only. */
export function CursorDot() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 400, damping: 30, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 400, damping: 30, mass: 0.6 })
  const [on, setOn] = useState(false)
  const [hot, setHot] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    setEnabled(true)
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setOn(true)
      const t = e.target as Element | null
      setHot(!!t?.closest('a, button, [draggable="true"], .sticker, .rose-legend button, input, select, textarea'))
    }
    const leave = () => setOn(false)
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [x, y])

  if (!enabled) return null
  return (
    <motion.img
      className="cursor-pick"
      src={`${import.meta.env.BASE_URL}pick.png`}
      alt=""
      aria-hidden
      draggable={false}
      style={{ x: sx, y: sy }}
      animate={{ opacity: on ? 1 : 0, rotate: hot ? -28 : 12, scale: hot ? 1.15 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    />
  )
}

/** Text whose letters do a little wave when hovered. Wraps by word, not by letter. */
export function Wave({ children, className }: { children: string; className?: string }) {
  let n = 0
  return (
    <motion.span className={className} initial="rest" animate="rest" whileHover="wave">
      {children.split(' ').map((word, w) => (
        <span key={w}>
          <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {word.split('').map((ch) => {
              const i = n++
              return (
                <motion.span
                  key={i}
                  custom={i}
                  variants={{
                    rest: { y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 22 } },
                    wave: (k: number) => ({
                      y: [0, -10, 0],
                      rotate: [0, k % 2 ? 6 : -6, 0],
                      transition: { delay: k * 0.03, duration: 0.45, ease: 'easeOut' },
                    }),
                  }}
                  style={{ display: 'inline-block' }}
                >
                  {ch}
                </motion.span>
              )
            })}
          </span>
          {w < children.split(' ').length - 1 ? ' ' : ''}
        </span>
      ))}
    </motion.span>
  )
}

/** Bottom toast with a burst. Pass a fresh `id` to show. */
export function Toast({ id, children }: { id: number; children: ReactNode }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!id) return
    setShow(true)
    const t = setTimeout(() => setShow(false), 3200)
    return () => clearTimeout(t)
  }, [id])
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="toast has-burst"
          role="status"
          initial={{ opacity: 0, y: 30, scale: 0.9, rotate: -3 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        >
          {children}
          <Burst id={id} n={16} color="var(--ink)" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Small arrow that keeps bouncing, for empty drop targets. */
export function Bounce({ children }: { children: ReactNode }) {
  return (
    <motion.span
      style={{ display: 'inline-block' }}
      animate={{ y: [0, 5, 0] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
    >
      {children}
    </motion.span>
  )
}

/** Calls `fn` when the user types `word` anywhere (outside inputs). */
export function useTypedWord(word: string, fn: () => void) {
  useEffect(() => {
    let buf = ''
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      if (e.key.length !== 1) return
      buf = (buf + e.key.toLowerCase()).slice(-word.length)
      if (buf === word) {
        buf = ''
        fn()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [word, fn])
}

const RIPPLE = ['var(--hot)', 'var(--hot-cyan)', 'var(--hot-lime)', 'var(--violet)', 'var(--hot)']

/** A highlighted number: coloured by default, pops and runs a colour ripple with a burst on hover. */
export function Jiggle({ children, color = 'var(--hot)' }: { children: string; color?: string }) {
  const [burst, setBurst] = useState(0)
  const letters = children.split('')
  return (
    <motion.span
      className="jiggle has-burst"
      style={{ color }}
      initial="rest"
      animate="rest"
      whileHover="hover"
      onHoverStart={() => setBurst(Date.now())}
      variants={{
        rest: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 18 } },
        hover: { scale: 1.08, rotate: -3, transition: { type: 'spring', stiffness: 400, damping: 12 } },
      }}
    >
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          custom={i}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
          variants={{
            rest: { y: 0, rotate: 0, color, transition: { duration: 0.25 } },
            hover: (n: number) => ({
              y: [0, -14, 0, -5, 0],
              rotate: [0, n % 2 ? 10 : -10, 0],
              color: RIPPLE,
              transition: { delay: n * 0.05, duration: 0.7, ease: 'easeOut' },
            }),
          }}
        >
          {ch}
        </motion.span>
      ))}
      <Burst id={burst} n={12} />
    </motion.span>
  )
}

/** Coloured lightning bolts that crack out from a point. Re-render with a new `id` to fire. */
export function Bolts({ id, n = 7 }: { id: number; n?: number }) {
  const [live, setLive] = useState<number | null>(null)
  useEffect(() => {
    if (!id) return
    setLive(id)
    const t = setTimeout(() => setLive(null), 800)
    return () => clearTimeout(t)
  }, [id])
  if (!live) return null

  // Cheap seeded randomness so each strike looks different but stays stable while it plays.
  let seed = live % 100003
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)

  const bolts = Array.from({ length: n }).map((_, i) => {
    const angle = (i / n) * Math.PI * 2 + rnd() * 0.6
    const len = 90 + rnd() * 90
    const segs = 4 + Math.floor(rnd() * 3)
    const ux = Math.cos(angle)
    const uy = Math.sin(angle)
    let d = 'M 0 0'
    for (let k = 1; k <= segs; k++) {
      const t = (k / segs) * len
      // zig-zag: alternate sides each segment, straighten out at the tip
      const jit = (k % 2 ? 1 : -1) * (8 + rnd() * 16) * (k < segs ? 1 : 0.2)
      const x = ux * t - uy * jit
      const y = uy * t + ux * jit
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
    }
    return { d, start: i % 4, delay: rnd() * 0.08, width: 1.4 + rnd() * 1.2 }
  })

  return (
    <svg className="bolts" viewBox="-240 -240 480 480" aria-hidden>
      {/* the whole strike drifts outward while the bolts draw in and fade */}
      <motion.g
        initial={{ scale: 0.55 }}
        animate={{ scale: 1.25 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '0px 0px' }}
      >
        {bolts.map((b, i) => (
          <motion.path
            key={`${live}-${i}`}
            d={b.d}
            fill="none"
            strokeWidth={b.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 1, stroke: RIPPLE[b.start] }}
            animate={{
              pathLength: 1,
              opacity: 0,
              // each bolt cycles through the palette from its own starting colour
              stroke: [...RIPPLE.slice(b.start, 4), ...RIPPLE.slice(0, b.start), RIPPLE[b.start]],
            }}
            transition={{
              pathLength: { duration: 0.2, delay: b.delay, ease: 'easeOut' },
              opacity: { duration: 0.35, delay: b.delay + 0.3, ease: 'easeIn' },
              stroke: { duration: 0.65, delay: b.delay, ease: 'linear' },
            }}
          />
        ))}
      </motion.g>
    </svg>
  )
}

const GLYPHS = ['♪', '♫', '♩', '♬', '♭', '♯']

/** Coloured music notes that fly out and drift up. Re-render with a new `id` to fire. */
export function Notes({ id, n = 12 }: { id: number; n?: number }) {
  const [live, setLive] = useState<number | null>(null)
  useEffect(() => {
    if (!id) return
    setLive(id)
    const t = setTimeout(() => setLive(null), 1400)
    return () => clearTimeout(t)
  }, [id])
  if (!live) return null
  let seed = live % 100003
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
  return (
    <span className="notes" aria-hidden>
      {Array.from({ length: n }).map((_, i) => {
        const a = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.6 // mostly upwards
        const d = 70 + rnd() * 90
        const x = Math.cos(a) * d
        const y = Math.sin(a) * d
        return (
          <motion.i
            key={`${live}-${i}`}
            style={{ color: RIPPLE[i % 4], fontSize: 16 + rnd() * 14 }}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 0, rotate: 0 }}
            animate={{
              x: [0, x, x * 1.15],
              y: [0, y, y - 40],
              scale: [0.4, 1.1, 0.9],
              opacity: [0, 1, 0],
              rotate: [0, (rnd() - 0.5) * 60, (rnd() - 0.5) * 90],
            }}
            transition={{ duration: 1.2, delay: rnd() * 0.12, times: [0, 0.45, 1], ease: 'easeOut' }}
          >
            {GLYPHS[i % GLYPHS.length]}
          </motion.i>
        )
      })}
    </span>
  )
}

/** A floating photo sticker: bobs gently, can be dragged (snaps back), wobbles on tap. */
export function Sticker({
  src,
  width,
  rotate = 0,
  style,
  delay = 0,
  className,
}: {
  src: string
  width: number
  rotate?: number
  style?: CSSProperties
  delay?: number
  className?: string
}) {
  const [kick, setKick] = useState(0)
  return (
    <motion.div
      className={`sticker-float${className ? ` ${className}` : ''}`}
      style={style}
      initial={{ opacity: 0, scale: 0.7, rotate: rotate - 12 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ type: 'spring', stiffness: 200, damping: 14, delay }}
    >
      <motion.div
        animate={{ y: [0, -7, 0], rotate: [0, 2, 0, -2, 0] }}
        transition={{ repeat: Infinity, duration: 5 + delay * 3, ease: 'easeInOut' }}
      >
        <motion.img
          key={kick}
          src={src}
          alt=""
          draggable={false}
          style={{ width }}
          drag
          dragSnapToOrigin
          dragElastic={0.6}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 14 }}
          whileHover={{ scale: 1.06, rotate: -3 }}
          whileDrag={{ scale: 1.1, rotate: 4 }}
          animate={kick ? { rotate: [0, -8, 6, -3, 0], scale: [1, 1.08, 0.97, 1.02, 1] } : undefined}
          transition={{ duration: 0.5 }}
          onTap={() => setKick(Date.now())}
        />
      </motion.div>
    </motion.div>
  )
}
