import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle2, Loader2 } from 'lucide-react'
import api, { getApiErrorMessage } from '../api/axios'

const OAuthCallback = ({ login }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Completing sign-in…')
  const [success, setSuccess] = useState(false)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const run = async () => {
      const params = new URLSearchParams(location.search)
      const code = params.get('code')
      const token = params.get('token')
      const error = params.get('error')

      if (error) {
        const msg = decodeURIComponent(error.replace(/\+/g, ' '))
        toast.error(msg || 'Sign-in was cancelled')
        navigate('/login')
        return
      }

      try {
        if (code) {
          setStatus('Securing your session…')
          const response = await api.post('/auth/oauth/exchange', { code })
          const accessToken = response.data.accessToken || response.data.token
          login(response.data.user, accessToken)
        } else if (token) {
          localStorage.setItem('token', token)
          setStatus('Loading your profile…')
          const response = await api.get('/auth/me')
          login(response.data.user, token)
        } else {
          toast.error('Invalid sign-in response. Please try again.')
          navigate('/login')
          return
        }

        setSuccess(true)
        setStatus('Success! Redirecting…')
        toast.success('Signed in successfully!')
        setTimeout(() => navigate('/dashboard'), 600)
      } catch (e) {
        toast.error(getApiErrorMessage(e, 'Could not complete sign-in'))
        navigate('/login')
      }
    }

    run()
  }, [location.search, login, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="rounded-2xl border border-border bg-card p-10 text-center max-w-md w-full shadow-premium">
        {success ? (
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4 animate-fade-in" />
        ) : (
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
        )}
        <p className="text-muted">{status}</p>
      </div>
    </div>
  )
}

export default OAuthCallback
