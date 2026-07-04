import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Github, Link2, Unlink, Loader2 } from 'lucide-react'
import api from '../../api/axios'

const PROVIDER_META = {
  google: { label: 'Google', icon: null },
  github: { label: 'GitHub', icon: Github },
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function ConnectedProviders({ user, setUser }) {
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(null)

  const connected = user.oauthProviders || user.connectedProviders?.map((p) => ({ provider: p })) || []
  const connectedSet = new Set(connected.map((p) => p.provider))

  useEffect(() => {
    api.get('/auth/providers/status')
      .then((res) => setStatus(res.data))
      .catch(() => {})
  }, [user.id])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connectedProvider = params.get('connected')
    if (connectedProvider) {
      toast.success(`${connectedProvider} connected successfully`)
      api.get('/auth/me').then((res) => setUser(res.data.user))
      window.history.replaceState({}, '', '/profile')
    }
  }, [setUser])

  const handleConnect = async (provider) => {
    setBusy(provider)
    try {
      const res = await api.post(`/auth/providers/${provider}/connect`)
      window.location.href = res.data.url
    } catch (err) {
      toast.error(err.response?.data?.message || `Could not connect ${provider}`)
      setBusy(null)
    }
  }

  const handleDisconnect = async (provider) => {
    setBusy(provider)
    try {
      const res = await api.delete(`/auth/providers/${provider}`)
      setUser(res.data.user)
      toast.success(`${PROVIDER_META[provider]?.label || provider} disconnected`)
    } catch (err) {
      toast.error(err.response?.data?.message || `Could not disconnect ${provider}`)
    } finally {
      setBusy(null)
    }
  }

  const handleLogoutAll = async () => {
    setBusy('logout-all')
    try {
      await api.post('/auth/logout-all')
      toast.success('Signed out from all devices')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not sign out from all devices')
    } finally {
      setBusy(null)
    }
  }

  const providers = ['google', 'github']

  return (
    <div className="card p-6 mt-6">
      <h3 className="text-lg font-semibold text-dark-text mb-1 flex items-center gap-2">
        <Link2 className="w-5 h-5 text-primary" />
        Connected accounts
      </h3>
      <p className="text-sm text-dark-muted mb-4">
        Link Google or GitHub to sign in faster. Accounts with the same verified email are merged automatically.
      </p>

      <div className="space-y-3">
        {providers.map((provider) => {
          const meta = PROVIDER_META[provider]
          const isConnected = connectedSet.has(provider)
          const link = connected.find((p) => p.provider === provider)
          const configured = status?.oauthConfigured?.[provider] !== false

          return (
            <div
              key={provider}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border border-dark-border bg-dark-surface/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card border border-border">
                  {provider === 'google' ? <GoogleIcon /> : <Github className="w-5 h-5" />}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-dark-text">{meta.label}</p>
                  <p className="text-sm text-dark-muted truncate">
                    {isConnected
                      ? link?.username || link?.providerId || 'Connected'
                      : configured ? 'Not connected' : 'Not configured on server'}
                  </p>
                </div>
              </div>

              {isConnected ? (
                <button
                  type="button"
                  onClick={() => handleDisconnect(provider)}
                  disabled={!!busy}
                  className="btn btn-secondary flex items-center gap-1.5 text-sm shrink-0"
                >
                  {busy === provider ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConnect(provider)}
                  disabled={!!busy || !configured}
                  className="btn btn-primary flex items-center gap-1.5 text-sm shrink-0 disabled:opacity-50"
                >
                  {busy === provider ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Connect
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-dark-border">
        <p className="text-sm text-dark-muted mb-3">Session security</p>
        <button
          type="button"
          onClick={handleLogoutAll}
          disabled={!!busy}
          className="btn btn-secondary text-sm flex items-center gap-2"
        >
          {busy === 'logout-all' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Sign out from all devices
        </button>
      </div>
    </div>
  )
}
