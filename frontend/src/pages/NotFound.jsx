import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg via-dark-surface to-dark-card text-dark-text">
      <div className="max-w-md w-full text-center card p-8">
        <div className="mb-8">
          <h1 className="text-7xl md:text-8xl font-bold text-dark-muted mb-2">404</h1>
          <h2 className="text-2xl font-bold text-dark-text mb-4">Page Not Found</h2>
          <p className="text-dark-muted mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been removed, 
            renamed, or is temporarily unavailable.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="btn btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary w-full flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
        
        <div className="mt-8 pt-8 border-t border-dark-border">
          <p className="text-sm text-dark-muted">
            If you believe this is an error, please contact our support team at{' '}
            <a href="mailto:support@unityhub.cm" className="text-cyber-blue hover:text-cyber-purple">
              support@unityhub.cm
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound
