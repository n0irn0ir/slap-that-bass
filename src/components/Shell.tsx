import { motion } from 'motion/react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Avatar } from './Avatar'
import { LevelUpWatcher, RankBadge } from './Ranks'
import { CursorDot } from './fun'
import { useData } from '../state/DataContext'
import { useT } from '../lib/i18n'

const LINKS = [
  { to: '/', key: 'nav.progress' },
  { to: '/topics', key: 'nav.topics' },
  { to: '/songs', key: 'nav.songs' },
  { to: '/log', key: 'nav.log' },
  { to: '/settings', key: 'nav.settings' },
] as const

export function Shell() {
  const { error, log, loading } = useData()
  const totalMinutes = log.reduce((a, l) => a + l.minutes, 0)
  const location = useLocation()
  const { t, lang } = useT()

  return (
    <div className="shell">
      <CursorDot />
      <LevelUpWatcher totalMinutes={totalMinutes} ready={!loading} />
      <header className="topbar">
        <div className="topbar-inner">
          <nav className="nav" aria-label="Main">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}>
                {({ isActive }) => (
                  <motion.span
                    className="nav-item"
                    whileHover={{ y: -2, rotate: isActive ? 0 : -2 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="nav-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                      />
                    )}
                    <span className="nav-label">{t(l.key)}</span>
                  </motion.span>
                )}
              </NavLink>
            ))}
          </nav>
          <span className="who">
            <RankBadge totalMinutes={totalMinutes} />
            <Avatar size={40} />
          </span>
        </div>
      </header>

      {/* Keyed by route: a plain fade-in on mount, no exit animation to wait for. */}
      <motion.main
        key={location.pathname + lang}
        className="page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {error && (
          <div className="error" style={{ marginBottom: 24 }}>
            {error}
          </div>
        )}
        <Outlet />
      </motion.main>
    </div>
  )
}
