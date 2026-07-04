import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Calendar, MapPin, Clock, Users, Search, Filter, Plus, User } from 'lucide-react'
import api from '../api/axios'
import PageHeading from '../components/layout/PageHeading'

const EVENT_CATEGORIES = [
  { value: 'conference', label: 'Conference', color: 'bg-cyber-blue/20 text-cyber-blue' },
  { value: 'workshop', label: 'Workshop', color: 'bg-cyber-green/20 text-cyber-green' },
  { value: 'meetup', label: 'Meetup', color: 'bg-cyber-purple/20 text-cyber-purple' },
  { value: 'networking', label: 'Networking', color: 'bg-cyber-pink/20 text-cyber-pink' },
  { value: 'cultural', label: 'Cultural', color: 'bg-cameroon-green/20 text-cameroon-green' },
  { value: 'sports', label: 'Sports', color: 'bg-neon-red/20 text-neon-red' },
  { value: 'educational', label: 'Educational', color: 'bg-cyber-blue/20 text-cyber-blue' },
  { value: 'concert', label: 'Concert', color: 'bg-indigo-500/20 text-indigo-500' },
  { value: 'seminar', label: 'Seminar', color: 'bg-orange-500/20 text-orange-500' },
  { value: 'webinar', label: 'Webinar', color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'exhibition', label: 'Exhibition', color: 'bg-teal-500/20 text-teal-500' },
  { value: 'gala', label: 'Gala', color: 'bg-lime-500/20 text-lime-500' },
  { value: 'party', label: 'Party', color: 'bg-red-500/20 text-red-500' },
  { value: 'religious', label: 'Religious', color: 'bg-violet-500/20 text-violet-500' },
  { value: 'political', label: 'Political', color: 'bg-cyan-500/20 text-cyan-500' },
  { value: 'other', label: 'Other', color: 'bg-dark-card/70 text-dark-muted' }
];

const LOCATIONS = [
  'Douala', 'YaoundÃ©', 'Bamenda', 'Bafoussam', 'Garoua', 'Maroua', 'NgaoundÃ©rÃ©', 'Kribi', 'Limbe', 'Buea', 'Dschang', 'Foumban', 'Nationwide', 'Remote',
  'Africa', 'Europe', 'North America', 'South America', 'Asia', 'Oceania',
  'USA', 'Canada', 'UK', 'France', 'Germany', 'China', 'Japan', 'India', 'Brazil', 'Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Senegal', 'Rwanda'
].sort();

