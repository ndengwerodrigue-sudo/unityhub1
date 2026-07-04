import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardLayout from './components/layout/DashboardLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Feed from './pages/Feed'
import CreatePost from './pages/CreatePost'
import EditPost from './pages/EditPost'
import Opportunities from './pages/Opportunities'
import OpportunityDetail from './pages/OpportunityDetail'
import OpportunityApply from './pages/OpportunityApply'
import PostOpportunity from './pages/PostOpportunity'
import MyApplications from './pages/MyApplications'
import MyOpportunities from './pages/MyOpportunities'
import ReceivedApplications from './pages/ReceivedApplications'
import ApplicationReview from './pages/ApplicationReview'
import EditOpportunity from './pages/EditOpportunity'
import AdminPanel from './pages/AdminPanel'
import SavedOpportunities from './pages/SavedOpportunities'
import OpportunityMessages from './pages/OpportunityMessages'
import Businesses from './pages/Businesses'
import Events from './pages/Events'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Cookies from './pages/Cookies'
import ForgotPassword from './pages/ForgotPassword'
import OAuthCallback from './pages/OAuthCallback'
import NotFound from './pages/NotFound'
import api, { clearAuthStorage } from './api/axios'

function PublicLayout({ user, logout }) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-background text-foreground">
      <Navbar user={user} logout={logout} />
      <main className="flex-grow pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token')?.trim()
      if (!token || token === 'null' || token === 'undefined') {
        clearAuthStorage()
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        const freshUser = response.data.user
        setUser(freshUser)
        localStorage.setItem('user', JSON.stringify(freshUser))
      } catch {
        clearAuthStorage()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = (userData, token) => {
    const cleanToken = String(token || '').trim().replace(/^["']|["']$/g, '')
    setUser(userData)
    localStorage.setItem('token', cleanToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore — clear local session regardless
    }
    setUser(null)
    clearAuthStorage()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const workspace = (
    <RequireAuth user={user}>
      <DashboardLayout user={user} logout={logout} />
    </RequireAuth>
  )

  return (
    <Routes>
      {/* Auth — full screen, no navbar/footer */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login login={login} />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register login={login} />} />
      <Route path="/oauth/callback" element={<OAuthCallback login={login} />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />

      {/* Premium workspace (authenticated) */}
      <Route element={workspace}>
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/feed" element={<Feed user={user} />} />
        <Route path="/feed/create" element={<CreatePost user={user} />} />
        <Route path="/feed/edit/:id" element={<EditPost user={user} />} />
        <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/opportunities" element={<Opportunities user={user} />} />
        <Route path="/opportunities/post" element={<PostOpportunity user={user} />} />
        <Route path="/opportunities/messages" element={<OpportunityMessages />} />
        <Route path="/opportunities/mine" element={<MyOpportunities />} />
        <Route path="/opportunities/applications/received/:appId" element={<ApplicationReview user={user} mode="owner" />} />
        <Route path="/opportunities/applications/received" element={<ReceivedApplications />} />
        <Route path="/opportunities/applications/:appId" element={<ApplicationReview user={user} mode="applicant" />} />
        <Route path="/opportunities/applications" element={<MyApplications />} />
        <Route path="/opportunities/saved" element={<SavedOpportunities user={user} />} />
        <Route path="/opportunities/:id/edit" element={<EditOpportunity user={user} />} />
        <Route path="/opportunities/:id/apply" element={<OpportunityApply user={user} setUser={setUser} />} />
        <Route path="/opportunities/:id" element={<OpportunityDetail user={user} />} />
        <Route path="/admin" element={<AdminPanel user={user} />} />
        <Route path="/businesses" element={<Businesses />} />
        <Route path="/events" element={<Events />} />
      </Route>

      {/* Public marketing & auth */}
      <Route element={<PublicLayout user={user} logout={logout} />}>
        <Route path="/" element={<Home />} />
        {!user && (
          <>
            <Route path="/opportunities" element={<Opportunities user={user} />} />
            <Route path="/opportunities/:id" element={<OpportunityDetail user={user} />} />
            <Route
              path="/opportunities/:id/apply"
              element={<Navigate to="/login" replace />}
            />
          </>
        )}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
