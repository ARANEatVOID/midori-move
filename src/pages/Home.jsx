import { motion, useInView } from 'framer-motion'
import { ArrowRight, Bike, Bus, Globe2, Leaf, MapPinned, Send, Trees } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const features = [
  { icon: MapPinned, title: 'Real-Time Navigation', copy: 'Track your location, pinpoint your destination' },
  { icon: Bus, title: 'Compare Fares', copy: 'See bus, metro, bike and walk options with live costs' },
  { icon: Leaf, title: 'Go Green', copy: 'View CO2 saved per trip vs. driving a car' },
]

const stats = [
  { value: 2.4, suffix: ' billion kg', label: 'CO2 saved annually by public transit' },
  { value: 40, suffix: '%', label: 'lower emissions vs. private car' },
  { value: 120, suffix: '+ cities', label: 'with open transit data' },
]

function StatCounter({ value, suffix, label }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.6 })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return undefined

    const start = performance.now()
    const duration = 1500

    const tick = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1)
      setDisplayValue(value * progress)
      if (progress < 1) window.requestAnimationFrame(tick)
    }

    const frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [isInView, value])

  const formattedValue = value % 1 === 0 ? Math.round(displayValue) : displayValue.toFixed(1)

  return (
    <div ref={ref}>
      <p className="text-3xl font-bold md:text-4xl">
        {formattedValue}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-emerald-100/80 md:text-base">{label}</p>
    </div>
  )
}

