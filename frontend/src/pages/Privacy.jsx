import { Link } from 'react-router-dom'

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-card text-dark-text pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 md:p-12">
          <p className="text-sm text-dark-muted mb-3">Legal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Privacy Policy</h1>
          <p className="text-dark-muted leading-relaxed mb-8">
            This is a placeholder policy for development. Before production, replace this page with your official
            privacy policy and contact details.
          </p>

          <div className="space-y-6 text-dark-text/90">
            <section>
              <h2 className="text-xl font-bold mb-2">What we collect</h2>
              <p className="text-dark-muted leading-relaxed">
                Account details (name, email), profile information you provide, and content you post in the app.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">How we use it</h2>
              <p className="text-dark-muted leading-relaxed">
                To provide and improve the platform, secure accounts, and enable community features like posts and
                events.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Contact</h2>
              <p className="text-dark-muted leading-relaxed">
                For privacy requests, contact your administrator email (update this page before launch).
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/terms" className="btn btn-secondary">
              Terms of Service
            </Link>
            <Link to="/cookies" className="btn btn-secondary">
              Cookie Policy
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

export default Privacy

