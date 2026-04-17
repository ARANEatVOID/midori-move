import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

const getPreferredTheme = () => {
  if (typeof window === 'undefined') return 'light'

  const storedTheme = window.localStorage.getItem('midori-theme')
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getPreferredTheme)
  const [flashVisible, setFlashVisible] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    window.localStorage.setItem('midori-theme', theme)
    setFlashVisible(true)

    const timer = window.setTimeout(() => setFlashVisible(false), 320)
    return () => window.clearTimeout(timer)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      flashVisible,
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark')),
    }),
    [theme, flashVisible],
  )

  return createElement(ThemeContext.Provider, { value }, children)
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
