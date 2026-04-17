import { motion } from 'framer-motion'

const getPasswordStrength = (password) => {
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  const typesCount = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length

  if (password.length >= 8 && hasUppercase && hasLowercase && hasNumber && hasSpecial) {
    return { label: 'Strong', level: 3, color: '#34c96c' }
  }

  if (password.length >= 8 && typesCount >= 2) {
    return { label: 'Medium', level: 2, color: '#f59e0b' }
  }

  return { label: 'Weak', level: password ? 1 : 0, color: '#ef4444' }
}

function PasswordStrengthMeter({ password }) {
  const { label, level, color } = getPasswordStrength(password)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((segment) => (
          <div
            key={segment}
            className="h-2 overflow-hidden rounded-full"
            style={{ background: 'rgba(148, 163, 184, 0.18)' }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={false}
              animate={{ width: level >= segment ? '100%' : '0%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: color }}
            />
          </div>
        ))}
      </div>
      <p className="text-sm font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  )
}

export { getPasswordStrength }
export default PasswordStrengthMeter
