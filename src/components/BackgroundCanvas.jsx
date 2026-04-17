import { motion } from 'framer-motion'

const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${(index * 5.4 + 8) % 100}%`,
  duration: 14 + (index % 5) * 3,
  delay: index * 0.8,
  size: 10 + (index % 4) * 6,
}))

function Leaf({ size }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true">
      <path
        d="M25.4 5.6C15.8 6.1 8.2 12.4 6.8 21.4c-.5 3 1.7 5.8 4.7 5.8 9.7 0 15.4-7.7 14.9-17.1-.1-2.3-.7-4-1-4.5Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path d="M8 23.6c5.7-2.3 10.9-7.2 14.6-13.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function BackgroundCanvas({ theme }) {
  const isDark = theme === 'dark'

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(circle at top, rgba(52, 201, 108, 0.08), transparent 38%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.18), transparent)',
        }}
      />

      {isDark ? (
        <>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(87,255,140,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(87,255,140,0.06) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(circle at center, black, transparent 85%)',
            }}
          />
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: particle.left,
                top: '-10%',
                width: particle.size,
                height: particle.size,
                background: 'radial-gradient(circle, rgba(128,255,170,0.95), rgba(87,255,140,0.08))',
                boxShadow: '0 0 18px rgba(87, 255, 140, 0.45)',
              }}
              animate={{ y: ['0vh', '118vh'], x: [0, particle.id % 2 === 0 ? 22 : -22], opacity: [0, 0.8, 0] }}
              transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: 'linear' }}
            />
          ))}
        </>
      ) : (
        particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{ left: particle.left, top: '-10%', color: 'rgba(26, 122, 60, 0.22)' }}
            animate={{ y: ['0vh', '120vh'], x: [0, particle.id % 2 === 0 ? 28 : -20], rotate: [0, 18, -12, 0], opacity: [0, 0.85, 0] }}
            transition={{ duration: particle.duration + 8, repeat: Infinity, delay: particle.delay, ease: 'linear' }}
          >
            <Leaf size={particle.size + 10} />
          </motion.div>
        ))
      )}
    </div>
  )
}

export default BackgroundCanvas