function Home() {
  return (
    <div>
      <section className="container-shell flex min-h-[calc(100vh-88px)] items-center py-12">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
              <Trees size={16} />
              Sustainable transport, designed to glow
            </div>
            <div className="space-y-4">
              {['Move Greener.', 'Move Smarter.', 'Move Forward.'].map((line, index) => (
                <motion.h1
                  key={line}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 * index, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl"
                >
                  {line}
                </motion.h1>
              ))}
            </div>
            <p className="max-w-2xl text-lg leading-8" style={{ color: 'var(--color-text-secondary)' }}>
              Discover sustainable transport options near you — compare fares, reduce emissions, and choose the planet-friendly way to travel.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/signup" className="button-primary">
                Get Started <ArrowRight size={16} />
              </Link>
              <Link to="/about" className="button-secondary">
                Learn More
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-xl"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-hero-radial blur-3xl" />
            <svg viewBox="0 0 560 430" className="relative w-full">
              <defs>
                <linearGradient id="midoriGlow" x1="0" x2="1">
                  <stop offset="0%" stopColor="var(--color-accent-primary)" />
                  <stop offset="100%" stopColor="var(--color-accent-glow)" />
                </linearGradient>
              </defs>
              <rect x="24" y="40" width="512" height="320" rx="34" fill="rgba(255,255,255,0.03)" stroke="rgba(87,255,140,0.18)" />
              <path d="M78 290h400" stroke="url(#midoriGlow)" strokeWidth="4" strokeLinecap="round" />
              <path d="M100 290l34-84 48 52 46-96 62 72 42-58 28 36 38-70 48 148" stroke="url(#midoriGlow)" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M140 305c18-26 58-28 76 0m46 0c14-19 38-20 52 0m76 0c17-24 47-25 66 0" stroke="rgba(87,255,140,0.35)" strokeWidth="4" strokeLinecap="round" />
              <rect x="160" y="120" width="34" height="90" rx="9" fill="rgba(52, 201, 108, 0.18)" />
              <rect x="214" y="90" width="42" height="120" rx="9" fill="rgba(52, 201, 108, 0.22)" />
              <rect x="274" y="142" width="30" height="68" rx="9" fill="rgba(52, 201, 108, 0.15)" />
              <rect x="326" y="70" width="46" height="140" rx="9" fill="rgba(52, 201, 108, 0.24)" />
              <rect x="392" y="108" width="34" height="102" rx="9" fill="rgba(52, 201, 108, 0.17)" />
              <circle cx="170" cy="315" r="28" fill="rgba(87,255,140,0.1)" stroke="url(#midoriGlow)" />
              <circle cx="170" cy="315" r="9" fill="var(--color-accent-secondary)" />
              <circle cx="240" cy="315" r="28" fill="rgba(87,255,140,0.1)" stroke="url(#midoriGlow)" />
              <circle cx="240" cy="315" r="9" fill="var(--color-accent-secondary)" />
              <path d="M176 314h33l18-46h28l18 46" stroke="url(#midoriGlow)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M312 262h98" stroke="url(#midoriGlow)" strokeWidth="6" strokeLinecap="round" />
              <path d="M360 260v53" stroke="url(#midoriGlow)" strokeWidth="6" strokeLinecap="round" />
              <path d="M433 118c-7 20-11 30-24 49-13-18-17-29-24-49 0-16 11-27 24-27s24 11 24 27Z" fill="rgba(87,255,140,0.16)" stroke="url(#midoriGlow)" />
            </svg>
          </motion.div>
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, copy }, index) => (
            <motion.article
              key={title}
              className="glass-panel rounded-[1.75rem] p-7"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
            >
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(87,255,140,0.14)', color: 'var(--color-accent-primary)' }}>
                <Icon size={22} />
              </span>
              <h3 className="mb-3 text-2xl font-semibold">{title}</h3>
              <p className="section-copy">{copy}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="mb-12 max-w-3xl">
          <h2 className="section-title">How It Works</h2>
          <p className="section-copy mt-4">From a single destination search to a better daily commute, Midori Move turns green transport into an elegant everyday choice.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            ['Enter your destination', MapPinned],
            ['We find sustainable routes', Bus],
            ['Pick your green ride', Bike],
          ].map(([title, Icon], index) => (
            <motion.div
              key={title}
              className="glass-panel relative rounded-[1.75rem] p-8"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(87,255,140,0.14)', color: 'var(--color-accent-primary)' }}>
                <Icon size={24} />
              </div>
              <span className="mb-3 block text-sm font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--color-text-secondary)' }}>
                Step {index + 1}
              </span>
              <h3 className="text-2xl font-semibold">{title}</h3>
              {index < 2 ? (
                <motion.span
                  className="absolute right-[-2.2rem] top-1/2 hidden h-[2px] w-16 -translate-y-1/2 lg:block"
                  style={{ background: 'linear-gradient(90deg, var(--color-accent-secondary), transparent)' }}
                  animate={{ opacity: [0.3, 0.9, 0.3], scaleX: [0.9, 1.05, 0.9] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                />
              ) : null}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="my-16" style={{ background: 'linear-gradient(135deg, rgba(13,31,18,0.96), rgba(26,122,60,0.88))' }}>
        <div className="container-shell grid gap-8 py-12 text-white md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
            >
              <StatCounter {...stat} />
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="container-shell py-14">
        <div className="glass-panel rounded-[2rem] px-6 py-10 md:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-md">
              <h3 className="text-3xl font-bold" style={{ color: 'var(--color-accent-primary)' }}>
                Midori Move
              </h3>
              <p className="mt-3 text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Helping the planet, one commute at a time.
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              {[
                ['Home', '/'],
                ['About', '/about'],
                ['Sign Up', '/signup'],
                ['Log In', '/login'],
              ].map(([label, href]) => (
                <Link key={label} to={href} className="link-underline">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8 flex items-center gap-4" style={{ color: 'var(--color-text-secondary)' }}>
            {[Globe2, Leaf, Send].map((Icon, index) => (
              <span
                key={index}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border"
                style={{ borderColor: 'color-mix(in srgb, var(--color-border) 75%, transparent)' }}
              >
                <Icon size={16} />
              </span>
            ))}
          </div>
          <p className="mt-10 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            © 2025 Midori Move. Helping the planet, one commute at a time.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Home
