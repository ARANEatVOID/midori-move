import { AnimatePresence, motion } from 'framer-motion'

function SuccessOverlay({ open, name }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel relative w-full max-w-lg overflow-hidden rounded-[2rem] p-10 text-center"
          >
            <div className="leaf-confetti">
              {Array.from({ length: 18 }, (_, index) => (
                <motion.span
                  key={index}
                  style={{ left: `${(index * 11) % 96}%`, top: '-5%' }}
                  animate={{ y: ['0%', '680%'], x: [0, index % 2 === 0 ? 24 : -24], rotate: [0, 180, 260] }}
                  transition={{ duration: 2.2 + index * 0.05, repeat: Infinity, ease: 'linear' }}
                />
              ))}
            </div>
            <motion.svg viewBox="0 0 120 120" className="mx-auto mb-6 h-28 w-28" fill="none">
              <motion.circle
                cx="60"
                cy="60"
                r="45"
                stroke="rgba(87,255,140,0.3)"
                strokeWidth="5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.path
                d="M38 61l14 14 30-32"
                stroke="#34c96c"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.svg>
            <h2 className="text-3xl font-bold">Welcome to Midori Move, {name}! 🌿</h2>
            <p className="mt-3 text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Your account setup is complete. Redirecting you to log in.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default SuccessOverlay
