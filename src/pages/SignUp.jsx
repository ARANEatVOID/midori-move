import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Check, Eye, EyeOff, Leaf } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import CountrySelect, { countries } from '../components/CountrySelect'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'
import SuccessOverlay from '../components/SuccessOverlay'
import { supabase } from '../services/supabaseClient'

const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .regex(/^[A-Za-z\s]+$/, 'Use letters and spaces only'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    email: z.string().email('Enter a valid email address'),
    homeAddress: z.string().trim().optional(),
    country: z
      .object({
        value: z.string(),
        label: z.string(),
      })
      .nullable()
      .refine(Boolean, 'Please select your country'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const getDefaultCountry = () => {
  if (typeof navigator === 'undefined') return null
  const locale = navigator.language?.split('-')?.[1]?.toUpperCase()
  return countries.find((country) => country.value === locale) ?? null
}

function SignUp() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invalidShakeKey, setInvalidShakeKey] = useState(0)
  const [successOpen, setSuccessOpen] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [submissionError, setSubmissionError] = useState('')

  const defaultCountry = useMemo(() => getDefaultCountry(), [])

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      password: '',
      confirmPassword: '',
      email: '',
      homeAddress: '',
      country: defaultCountry,
    },
  })

  const password = watch('password')
  const confirmPassword = watch('confirmPassword')

  useEffect(() => {
    if (!successOpen) return undefined

    const timer = window.setTimeout(() => {
      navigate('/map')
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [navigate, successOpen])

  const onInvalid = () => setInvalidShakeKey((currentKey) => currentKey + 1)

  const onSubmit = async (data) => {
    setLoading(true)
    setSubmissionError('')

    try {
      // Create auth user first
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.fullName,
          },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setSubmissionError('An account with this email already exists')
        } else {
          setSubmissionError(authError.message)
        }
        setLoading(false)
        return
      }

      let user = null
      for (let i = 0; i < 5; i++) {
        const res = await supabase.auth.getUser()
        user = res.data.user

        if (user) break
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      if (!user) {
        setSubmissionError('Failed to establish user session after signup. Please try again.')
        setLoading(false)
        return
      }

      console.log('Authenticated user:', user)

      const userId = user.id

      const { error: profileInsertError } = await supabase.from('profiles').insert({
        id: userId,
        name: data.fullName,
        country: data.country?.value ?? 'DEFAULT',
        profile_picture_url: null,
      })

      if (profileInsertError) {
        console.error('Error inserting profile:', profileInsertError)
        setSubmissionError('Failed to create user profile. Please try again.')
        setLoading(false)
        return
      }

      setLoading(false)
      setSubmittedName(data.fullName)
      setSuccessOpen(true)
    } catch (error) {
      console.error('Signup error:', error)
      setSubmissionError(error.message || 'An error occurred during signup. Please try again.')
      setLoading(false)
    }
  }

  const passwordsMatch = Boolean(confirmPassword) && password === confirmPassword

  return (
    <>
      <section className="container-shell py-12">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative hidden overflow-hidden rounded-[2.2rem] bg-[#0d1f12] p-10 text-white lg:block"
          >
            <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at top, rgba(87,255,140,0.14), transparent 40%)' }} />
            {Array.from({ length: 12 }, (_, index) => (
              <motion.span
                key={index}
                className="absolute h-3 w-3 rounded-[100%_0_100%_0] bg-emerald-300/70"
                style={{ left: `${(index * 8 + 7) % 90}%`, top: `${(index * 7 + 9) % 88}%` }}
                animate={{ y: [0, -12, 0], opacity: [0.25, 0.8, 0.25], rotate: [0, 45, 0] }}
                transition={{ duration: 4 + index * 0.2, repeat: Infinity }}
              />
            ))}
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-300">
                  <Leaf size={24} />
                </span>
                <h1 className="mt-8 text-5xl font-bold leading-tight">Join the green commute movement.</h1>
              </div>
              <blockquote className="max-w-sm text-2xl font-semibold leading-relaxed text-emerald-50">
                "Every green mile counts."
              </blockquote>
            </div>
          </motion.aside>

          <motion.div
            key={invalidShakeKey}
            initial={{ opacity: 0, x: 22 }}
            animate={errors && Object.keys(errors).length > 0 ? { x: [0, -8, 8, -6, 6, 0], opacity: 1 } : { x: 0, opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="glass-panel rounded-[2.2rem] p-6 md:p-8 lg:p-10"
          >
            <div className="mb-8">
              <h2 className="text-4xl font-bold">Create your account</h2>
              <p className="mt-3 text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Build your sustainable travel profile in a few calm, glowing steps.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit, onInvalid)}>
              {submissionError ? (
                <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-600 border border-red-500/20">
                  {submissionError}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-semibold">Full Name</label>
                <input className={`input-shell ${errors.fullName ? 'error' : ''}`} placeholder="Your full name" {...register('fullName')} />
                {errors.fullName ? <p className="mt-2 text-sm text-red-500">{errors.fullName.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input-shell pr-12 ${errors.password ? 'error' : ''}`}
                    placeholder="Create your password"
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
                <div className="mt-3">
                  <PasswordStrengthMeter password={password} />
                </div>
                {errors.password ? <p className="mt-2 text-sm text-red-500">{errors.password.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`input-shell pr-12 ${errors.confirmPassword ? 'error' : passwordsMatch ? 'valid' : ''}`}
                    placeholder="Confirm your password"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {passwordsMatch ? (
                    <span className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-500">
                      <Check size={18} />
                    </span>
                  ) : null}
                </div>
                {errors.confirmPassword ? <p className="mt-2 text-sm text-red-500">{errors.confirmPassword.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Email Address</label>
                <input className={`input-shell ${errors.email ? 'error' : ''}`} placeholder="you@email.com" {...register('email')} />
                {errors.email ? <p className="mt-2 text-sm text-red-500">{errors.email.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Home Address</label>
                <input
                  className={`input-shell ${errors.homeAddress ? 'error' : ''}`}
                  placeholder="Optional fallback origin"
                  {...register('homeAddress')}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Used as your fallback starting point if you do not enter a departure location.
                </p>
                {errors.homeAddress ? <p className="mt-2 text-sm text-red-500">{errors.homeAddress.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Country</label>
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <CountrySelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.country?.message} />
                  )}
                />
                {errors.country ? <p className="mt-2 text-sm text-red-500">{errors.country.message}</p> : null}
              </div>

              <button type="submit" className="button-primary w-full">
                {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Create My Account'}
              </button>

              <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Already have an account?{' '}
                <Link to="/login" className="link-underline font-semibold" style={{ color: 'var(--color-accent-primary)' }}>
                  Log In
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </section>

      <SuccessOverlay open={successOpen} name={submittedName} />
    </>
  )
}

export default SignUp
