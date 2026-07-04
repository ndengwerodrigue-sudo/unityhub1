import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X, User, LogOut, Home, Users, Briefcase, Building, Calendar, MessageSquare, Cpu, Zap, Shield, Bell } from 'lucide-react'
import NotificationCenter from './NotificationCenter'

const Navbar = ({ user, logout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  const isActivePath = (path) => {
    return location.pathname === path
  }

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/opportunities', label: 'Opportunities', icon: Briefcase },
    { path: '/businesses', label: 'Businesses', icon: Building },
    { path: '/events', label: 'Events', icon: Calendar },
  ]

  const authLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/feed', label: 'Feed', icon: MessageSquare },
    { path: '/opportunities', label: 'Opportunities', icon: Briefcase },
    { path: '/businesses', label: 'Businesses', icon: Building },
    { path: '/events', label: 'Events', icon: Calendar },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-dark-surface/90 backdrop-blur-xl shadow-cyber border-b border-dark-border' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="group flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-2xl shadow-neon group-hover:scale-110 transition-transform duration-300 flex items-center justify-center animate-neon-pulse">
                  <Cpu className="w-6 h-6 text-dark-bg" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-green rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue to-cyber-purple">
                  Unity Hub
                </span>
                <div className="text-xs text-cyber-blue font-medium">Cyber Cameroon</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {(user ? authLinks : navLinks).map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`group relative px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                    isActivePath(link.path)
                      ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-cyber-blue shadow-neon'
                      : 'text-dark-muted hover:text-cyber-blue hover:bg-dark-card/50'
                  }`}
                >
                  <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">{link.label}</span>
                  {isActivePath(link.path) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyber-blue rounded-full animate-pulse"></div>
                  )}
                </Link>
              )
            })}
            
            {user ? (
              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-dark-border">
                <NotificationCenter />
                <Link
                  to="/profile"
                  className="group flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-dark-muted hover:text-cyber-blue hover:bg-dark-card/50 transition-all duration-300"
                >
                  <div className="relative">
                    {user.avatar ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-dark-border group-hover:border-cyber-blue transition-colors">
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-sm">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="group flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-cyber-pink hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-dark-border">
                <Link
                  to="/login"
                  className="group px-6 py-2.5 border-2 border-cyber-purple text-cyber-purple font-bold text-sm rounded-xl hover:bg-cyber-purple hover:text-dark-bg transition-all duration-300 transform hover:scale-105"
                >
                  Access
                </Link>
                <Link
                  to="/register"
                  className="group relative px-6 py-2.5 bg-gradient-to-r from-cyber-blue to-cyber-purple text-dark-bg font-bold text-sm rounded-xl shadow-neon hover:shadow-cyber transition-all duration-300 transform hover:scale-105"
                >
                  <span className="relative z-10 flex items-center">
                    Initialize
                    <Zap className="w-4 h-4 ml-2" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple to-cyber-blue opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-3 rounded-xl transition-all duration-300 ${
                isScrolled 
                  ? 'bg-dark-card/50 text-dark-muted hover:text-cyber-blue hover:bg-dark-card' 
                  : 'bg-dark-surface/20 backdrop-blur-sm text-dark-text hover:bg-dark-surface/30'
              }`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-dark-surface/95 backdrop-blur-xl rounded-2xl shadow-cyber border border-dark-border mx-4 mb-4 animate-slide-down">
            <div className="p-4 space-y-2">
              {(user ? authLinks : navLinks).map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`group flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      isActivePath(link.path)
                        ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-cyber-blue shadow-neon'
                        : 'text-dark-muted hover:text-cyber-blue hover:bg-dark-card/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
              
              {user ? (
                <>
                  <div className="border-t border-dark-border pt-4 mt-4 space-y-2">
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-dark-muted hover:text-cyber-blue hover:bg-dark-card/50 transition-all duration-300"
                    >
                      {user.avatar ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-dark-border group-hover:border-cyber-blue transition-colors">
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="group flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-cyber-pink hover:text-red-400 hover:bg-red-500/10 w-full text-left transition-all duration-300"
                    >
                      <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-dark-border pt-4 mt-4 space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-6 py-3 border-2 border-cyber-purple text-cyber-purple font-bold rounded-xl hover:bg-cyber-purple hover:text-dark-bg transition-all duration-300"
                  >
                    Access Portal
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-6 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-dark-bg font-bold rounded-xl shadow-neon hover:shadow-cyber transition-all duration-300"
                  >
                    Initialize Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
