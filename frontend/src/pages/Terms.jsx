import { Link } from 'react-router-dom'

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-card text-dark-text pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 md:p-12">
          <p className="text-sm text-dark-muted mb-3">Legal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Terms of Service</h1>
          <p className="text-dark-muted leading-relaxed mb-8">
            This is a placeholder terms page for development. Replace this content with your official terms before
            production.
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-2">Acceptable use</h2>
              <p className="text-dark-muted leading-relaxed">
                Donâ€™t post illegal, harmful, or abusive content. Respect other members and comply with local laws.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Your content</h2>
              <p className="text-dark-muted leading-relaxed">
                Youâ€™re responsible for the content you publish. You grant the platform permission to display it to
                other users.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Accounts</h2>
              <p className="text-dark-muted leading-relaxed">
                Keep your credentials secure. We may suspend accounts that violate these terms.
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/privacy" className="btn btn-secondary">
              Privacy Policy
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

export default Terms

