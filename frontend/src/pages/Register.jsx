import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, MapPin, Loader2 } from 'lucide-react'
import api, { getApiErrorMessage } from '../api/axios'
import AuthLayout, { authInputClass, authLabelClass } from '../components/auth/AuthLayout'
import SocialAuthButtons from '../components/SocialAuthButtons'

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'business', label: 'Business Owner' },
  { value: 'ngo', label: 'NGO / Organization' },
  { value: 'job_seeker', label: 'Job Seeker' },
]

const Register = ({ login }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { location: 'Cameroon' },
  })

  const onSubmit = async (data) => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const response = await api.post('/auth/register', data)
      const token = response.data.accessToken || response.data.token
      if (token && response.data.user) {
        login(response.data.user, token)
        toast.success('Account created successfully!')
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Registration failed. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join the Unity Hub community"
      footer={
        <p className="text-xs text-subtle leading-relaxed">
          By registering, you agree to our{' '}
          <Link to="/terms" className="text-muted hover:text-foreground underline underline-offset-2">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-muted hover:text-foreground underline underline-offset-2">Privacy Policy</Link>.
        </p>
      }
    >
      <form className="space-y-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="name" className={authLabelClass}>Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle pointer-events-none" />
            <input
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'At least 2 characters' },
              })}
              id="name"
              type="text"
              autoComplete="name"
              disabled={isLoading}
              className={authInputClass}
              placeholder="Your full name"
            />
          </div>
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className={authLabelClass}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle pointer-events-none" />
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Enter a valid email' },
              })}
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              className={authInputClass}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className={authLabelClass}>Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle pointer-events-none" />
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'At least 6 characters' },
              })}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={isLoading}
              className={`${authInputClass} pr-10`}
              placeholder="Min. 6 characters"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground transition"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="role" className={authLabelClass}>Role</label>
            <select
              {...register('role', { required: 'Select a role' })}
              id="role"
              disabled={isLoading}
              className={`${authInputClass} !pl-3 appearance-none cursor-pointer`}
            >
              <option value="" className="bg-surface text-foreground">Select…</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value} className="bg-surface text-foreground">{r.label}</option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-danger">{errors.role.message}</p>}
          </div>

          <div>
            <label htmlFor="location" className={authLabelClass}>Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle pointer-events-none" />
              <input
                {...register('location', {
                  required: 'Location is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
                id="location"
                type="text"
                disabled={isLoading}
                className={authInputClass}
                placeholder="City"
              />
            </div>
            {errors.location && <p className="mt-1 text-xs text-danger">{errors.location.message}</p>}
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-xs text-muted cursor-pointer pt-0.5">
          <input
            type="checkbox"
            required
            disabled={isLoading}
            className="mt-0.5 h-3.5 w-3.5 rounded border-border bg-background text-primary focus:ring-primary/30 shrink-0"
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="text-primary hover:underline">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <SocialAuthButtons disabled={isLoading} />

      <p className="mt-5 pt-4 border-t border-border text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:text-secondary transition">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Register
