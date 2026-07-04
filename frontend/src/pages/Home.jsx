import { Link } from 'react-router-dom'
import { ArrowRight, Users, Briefcase, Building, Calendar, MessageSquare, Star, MapPin, TrendingUp, Sparkles, Zap, Shield, Cpu } from 'lucide-react'

const Home = () => {
  const features = [
    {
      icon: Users,
      title: 'Community Feed',
      description: 'Connect with fellow Cameroonians in our digital nexus.',
      link: '/feed',
      gradient: 'from-cyber-blue to-cyber-purple'
    },
    {
      icon: Briefcase,
      title: 'Opportunities',
      description: 'Discover career paths in the cyber landscape.',
      link: '/opportunities',
      gradient: 'from-cyber-purple to-cyber-pink'
    },
    {
      icon: Building,
      title: 'Business Directory',
      description: 'Explore digital enterprises and innovations.',
      link: '/businesses',
      gradient: 'from-cyber-pink to-cyber-green'
    },
    {
      icon: Calendar,
      title: 'Events',
      description: 'Join cyber gatherings and networking events.',
      link: '/events',
      gradient: 'from-cyber-green to-cyber-blue'
    }
  ]

  const stats = [
    { number: '10,000+', label: 'Active Users', icon: Users },
    { number: '500+', label: 'Digital Businesses', icon: Building },
    { number: '1000+', label: 'Cyber Opportunities', icon: Briefcase },
    { number: '200+', label: 'Tech Events', icon: Calendar }
  ]

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background with cyber gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-dark-surface to-dark-card"></div>
        
        {/* Animated matrix background */}
        <div className="absolute inset-0 bg-matrix-bg opacity-50"></div>
        
        {/* Floating elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyber-blue rounded-full mix-blend-screen filter blur-xl opacity-20 animate-cyber-float"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-cyber-purple rounded-full mix-blend-screen filter blur-xl opacity-20 animate-cyber-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-cyber-pink rounded-full mix-blend-screen filter blur-xl opacity-20 animate-cyber-float" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            {/* Cyber badge */}
            <div className="inline-flex items-center px-4 py-2 bg-cyber-blue/10 border border-cyber-blue/30 rounded-full mb-8 backdrop-blur-sm animate-neon-pulse">
              <Cpu className="w-4 h-4 text-cyber-blue mr-2" />
              <span className="text-cyber-blue text-sm font-medium">Cyber Cameroon Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-pink mb-6 animate-shining bg-size-200">
              Unity <span className="text-cyber-blue">Hub</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-dark-muted mb-12 max-w-4xl mx-auto leading-relaxed animate-slide-up" style={{animationDelay: '0.2s'}}>
              Enter the digital nexus where Cameroon's innovators, creators, and tech leaders converge.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-scale-in" style={{animationDelay: '0.4s'}}>
              <Link
                to="/register"
                className="group relative px-8 py-4 bg-gradient-to-r from-cyber-blue to-cyber-purple text-dark-bg font-bold text-lg rounded-xl shadow-neon hover:shadow-shining transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center animate-neon-pulse"
              >
                <span className="relative z-10 flex items-center">
                  Enter System
                  <Zap className="ml-2 w-5 h-5 group-hover:animate-pulse" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple to-cyber-blue opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              </Link>
              
              <Link
                to="/opportunities"
                className="px-8 py-4 bg-transparent border-2 border-cyber-purple text-cyber-purple font-bold text-lg rounded-xl hover:bg-cyber-purple hover:text-dark-bg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center"
              >
                Explore Matrix
                <Sparkles className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-dark-surface border-t border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center group">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-2xl mb-4 shadow-neon group-hover:scale-110 transition-transform duration-300 animate-neon-pulse">
                    <Icon className="w-8 h-8 text-dark-bg" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-cyber-blue mb-2">
                    {stat.number}
                  </div>
                  <div className="text-dark-muted font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-transparent to-dark-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-pink mb-6">
              Digital Ecosystem
            </h2>
            <p className="text-xl text-dark-muted max-w-4xl mx-auto leading-relaxed">
              Navigate through our cyber modules designed for Cameroon's digital transformation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 rounded-2xl blur transition duration-300" style={{backgroundImage: `linear-gradient(to right, ${feature.gradient})`}}></div>
                  <div className="relative bg-dark-card rounded-2xl p-8 shadow-dark-card hover:shadow-cyber transition-all duration-300 transform hover:-translate-y-2 border border-dark-border">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-neon group-hover:scale-110 transition-transform duration-300 animate-neon-pulse`}>
                      <Icon className="w-8 h-8 text-dark-bg" />
                    </div>
                    <h3 className="text-xl font-bold text-dark-text mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-dark-muted mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    <Link
                      to={feature.link}
                      className={`inline-flex items-center font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
                    >
                      Access Module
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-dark-surface via-dark-card to-dark-surface"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-cyber-blue rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse-slow"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyber-purple rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-cyber-blue/10 border border-cyber-blue/30 rounded-full mb-8 backdrop-blur-sm animate-neon-pulse">
            <Shield className="w-4 h-4 text-cyber-blue mr-2" />
            <span className="text-cyber-blue text-sm font-medium">Join the Digital Revolution</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue to-cyber-pink mb-6">
            Initialize Your Journey
          </h2>
          <p className="text-xl text-dark-muted mb-12 leading-relaxed">
            Connect with Cameroon's digital elite. Experience the future of networking and innovation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/register"
              className="group relative px-10 py-4 bg-gradient-to-r from-cyber-blue to-cyber-purple text-dark-bg font-bold text-lg rounded-xl shadow-neon hover:shadow-shining transition-all duration-300 transform hover:scale-105 animate-neon-pulse"
            >
              <span className="relative z-10">Initialize Account</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple to-cyber-blue opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            </Link>
            
            <Link
              to="/login"
              className="px-10 py-4 bg-transparent border-2 border-cyber-purple text-cyber-purple font-bold text-lg rounded-xl hover:bg-cyber-purple hover:text-dark-bg transition-all duration-300 transform hover:scale-105"
            >
              Access Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
