import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import api, { getApiErrorMessage } from '../api/axios'
import AuthLayout, { authInputClass, authLabelClass } from '../components/auth/AuthLayout'
import SocialAuthButtons from '../components/SocialAuthButtons'

const Login = ({ login }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('session') === 'expired') {
      toast.error('Your session expired. Please log in again.')
    }
  }, [searchParams])

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', { ...data, rememberMe })
      const token = response.data.accessToken || response.data.token
      if (token && response.data.user) {
        login(response.data.user, token)
        toast.success('Welcome back!')
        const redirect = sessionStorage.getItem('redirectAfterLogin')
        if (redirect) {
          sessionStorage.removeItem('redirectAfterLogin')
          navigate(redirect)
        } else {
          navigate('/dashboard')
        }
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Login failed. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Unity Hub account"
      footer={
        <p className="text-xs text-subtle leading-relaxed">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-muted hover:text-foreground underline underline-offset-2">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-muted hover:text-foreground underline underline-offset-2">Privacy Policy</Link>.
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
              {...register('password', { required: 'Password is required' })}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isLoading}
              className={`${authInputClass} pr-10`}
              placeholder="Your password"
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

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="h-3.5 w-3.5 rounded border-border bg-background text-primary focus:ring-primary/30"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm text-primary hover:text-secondary transition shrink-0">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <SocialAuthButtons disabled={isLoading} />

      <p className="mt-5 pt-4 border-t border-border text-center text-sm text-muted">
        No account?{' '}
        <Link to="/register" className="text-primary font-medium hover:text-secondary transition">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login
