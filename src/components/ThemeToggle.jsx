import { AnimatePresence, motion } from 'framer-motion'
import { Moon, SunMedium } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-3 py-2 transition duration-300 ${
        compact ? 'shadow-glow' : ''
      }`}
      style={{
        borderColor: 'color-mix(in srgb, var(--color-border) 75%, transparent)',
        background: 'color-mix(in srgb, var(--color-bg-card) 75%, transparent)',
        boxShadow: 'var(--shadow-glow)',
        color: 'var(--color-text-primary)',
      }}
    >
      <motion.div
        animate={{ rotate: isDark ? -180 : 0, scale: isDark ? 0.92 : 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ opacity: 0, rotate: -40, scale: 0.85 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 40, scale: 0.85 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex"
          >
            {isDark ? <Moon size={18} /> : <SunMedium size={18} />}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      {!compact ? <span className="hidden text-xs font-semibold sm:inline">{isDark ? 'Dark' : 'Light'}</span> : null}
      <span
        className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: 'linear-gradient(135deg, transparent, rgba(87, 255, 140, 0.08), transparent)' }}
      />
    </motion.button>
  )
}

export default ThemeToggle
