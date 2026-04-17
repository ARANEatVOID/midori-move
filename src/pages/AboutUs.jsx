import { motion } from 'framer-motion'
import { ArrowRight, Globe2, HeartHandshake, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'

const values = [
  { icon: Sprout, title: 'Sustainability First', copy: 'Every feature we build asks: does this help the planet?' },
  { icon: Globe2, title: 'Open Data', copy: 'We use publicly available transit feeds, free for all.' },
  { icon: HeartHandshake, title: 'Community Driven', copy: 'Built for commuters, by people who commute.' },
]

function AboutUs() {
  return (
    <div className="container-shell py-14">
      <section className="mx-auto max-w-3xl py-8 text-center">
        <h1 className="text-5xl font-bold md:text-6xl">About Midori Move</h1>
        <p className="mt-5 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          We believe every commute is a chance to choose the planet.
        </p>
      </section>

      <section className="grid items-center gap-10 py-14 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="section-title">Our Mission</h2>
          <p className="section-copy">
            Midori Move was built for people who want to make a difference — even in the small moments. We aggregate real-time transit data, compare fares, and show you the environmental impact of every journey. Because the greenest trip is the one that never needed a car.
          </p>
        </div>
        <motion.div
          className="glass-panel mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-[2rem] p-10"
          animate={{ rotate: [0, 4, -3, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 320 320" className="w-full">
            <circle cx="160" cy="160" r="88" fill="rgba(87,255,140,0.12)" stroke="rgba(87,255,140,0.38)" strokeWidth="5" />
            <path d="M89 152h141M122 108c16 18 28 43 28 52 0 10-11 35-28 52m76-104c-16 18-28 43-28 52 0 10 11 35 28 52" stroke="rgba(87,255,140,0.42)" strokeWidth="5" strokeLinecap="round" />
            <path d="M160 69c48 23 74 57 74 92 0 49-38 90-74 90s-74-41-74-90c0-35 26-69 74-92Z" fill="rgba(26,122,60,0.22)" />
            <path d="M224 78c-32 2-58 22-63 52-3 20 12 37 32 37 33 0 53-26 51-58 0-14-7-27-20-31Z" fill="rgba(87,255,140,0.2)" stroke="rgba(87,255,140,0.55)" strokeWidth="4" />
            <path d="M163 161c24-14 40-34 49-60" stroke="rgba(87,255,140,0.75)" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </section>

      <section className="py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {values.map(({ icon: Icon, title, copy }, index) => (
            <motion.article
              key={title}
              className="glass-panel rounded-[1.75rem] p-7"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
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

      <section className="my-16 rounded-[2rem] px-6 py-12 text-center text-white md:px-10" style={{ background: 'linear-gradient(135deg, rgba(13,31,18,0.96), rgba(26,122,60,0.88))' }}>
        <h2 className="text-4xl font-bold">Ready to go green?</h2>
        <Link to="/signup" className="button-primary mt-6">
          Sign Up Free <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}

export default AboutUs
