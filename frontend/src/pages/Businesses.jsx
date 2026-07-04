import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Building, MapPin, Phone, Mail, Search, Filter, Plus, ExternalLink, Star, Globe } from 'lucide-react'
import api from '../api/axios'
import PageHeading from '../components/layout/PageHeading'

const BUSINESS_CATEGORIES = [
  { value: 'technology', label: 'Technology', color: 'bg-cyber-blue/20 text-cyber-blue' },
  { value: 'retail', label: 'Retail', color: 'bg-cyber-green/20 text-cyber-green' },
  { value: 'services', label: 'Services', color: 'bg-cyber-purple/20 text-cyber-purple' },
  { value: 'manufacturing', label: 'Manufacturing', color: 'bg-cyber-pink/20 text-cyber-pink' },
  { value: 'agriculture', label: 'Agriculture', color: 'bg-cameroon-green/20 text-cameroon-green' },
  { value: 'healthcare', label: 'Healthcare', color: 'bg-neon-red/20 text-neon-red' },
  { value: 'education', label: 'Education', color: 'bg-cyber-blue/20 text-cyber-blue' },
  { value: 'finance', label: 'Finance', color: 'bg-dark-card/70 text-dark-muted' },
  { value: 'hospitality', label: 'Hospitality', color: 'bg-cyber-pink/20 text-cyber-pink' },
  { value: 'real estate', label: 'Real Estate', color: 'bg-indigo-500/20 text-indigo-500' },
  { value: 'logistics', label: 'Logistics', color: 'bg-orange-500/20 text-orange-500' },
  { value: 'energy', label: 'Energy', color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'media', label: 'Media', color: 'bg-teal-500/20 text-teal-500' },
  { value: 'construction', label: 'Construction', color: 'bg-lime-500/20 text-lime-500' },
  { value: 'legal', label: 'Legal', color: 'bg-red-500/20 text-red-500' },
  { value: 'consulting', label: 'Consulting', color: 'bg-violet-500/20 text-violet-500' },
  { value: 'non-profit', label: 'Non-Profit', color: 'bg-cyan-500/20 text-cyan-500' },
  { value: 'other', label: 'Other', color: 'bg-dark-card/70 text-dark-muted' }
];

const LOCATIONS = [
  'Douala', 'YaoundÃ©', 'Bamenda', 'Bafoussam', 'Garoua', 'Maroua', 'NgaoundÃ©rÃ©', 'Kribi', 'Limbe', 'Buea', 'Dschang', 'Foumban', 'Nationwide', 'Remote',
  'Africa', 'Europe', 'North America', 'South America', 'Asia', 'Oceania',
  'USA', 'Canada', 'UK', 'France', 'Germany', 'China', 'Japan', 'India', 'Brazil', 'Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Senegal', 'Rwanda'
].sort();

