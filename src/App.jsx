import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import BackgroundCanvas from './components/BackgroundCanvas'
import LoadingScreen from './components/LoadingScreen'
import Navbar from './components/Navbar'
import ThemeToggle from './components/ThemeToggle'
import { useTheme } from './hooks/useTheme'
import AboutUs from './pages/AboutUs'
import Home from './pages/Home'

// Lazy load major pages for code splitting
const Login = lazy(() => import('./pages/Login'))
const MapView = lazy(() => import('./pages/MapView'))
const Profile = lazy(() => import('./pages/Profile'))
const SignUp = lazy(() => import('./pages/SignUp'))

const pageTransition = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
}

function App() {
  const location = useLocation()
  const { theme, flashVisible } = useTheme()
  const { scrollYProgress } = useScroll()
  const scrollHeight = useTransform(useSpring(scrollYProgress, { stiffness: 100, damping: 30 }), (value) => `${value * 100}%`)
  const [loadingSweepDone, setLoadingSweepDone] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoadingSweepDone(true), 1100)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="app-shell" data-theme={theme}>
      <BackgroundCanvas theme={theme} />
      <AnimatePresence>
        {!loadingSweepDone ? (
          <motion.div
            key="loader"
            className="green-progress-bar"
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}
      </AnimatePresence>

      <div className="scroll-progress">
        <motion.span style={{ height: scrollHeight }} />
      </div>

      <AnimatePresence>
        {flashVisible ? (
          <motion.div
            key="flash"
            className="theme-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}
      </AnimatePresence>

      <div className="page-shell">
        <Navbar />
        <div className="fixed bottom-5 right-5 z-50 md:hidden">
          <ThemeToggle compact />
        </div>
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Suspense fallback={<LoadingScreen />}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/map" element={<MapView />} />
              </Routes>
            </Suspense>
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
