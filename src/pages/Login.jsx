import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Leaf } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { supabase } from '../services/supabaseClient'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
})

function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginSuccess, setLoginSuccess] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data) => {
    setLoginError('')
    setLoginSuccess('')
    setLoading(true)

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setLoginError('Incorrect email or password. Please try again.')
        setLoading(false)
        return
      }

      const userId = authData.user?.id
      if (!userId) {
        setLoginError('Incorrect email or password. Please try again.')
        setLoading(false)
        return
      }

      // Fetch user's profile (maybeSingle so missing row is not an error)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        setLoginError('Failed to load profile. Please try again.')
        setLoading(false)
        return
      }

      const greetingName =
        profileData?.name?.trim() ||
        authData.user?.user_metadata?.name ||
        (typeof data.email === 'string' ? data.email.split('@')[0] : 'traveler')

      setLoginSuccess(`Welcome back, ${greetingName}! 🌿`)
      setLoading(false)

      window.setTimeout(() => {
        navigate('/map')
      }, 1500)
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('Incorrect email or password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <section className="container-shell flex min-h-[calc(100vh-88px)] items-center justify-center py-14">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-[440px] rounded-[2rem] p-8 md:p-10"
        style={{ boxShadow: '0 0 0 1px rgba(87,255,140,0.14), 0 24px 80px rgba(26,122,60,0.18)' }}
      >
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(87,255,140,0.14)', color: 'var(--color-accent-primary)' }}>
            <Leaf size={24} />
          </span>
          <h1 className="text-4xl font-bold">Log In</h1>
          <p className="mt-3 text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Return to your greener commute dashboard.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-semibold">Email address</label>
            <input className={`input-shell ${errors.email ? 'error' : ''}`} placeholder="you@email.com" {...register('email')} />
            {errors.email ? <p className="mt-2 text-sm text-red-500">{errors.email.message}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`input-shell pr-12 ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password ? <p className="mt-2 text-sm text-red-500">{errors.password.message}</p> : null}
          </div>

          <button type="submit" className="button-primary w-full">
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Log In'}
          </button>

          {loginSuccess ? (
            <p className="text-sm font-medium text-emerald-600">{loginSuccess}</p>
          ) : null}

          {loginError ? <p className="text-sm font-medium text-red-500">{loginError}</p> : null}

          <div className="space-y-3 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="link-underline font-semibold" style={{ color: 'var(--color-accent-primary)' }}>
                Sign Up
              </Link>
            </p>
            <Link to="#" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Forgot password?
            </Link>
          </div>
        </form>
      </motion.div>
    </section>
  )
}

export default Login
