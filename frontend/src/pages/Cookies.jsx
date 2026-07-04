import { Link } from 'react-router-dom'

const Cookies = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-card text-dark-text pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 md:p-12">
          <p className="text-sm text-dark-muted mb-3">Legal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Cookie Policy</h1>
          <p className="text-dark-muted leading-relaxed mb-8">
            Unity Hub currently uses local storage to keep you signed in during development. If you add cookies in
            production, document them here.
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-2">Session</h2>
              <p className="text-dark-muted leading-relaxed">
                Authentication is stored client-side (token) for now. Consider secure httpOnly cookies in production.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Analytics</h2>
              <p className="text-dark-muted leading-relaxed">
                If you enable analytics, add opt-in controls and list the providers here.
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/privacy" className="btn btn-secondary">
              Privacy Policy
            </Link>
            <Link to="/terms" className="btn btn-secondary">
              Terms of Service
            </Link>
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cookies

