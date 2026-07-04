import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Mail, MapPin, Briefcase, Edit2, Save, X, Camera, Phone, MessageCircle } from 'lucide-react'
import api from '../api/axios'
import PageHeading from '../components/layout/PageHeading'
import ConnectedProviders from '../components/auth/ConnectedProviders'

const Profile = ({ user, setUser }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '')
  const avatarInputRef = useRef(null)
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: user.name,
      bio: user.bio || '',
      location: user.location,
      avatar: user.avatar || '',
      phone: user.phone || '',
      whatsappOptIn: !!user.whatsappOptIn,
    }
  })

  const phoneValue = watch('phone')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await api.put('/auth/me', data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const updatedUser = response.data.user
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    reset({
      name: user.name,
      bio: user.bio || '',
      location: user.location,
      avatar: user.avatar || '',
      phone: user.phone || '',
      whatsappOptIn: !!user.whatsappOptIn,
    })
    setAvatarPreview(user.avatar || '')
    setIsEditing(false)
  }

  const getRoleLabel = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
  }

  return (
    <div className="dashboard-page max-w-4xl">
      <PageHeading
        pathname="/profile"
        eyebrow="Account"
        title="Profile"
        description="Manage your personal information and preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="text-center">
              <div className="relative inline-block group">
                {avatarPreview ? (
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-cyber-blue p-1 shadow-neon-blue">
                    <img 
                      src={avatarPreview} 
                      alt={user.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold border-2 border-dark-border shadow-2xl">
                    {user.name.charAt(0)}
                  </div>
                )}
                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute bottom-4 right-0 p-2 bg-dark-bg/70 border border-dark-border text-white rounded-full hover:border-cyber-blue/40 transition-colors"
                      title="Upload avatar"
                    >
                    <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          const value = String(reader.result || '')
                          setAvatarPreview(value)
                          setValue('avatar', value, { shouldDirty: true })
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </>
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-dark-text mb-2">{user.name}</h2>
              <p className="text-dark-muted mb-1">{getRoleLabel(user.role)}</p>
              <div className="flex items-center justify-center text-sm text-dark-muted mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{user.location}</span>
              </div>
              
              <div className="flex items-center justify-center text-sm text-dark-muted mb-6">
                <Mail className="w-4 h-4 mr-1" />
                <span>{user.email}</span>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Activity Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-muted">Member Since</span>
                <span className="text-dark-text font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted">Posts Created</span>
                <span className="text-dark-text font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted">Events Attended</span>
                <span className="text-dark-text font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted">Profile Views</span>
                <span className="text-dark-text font-medium">156</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-dark-text">
                {isEditing ? 'Edit Profile' : 'Profile Information'}
              </h3>
              {isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="btn btn-secondary flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isLoading}
                    className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Full Name
                  </label>
                  <input
                    {...register('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                    {errors.name && (
                      <p className="mt-1 text-sm text-cyber-pink">{errors.name.message}</p>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Bio
                  </label>
                  <textarea
                    {...register('bio', {
                      maxLength: {
                        value: 500,
                        message: 'Bio cannot exceed 500 characters'
                      }
                    })}
                    className="input-field"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-cyber-pink">{errors.bio.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Location
                  </label>
                  <input
                    {...register('location', {
                      required: 'Location is required',
                      minLength: {
                        value: 2,
                        message: 'Location must be at least 2 characters'
                      }
                    })}
                    className="input-field"
                    placeholder="City, Cameroon"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-cyber-pink">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Avatar URL (Optional)
                  </label>
                  <input
                    {...register('avatar')}
                    className="input-field"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  {errors.avatar && (
                    <p className="mt-1 text-sm text-cyber-pink">{errors.avatar.message}</p>
                  )}
                </div>

                <div className="rounded-xl border border-dark-border/80 bg-dark-bg/30 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-cyber-blue" />
                    <h4 className="text-sm font-semibold text-dark-text">Contact & WhatsApp</h4>
                  </div>
                  <p className="text-xs text-dark-muted">
                    Used across applications and messaging so recruiters and applicants can reach you on WhatsApp.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Phone number
                    </label>
                    <input
                      {...register('phone', {
                        maxLength: { value: 50, message: 'Phone cannot exceed 50 characters' },
                      })}
                      className="input-field"
                      placeholder="+237 6XX XXX XXX"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-cyber-pink">{errors.phone.message}</p>
                    )}
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register('whatsappOptIn')}
                      disabled={!phoneValue?.trim()}
                      className="mt-1 rounded border-dark-border text-cyber-blue focus:ring-cyber-blue/30 disabled:opacity-40"
                    />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-dark-text">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        Allow WhatsApp contact
                      </span>
                      <span className="block text-xs text-dark-muted mt-0.5">
                        When enabled, opportunity creators and applicants can open a pre-filled WhatsApp chat with you.
                      </span>
                    </span>
                  </label>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-dark-muted mb-2">About</h4>
                  <p className="text-dark-text">
                    {user.bio || 'No bio added yet. Tell us about yourself!'}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-dark-muted mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-dark-muted" />
                      <span className="text-dark-text">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-dark-muted" />
                      <span className="text-dark-text">{user.location}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-dark-muted" />
                        <span className="text-dark-text">{user.phone}</span>
                        {user.whatsappOptIn && (
                          <span className="text-xs text-emerald-400 font-medium">WhatsApp enabled</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Briefcase className="w-5 h-5 text-dark-muted" />
                      <span className="text-dark-text">{getRoleLabel(user.role)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-dark-muted mb-2">Account Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-dark-muted">Account Type</span>
                      <span className="text-dark-text font-medium">{getRoleLabel(user.role)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-muted">Member Since</span>
                      <span className="text-dark-text font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-muted">Last Updated</span>
                      <span className="text-dark-text font-medium">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConnectedProviders user={user} setUser={setUser} />
    </div>
  )
}

export default Profile
