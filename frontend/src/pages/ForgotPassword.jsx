import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout, { authInputClass, authLabelClass } from '../components/auth/AuthLayout'

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async () => {
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 650))
      toast.success('If that email exists, a reset link will be sent shortly.')
    } catch {
      toast.error('Unable to start password reset right now.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="We'll send instructions if the account exists">
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sign in
      </Link>

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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>
    </AuthLayout>
  )
}

export default ForgotPassword
