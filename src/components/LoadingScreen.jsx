import { motion } from 'framer-motion'

function LoadingScreen() {
  return (
    <motion.div
      className="flex min-h-screen items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-3 w-3 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </motion.div>
  )
}

export default LoadingScreen