const Businesses = () => {
  const [businesses, setBusinesses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [showFilters, setShowFilters] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [contactBusiness, setContactBusiness] = useState(null)
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    search: '',
    verified: ''
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true)
      try {
        const response = await api.get('/businesses', {
          params: { ...filters, limit: 50 },
        })
        setBusinesses(response.data.businesses || [])
      } catch (error) {
        toast.error('Failed to load businesses')
      } finally {
        setIsLoading(false)
      }
    }
    fetchBusinesses()
  }, [filters.category, filters.location, filters.search, filters.verified])

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to add a business')
        return
      }

      const payload = {
        name: data.name,
        description: data.description,
        category: data.category,
        location: data.location,
        contact: {
          email: data.contact?.email || data['contact.email'] || '',
          phone: data.contact?.phone || data['contact.phone'] || '',
          website: data.contact?.website || data['contact.website'] || '',
          address: data.contact?.address || data['contact.address'] || '',
        },
        socialMedia: {},
        images: [],
        logo: '',
      }

      const response = await api.post('/businesses', payload)
      const created = response.data.business
      setBusinesses((prev) => [created, ...prev])
      reset()
      setShowCreateForm(false)
      toast.success('Business listed!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to list business. Please try again.'
      toast.error(message)
    }
  }

  const filteredBusinesses = useMemo(() => businesses, [businesses])

  const getCategoryColor = (category) => {
    const cat = BUSINESS_CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : 'bg-dark-card/70 text-dark-muted';
  }

  const getCategoryLabel = (category) => {
    const cat = BUSINESS_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category.charAt(0).toUpperCase() + category.slice(1);
  }

  return (
    <div className="dashboard-page">
      <PageHeading
        pathname="/businesses"
        eyebrow="Directory"
        title="Business Directory"
        description="Discover and support local Cameroonian businesses."
      >
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Business</span>
        </button>
      </PageHeading>

      {/* Search and Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Search businesses..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              className="input-field"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {BUSINESS_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            <select
              className="input-field"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            >
              <option value="">All Locations</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc.toLowerCase()}>{loc}</option>
              ))}
            </select>
            
            <select
              className="input-field"
              value={filters.verified}
              onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
            >
              <option value="">All Businesses</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Business Form */}
      {showCreateForm && (
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold text-dark-text mb-6">List Your Business</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Business Name</label>
                <input
                  {...register('name', { required: 'Business name is required' })}
                  className="input-field"
                  placeholder="Your business name"
                />
                {errors.name && <p className="text-sm text-cyber-pink">{errors.name.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Category</label>
                <select {...register('category', { required: 'Category is required' })} className="input-field">
                  <option value="">Select category</option>
                  {BUSINESS_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {errors.category && <p className="text-sm text-cyber-pink">{errors.category.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">Description</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                className="input-field"
                rows={4}
                placeholder="Describe your business..."
              />
              {errors.description && <p className="text-sm text-cyber-pink">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">Location</label>
              <input
                {...register('location', { required: 'Location is required' })}
                className="input-field"
                placeholder="City, Cameroon"
              />
              {errors.location && <p className="text-sm text-cyber-pink">{errors.location.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Contact Email</label>
                <input
                  {...register('contact.email', { required: 'Contact email is required' })}
                  type="email"
                  className="input-field"
                  placeholder="contact@business.com"
                />
                {errors.contact?.email && <p className="text-sm text-cyber-pink">{errors.contact.email.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Contact Phone</label>
                <input
                  {...register('contact.phone', { required: 'Contact phone is required' })}
                  className="input-field"
                  placeholder="+237 XXX XXX XXX"
                />
                {errors.contact?.phone && <p className="text-sm text-cyber-pink">{errors.contact.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">Website (Optional)</label>
              <input
                {...register('contact.website')}
                className="input-field"
                placeholder="www.business.com"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  reset()
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                List Business
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Businesses Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-dark-muted">Loading businessesâ€¦</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map((business) => (
          <div key={business.id} className="card p-6 hover:shadow-cyber transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-dark-card rounded-lg flex items-center justify-center border border-dark-border">
                  <Building className="w-6 h-6 text-dark-muted" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark-text">{business.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(business.category)}`}>
                      {getCategoryLabel(business.category)}
                    </span>
                    {business.verified && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-cameroon-yellow fill-current" />
                        <span className="text-xs text-cameroon-yellow">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-dark-muted mb-4 text-sm line-clamp-3">{business.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-dark-muted">
                <MapPin className="w-4 h-4" />
                <span>{business.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-dark-muted">
                <Mail className="w-4 h-4" />
                  <a href={`mailto:${business.contact.email}`} className="hover:text-cyber-blue">
                  {business.contact.email}
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm text-dark-muted">
                <Phone className="w-4 h-4" />
                <span>{business.contact.phone}</span>
              </div>
              {business.contact.website && (
                <div className="flex items-center space-x-2 text-sm text-dark-muted">
                  <Globe className="w-4 h-4" />
                  <a 
                    href={`http://${business.contact.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary-600"
                  >
                    {business.contact.website}
                  </a>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setContactBusiness(business)}
                className="btn btn-primary flex items-center space-x-2 flex-1 justify-center"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Business</span>
              </button>
              {business.contact.website && (
                <a
                  href={`http://${business.contact.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary p-2"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {filteredBusinesses.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-dark-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-text mb-2">No businesses found</h3>
          <p className="text-dark-muted">Try adjusting your filters or search terms</p>
        </div>
      )}

      {/* Contact modal */}
      {contactBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-card border border-dark-border rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="relative h-24 bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-pink p-6">
              <button 
                onClick={() => setContactBusiness(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Contact Business</h2>
              <p className="text-white/80 text-xs font-medium">{contactBusiness.name}</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-8">
                <div>
                  <h3 className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2">Email Address</h3>
                  <div className="flex items-center space-x-3 p-3 bg-dark-bg/50 rounded-2xl border border-dark-border">
                    <div className="p-2 bg-cyber-blue/10 rounded-lg text-cyber-blue">
                      <Mail className="w-4 h-4" />
                    </div>
                    {contactBusiness.contact?.email ? (
                      <a
                        href={`mailto:${contactBusiness.contact.email}`}
                        className="text-sm font-bold text-white hover:text-cyber-blue transition-colors truncate"
                      >
                        {contactBusiness.contact.email}
                      </a>
                    ) : (
                      <span className="text-sm text-dark-muted">Not provided</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2">Phone Number</h3>
                  <div className="flex items-center space-x-3 p-3 bg-dark-bg/50 rounded-2xl border border-dark-border">
                    <div className="p-2 bg-cyber-green/10 rounded-lg text-cyber-green">
                      <Phone className="w-4 h-4" />
                    </div>
                    {contactBusiness.contact?.phone ? (
                      <span className="text-sm font-bold text-white">{contactBusiness.contact.phone}</span>
                    ) : (
                      <span className="text-sm text-dark-muted">Not provided</span>
                    )}
                  </div>
                </div>

                {contactBusiness.contact?.address && (
                  <div>
                    <h3 className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2">Physical Address</h3>
                    <div className="flex items-center space-x-3 p-3 bg-dark-bg/50 rounded-2xl border border-dark-border">
                      <div className="p-2 bg-cyber-purple/10 rounded-lg text-cyber-purple">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-white">{contactBusiness.contact.address}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="btn btn-secondary py-3"
                  onClick={() => setContactBusiness(null)}
                >
                  Close
                </button>
                {contactBusiness.contact?.email && (
                  <a
                    href={`mailto:${contactBusiness.contact.email}`}
                    className="btn btn-primary py-3 flex items-center justify-center space-x-2"
                    onClick={() => setContactBusiness(null)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Send Email</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Businesses
