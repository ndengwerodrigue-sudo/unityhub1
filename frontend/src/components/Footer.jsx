import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-dark-surface border-t border-dark-border text-dark-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-cameroon-green via-cameroon-yellow to-cameroon-red rounded-full shadow-neon"></div>
              <span className="text-xl font-bold text-dark-text">Unity Hub</span>
            </div>
            <p className="text-dark-muted mb-4 max-w-md">
              Connecting Cameroon's vibrant community of students, entrepreneurs, businesses, NGOs, and job seekers. 
              Building bridges, creating opportunities, fostering growth together.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-dark-muted hover:text-dark-text transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="text-dark-muted hover:text-dark-text transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-dark-muted hover:text-dark-text transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-dark-muted hover:text-dark-text transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-dark-text mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/opportunities" className="text-dark-muted hover:text-dark-text transition-colors">
                  Opportunities
                </Link>
              </li>
              <li>
                <Link to="/businesses" className="text-dark-muted hover:text-dark-text transition-colors">
                  Business Directory
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-dark-muted hover:text-dark-text transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/feed" className="text-dark-muted hover:text-dark-text transition-colors">
                  Community Feed
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-dark-text mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-dark-muted">
                <Mail className="w-4 h-4" />
                <span>info@unityhub.cm</span>
              </li>
              <li className="flex items-center space-x-2 text-dark-muted">
                <Phone className="w-4 h-4" />
                <span>+237 123 456 789</span>
              </li>
              <li className="flex items-center space-x-2 text-dark-muted">
                <MapPin className="w-4 h-4" />
                <span>YaoundÃ©, Cameroon</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-dark-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-dark-muted text-sm">
              Â© 2024 Unity Hub. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
