import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
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
    <motion.span className={className} whileHover="wave">
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
      whileHover="hover"
      onHoverStart={() => setBurst(Date.now())}
      variants={{
        hover: { scale: 1.08, rotate: -3, transition: { type: 'spring', stiffness: 400, damping: 12 } },
      }}
    >
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          custom={i}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
          variants={{
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