const Events = () => {
  const [events, setEvents] = useState([])

  const [showFilters, setShowFilters] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [contactEvent, setContactEvent] = useState(null)
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    search: ''
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events')
        const apiEvents = response.data.events || []

        const mapped = apiEvents.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          organizer: event.organizer,
          category: event.category,
          maxAttendees: event.maxAttendees,
          currentAttendees: event.currentAttendees || 0,
          contactInfo: event.contactInfo || { email: '', phone: '' },
          createdBy: event.createdBy,
          isOwner: !!event.isOwner,
          isAttending: !!event.isAttending,
        }))

        setEvents(mapped)
      } catch (error) {
        toast.error('Failed to load events')
      }
    }

    fetchEvents()
  }, [])

  const onSubmit = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        organizer: data.organizer,
        category: data.category,
        maxAttendees: data.maxAttendees ? Number(data.maxAttendees) : undefined,
        contactInfo: {
          email: data.contactInfo?.email || data['contactInfo.email'],
          phone: data.contactInfo?.phone || data['contactInfo.phone'] || '',
        },
      }

      const response = await api.post('/events', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      const created = response.data.event
      const mapped = {
        id: created.id,
        title: created.title,
        description: created.description,
        date: created.date,
        time: created.time,
        location: created.location,
        organizer: created.organizer,
        category: created.category,
        maxAttendees: created.maxAttendees,
        currentAttendees: created.currentAttendees || 0,
        contactInfo: created.contactInfo || { email: '', phone: '' },
        createdBy: created.createdBy,
        isOwner: true,
        isAttending: false,
      }

      setEvents([mapped, ...events])
      reset()
      setShowCreateForm(false)
      toast.success('Event created successfully!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create event. Please try again.'
      toast.error(message)
    }
  }

  const handleAttend = async (eventId) => {
    try {
      const response = await api.post(
        `/events/${eventId}/attend`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      const { attending, currentAttendees } = response.data

      setEvents(events.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            isAttending: attending,
            currentAttendees,
          }
        }
        return event
      }))

      toast.success(attending ? 'Successfully registered!' : 'Successfully unregistered!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update attendance'
      toast.error(message)
    }
  }

  const filteredEvents = events.filter(event => {
    if (filters.category && event.category !== filters.category) return false
    if (filters.location && !event.location.toLowerCase().includes(filters.location.toLowerCase())) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return event.title.toLowerCase().includes(searchLower) || 
             event.description.toLowerCase().includes(searchLower) ||
             event.organizer.toLowerCase().includes(searchLower)
    }
    return true
  })

  const getCategoryColor = (category) => {
    const cat = EVENT_CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : 'bg-dark-card/70 text-dark-muted';
  }

  const getCategoryLabel = (category) => {
    const cat = EVENT_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category.charAt(0).toUpperCase() + category.slice(1);
  }

  const isEventFull = (event) => {
    return event.maxAttendees && event.currentAttendees >= event.maxAttendees
  }

  const isEventPast = (date) => {
    return new Date(date) < new Date()
  }

  return (
    <div className="dashboard-page">
      <PageHeading
        pathname="/events"
        eyebrow="Community"
        title="Upcoming Events"
        description="Discover and join community events across Cameroon."
      >
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </PageHeading>

      {/* Search and Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Search events..."
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
              {EVENT_CATEGORIES.map(cat => (
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
          </div>
        </div>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold text-dark-text mb-6">Create New Event</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Event Title</label>
                <input
                  {...register('title', { required: 'Event title is required' })}
                  className="input-field"
                  placeholder="Event title"
                />
                {errors.title && <p className="text-sm text-cyber-pink">{errors.title.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Category</label>
                <select {...register('category', { required: 'Category is required' })} className="input-field">
                  <option value="">Select category</option>
                  {EVENT_CATEGORIES.map(cat => (
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
                placeholder="Describe your event..."
              />
              {errors.description && <p className="text-sm text-cyber-pink">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Date</label>
                <input
                  {...register('date', { required: 'Date is required' })}
                  type="date"
                  className="input-field"
                />
                {errors.date && <p className="text-sm text-cyber-pink">{errors.date.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Time</label>
                <input
                  {...register('time', { required: 'Time is required' })}
                  type="time"
                  className="input-field"
                />
                {errors.time && <p className="text-sm text-cyber-pink">{errors.time.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Max Attendees (Optional)</label>
                <input
                  {...register('maxAttendees')}
                  type="number"
                  min="1"
                  className="input-field"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Location</label>
                <input
                  {...register('location', { required: 'Location is required' })}
                  className="input-field"
                  placeholder="Venue, City"
                />
                {errors.location && <p className="text-sm text-cyber-pink">{errors.location.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Organizer</label>
                <input
                  {...register('organizer', { required: 'Organizer is required' })}
                  className="input-field"
                  placeholder="Your name or organization"
                />
                {errors.organizer && <p className="text-sm text-cyber-pink">{errors.organizer.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Contact Email</label>
                <input
                  {...register('contactInfo.email', { required: 'Contact email is required' })}
                  type="email"
                  className="input-field"
                  placeholder="contact@event.com"
                />
                {errors.contactInfo?.email && <p className="text-sm text-cyber-pink">{errors.contactInfo.email.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone (Optional)</label>
                <input
                  {...register('contactInfo.phone')}
                  className="input-field"
                  placeholder="+237 XXX XXX XXX"
                />
              </div>
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
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvents.map((event) => (
          <div key={event.id} className="card p-6 hover:shadow-cyber transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-dark-text mb-2">{event.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-dark-muted mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                    {getCategoryLabel(event.category)}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                </div>
                <p className="text-dark-muted text-sm">Organized by {event.organizer}</p>
              </div>
            </div>
            
            <p className="text-dark-muted mb-4 line-clamp-3">{event.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-dark-muted">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-dark-muted">
                <Users className="w-4 h-4" />
                <span>{event.currentAttendees} attending</span>
                {event.maxAttendees && (
                  <span className="text-gray-500">
                    (Max: {event.maxAttendees})
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              {event.isOwner ? (
                <button
                  type="button"
                  onClick={() => toast('Open event registrations from My Events (coming soon)')}
                  className="btn btn-primary flex-1"
                >
                  Manage event ({event.currentAttendees} registered)
                </button>
              ) : (
                <button
                  onClick={() => handleAttend(event.id)}
                  disabled={isEventFull(event) || isEventPast(event.date)}
                  className={`btn flex-1 ${
                    event.isAttending 
                      ? 'btn-secondary' 
                      : isEventFull(event) || isEventPast(event.date)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                >
                  {event.isAttending ? 'Cancel Registration' : 
                   isEventFull(event) ? 'Event Full' :
                   isEventPast(event.date) ? 'Event Passed' :
                   'Register Now'}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setContactEvent(event)}
                className="btn btn-secondary px-4"
              >
                Contact
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-dark-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-text mb-2">No upcoming events found</h3>
          <p className="text-dark-muted">Try adjusting your filters or create a new event</p>
        </div>
      )}

      {/* Contact modal */}
      {contactEvent && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="card max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-semibold text-dark-text mb-2">
              Contact Organizer
            </h2>
            <p className="text-sm text-dark-muted mb-4">
              {contactEvent.organizer} â€¢ {contactEvent.title}
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2 text-sm text-dark-text">
                <span className="font-medium w-20">Email:</span>
                {contactEvent.contactInfo?.email ? (
                  <a
                    href={`mailto:${contactEvent.contactInfo.email}`}
                    className="text-cyber-blue hover:text-cyber-purple break-all"
                  >
                    {contactEvent.contactInfo.email}
                  </a>
                ) : (
                  <span className="text-dark-muted">Not provided</span>
                )}
              </div>

              <div className="flex items-center space-x-2 text-sm text-dark-text">
                <span className="font-medium w-20">Phone:</span>
                {contactEvent.contactInfo?.phone ? (
                  <span>{contactEvent.contactInfo.phone}</span>
                ) : (
                  <span className="text-dark-muted">Not provided</span>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setContactEvent(null)}
              >
                Close
              </button>
              {contactEvent.contactInfo?.email && (
                <a
                  href={`mailto:${contactEvent.contactInfo.email}`}
                  className="btn btn-primary"
                  onClick={() => setContactEvent(null)}
                >
                  Open Email App
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Events
