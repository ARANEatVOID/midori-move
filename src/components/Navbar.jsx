import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { Leaf, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Find Routes', to: '/map' },
  { label: 'About Us', to: '/about' },
]

function getUserInitials(name) {
  if (!name) return 'MM'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

function getUserDisplay(user, session) {
  if (user?.name) return user.name
  if (session?.user?.email) {
    const emailPrefix = session.user.email.split('@')[0]
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
  }
  return 'User'
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, session, loading: authLoading, isLoggedIn } = useAuth()
  const navOpacity = useTransform(scrollY, [0, 80], [0.45, 0.88])
  const navBackground = useTransform(
    navOpacity,
    (value) => `color-mix(in srgb, var(--color-bg-primary) ${Math.round(value * 100)}%, transparent)`,
  )
  const navBlur = useTransform(scrollY, [0, 80], ['blur(0px)', 'blur(16px)'])

  const renderAvatar = (sizeClasses = 'h-11 w-11', textClasses = 'text-sm') => {
    if (!isLoggedIn) return null

    return (
      <button
        type="button"
        onClick={() => {
          setMobileOpen(false)
          navigate('/profile')
        }}
        className={`inline-flex ${sizeClasses} items-center justify-center rounded-full bg-[#34c96c] font-bold text-white transition hover:shadow-lg hover:shadow-[#34c96c]/30 ${textClasses}`}
        aria-label="Profile"
      >
        {user?.profile_picture_url ? (
          <img
            src={user.profile_picture_url}
            alt={user.name || 'Profile'}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span>{getUserInitials(user?.name)}</span>
        )}
      </button>
    )
  }

  return (
    <motion.header
      className="sticky top-0 z-40"
      style={{
        backgroundColor: navBackground,
        backdropFilter: navBlur,
        borderBottom: '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)',
      }}
    >
      <div className="container-shell">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="group inline-flex items-center gap-3">
            <motion.span
              whileHover={{ rotate: 16, y: -2 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-border) 70%, transparent)',
                background: 'linear-gradient(135deg, rgba(52, 201, 108, 0.18), rgba(87, 255, 140, 0.12))',
                color: 'var(--color-accent-primary)',
              }}
            >
              <Leaf size={18} />
            </motion.span>
            <span className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-accent-primary)' }}>
              <span className="font-serif">Midori</span>{' '}
              <span className="font-sans font-extrabold tracking-wide">Move</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `link-underline text-sm font-medium transition ${isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <ThemeToggle />

            {/* Auth State Section - Desktop */}
            {authLoading ? (
              /* Loading state: show minimal skeleton to prevent flickering */
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 rounded-md bg-white/10 animate-pulse" />
                <div className="h-11 w-11 rounded-full bg-white/10 animate-pulse" />
              </div>
            ) : isLoggedIn ? (
              /* Logged In State */
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="text-sm font-medium text-white/80 transition hover:text-white"
                >
                  {getUserDisplay(user, session)}
                </button>
                {renderAvatar()}
              </div>
            ) : (
              /* Logged Out State */
              <div className="inline-flex items-center gap-3">
                <Link to="/login" className="button-secondary px-4 py-2 text-sm font-semibold">
                  Login
                </Link>
                <Link to="/signup" className="button-primary px-4 py-2 text-sm font-semibold">
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-border) 70%, transparent)',
                background: 'color-mix(in srgb, var(--color-bg-card) 75%, transparent)',
                color: 'var(--color-text-primary)',
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="border-t md:hidden"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)',
              background: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)',
              backdropFilter: 'blur(18px)',
            }}
          >
            <div className="container-shell flex flex-col gap-4 py-5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium"
                >
                  <span className="link-underline">{item.label}</span>
                </NavLink>
              ))}

              {/* Auth State Section - Mobile */}
              {authLoading ? (
                /* Loading state: show minimal skeleton to prevent flickering */
                <div className="flex flex-col gap-3">
                  <div className="h-6 w-24 rounded-md bg-white/10 animate-pulse" />
                  <div className="h-12 w-12 rounded-full bg-white/10 animate-pulse" />
                </div>
              ) : isLoggedIn ? (
                /* Logged In State */
                <div
                  className="flex items-center justify-between rounded-[1.5rem] border border-emerald-200/70 bg-white/10 px-4 py-3 cursor-pointer transition hover:bg-white/15"
                  onClick={() => {
                    setMobileOpen(false)
                    navigate('/profile')
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{getUserDisplay(user, session)}</p>
                    <p className="text-xs text-slate-500">{session?.user?.email || 'Your account'}</p>
                  </div>
                  {renderAvatar('h-12 w-12', 'text-base')}
                </div>
              ) : (
                /* Logged Out State */
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="button-secondary w-full"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="button-primary w-full"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  )
}

export default Navbar

