import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'
import { getBestLocation } from '../services/locationService'
import { Trash2, Camera, UploadCloud } from 'lucide-react'

const pageTransition = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
}

const badges = [
  { emoji: '🥗', title: 'First Green Trip', description: 'Took your first sustainable journey' },
  { emoji: '🚴', title: 'Cycle Starter', description: 'Used cycling as a route option' },
  { emoji: '🌍', title: 'Carbon Cutter', description: 'Saved over 1kg of CO₂' },
]

function getModeEmoji(mode) {
  const modeMap = {
    walking: '🚶',
    cycling: '🚴',
    driving: '🚗',
    transit: '🚌',
    bus: '🚌',
    metro: '🚇',
  }
  return modeMap[mode?.toLowerCase()] || '🚌'
}

function Profile() {
  const navigate = useNavigate()
  const { user, tripHistory, loading, fetchTrips, refreshUser } = useAuth()
  
  const savedRoutes = Array.isArray(tripHistory) ? tripHistory : []
  const [routesLoading, setRoutesLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(true)
  const [locationError, setLocationError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState({ tripId: null, show: false })
  const [profileUploading, setProfileUploading] = useState(false)
  const [profileUploadError, setProfileUploadError] = useState('')

  useEffect(() => {
    if (loading) return

    if (!user?.id) {
      setRoutesLoading(false)
      setLocationLoading(false)
      return
    }

    // Fetch current location
    const loadLocation = async () => {
      try {
        setLocationLoading(true)
        setLocationError('')
        const location = await getBestLocation()
        setCurrentLocation(location)
      } catch (locationError) {
        setLocationError(
          typeof locationError === 'string'
            ? locationError
            : locationError?.message || 'Unable to retrieve current location.',
        )
      } finally {
        setLocationLoading(false)
      }
    }

    loadLocation()
  }, [user?.id, loading, navigate])

  useEffect(() => {
    if (!user?.id) return

    const loadSavedRoutes = async () => {
      try {
        setRoutesLoading(true)
        await fetchTrips()
      } catch (error) {
        console.error('Error loading trips:', error)
      } finally {
        setRoutesLoading(false)
      }
    }

    loadSavedRoutes()
  }, [user?.id, fetchTrips])

  useEffect(() => {
    console.log('AUTH USER:', user)
    console.log('TRIPS:', tripHistory)
  }, [user, tripHistory])

  useEffect(() => {
    console.log('PROFILE USER UPDATED:', user)
  }, [user])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please log in</div>
  }

  const profilePictureUrl = user?.profile_picture_url
  const profileEmail = user?.email || 'No email provided'

  let displayName = 'User'
  try {
    if (user?.name) {
      displayName = user.name
    } else if (typeof profileEmail === 'string' && profileEmail.includes('@')) {
      displayName = profileEmail.split('@')[0]
    }
  } catch (error) {
    console.error('Error resolving display name:', error)
  }

  let initials = 'MM'
  try {
    let nameSource = user?.name || profileEmail
    if (typeof nameSource === 'string' && nameSource.includes('@')) {
      nameSource = nameSource.split('@')[0]
    }
    if (typeof nameSource === 'string' && nameSource.trim()) {
      const parts = nameSource.trim().split(/\s+/)
      initials =
        parts.length === 1
          ? parts[0].charAt(0).toUpperCase()
          : `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
    }
  } catch (error) {
    console.error('Error computing initials:', error)
  }

  // Calculate aggregate stats from trips
  let aggregateStats = {
    totalTrips: 0,
    totalCarbonSaved: 0,
    totalDistance: 0,
    mostUsedMode: null,
  }

  if (savedRoutes.length) {
    aggregateStats = {
      totalTrips: savedRoutes.length,
      totalCarbonSaved: Number(
        savedRoutes.reduce((sum, route) => sum + (route.carbon_saved || 0), 0).toFixed(2)
      ),
      totalDistance: Number(
        savedRoutes.reduce((sum, route) => sum + (route.distance_km || 0), 0).toFixed(1)
      ),
      mostUsedMode: null,
    }

    const modeCounts = {}
    savedRoutes.forEach((route) => {
      const mode = route.transport_mode || 'unknown'
      modeCounts[mode] = (modeCounts[mode] || 0) + 1
    })

    aggregateStats.mostUsedMode = Object.keys(modeCounts).reduce((a, b) =>
      modeCounts[a] > modeCounts[b] ? a : b,
      null,
    )
  }

  const locationBadge = !currentLocation?.source
    ? ''
    : {
        gps: '📍 Precise',
        ip: '🌐 Approximate',
        fallback: '⚠️ Default',
      }[currentLocation.source] || '🌐 Approximate'

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Error signing out:', error)
      navigate('/', { replace: true })
    }
  }

  const handleDeleteRoute = async (tripId) => {
    try {
      const { error } = await supabase
        .from('saved_routes')
        .delete()
        .eq('id', tripId)

      if (error) throw error

      await fetchTrips()
      setDeleteConfirm({ tripId: null, show: false })
    } catch (error) {
      console.error('Error deleting route:', error)
    }
  }

  const uploadProfileImage = async (file) => {
    const { data } = await supabase.auth.getUser()
    const authUser = data.user

    console.log("USER BEFORE UPLOAD:", authUser)

    if (!authUser) {
      console.error("User not authenticated")
      return
    }

    const filePath = `${authUser.id}/${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file)

    if (error) {
      console.error("Upload failed:", error)
      return
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileUploadError('Please upload a JPEG, PNG, or WEBP image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileUploadError('Profile image must be 5MB or less')
      return
    }

    setProfileUploading(true)
    setProfileUploadError('')

    try {
      const publicUrl = await uploadProfileImage(file)

      if (publicUrl && user?.id) {
        // Update profile in database using maybeSingle to avoid PGRST116
        const { error } = await supabase
          .from('profiles')
          .update({ profile_picture_url: publicUrl })
          .eq('id', user.id)

        if (error) throw error

        // Refresh the auth profile without reloading the page
        await refreshUser()
      }
    } catch (error) {
      console.error('Profile image upload failed:', error)
      setProfileUploadError('Failed to upload profile image. Please try again.')
    } finally {
      setProfileUploading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Saved trip'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const truncateText = (text, maxLength = 30) => {
    if (!text) return 'Unknown'
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  }

  console.log('RENDER TRIPS:', tripHistory)

  return (
    <motion.section
      className="px-4 pb-10 pt-8 sm:px-6 lg:px-8"
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div
          className="rounded-[2rem] border p-8 text-center"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-border) 55%, transparent)',
            background: 'color-mix(in srgb, var(--color-bg-card) 80%, transparent)',
            boxShadow: 'var(--shadow-card)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div className="mx-auto mb-6 flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full bg-emerald-500 relative group">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={displayName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-5xl font-serif text-white">{initials}</span>
            )}
            
            {/* Upload overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label htmlFor="profile-image-upload" className="cursor-pointer">
                <Camera size={24} className="text-white" />
              </label>
            </div>
            
            <input
              id="profile-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleProfileImageUpload}
              className="hidden"
              disabled={profileUploading}
            />
          </div>
          
          {profileUploading && (
            <p className="text-sm text-emerald-400 mb-2">Uploading...</p>
          )}
          
          {profileUploadError && (
            <p className="text-sm text-red-400 mb-2">{profileUploadError}</p>
          )}
          
          <div className="mb-4">
            <label htmlFor="profile-image-upload" className="inline-flex items-center gap-2 cursor-pointer text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              <UploadCloud size={16} />
              {profilePictureUrl ? 'Change profile picture' : 'Add profile picture'}
            </label>
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-white">{user?.name || displayName || 'No Name'}</h1>
          <p className="mt-2 text-sm text-white/80">{profileEmail}</p>
          <p className="mt-4 text-sm text-white/75">🌍 {user?.country || 'Unknown country'}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Log Out
          </button>
        </div>
        <div
          className="rounded-[2rem] border border-emerald-200 bg-white/10 p-6 text-left"
          style={{ backdropFilter: 'blur(18px)' }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Current Location</h2>
              <p className="mt-1 text-sm text-white/70">Your latest detected position from the browser.</p>
            </div>
            <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-700">
              {locationLoading ? 'Detecting…' : locationBadge}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {locationLoading ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-100/20 p-6 text-center text-sm text-slate-600">
                Loading current location…
              </div>
            ) : locationError ? (
              <div className="rounded-3xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-600">
                {locationError}
              </div>
            ) : currentLocation ? (
              <div className="rounded-3xl border border-emerald-200 bg-white/90 p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{currentLocation.name || 'Current location'}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Source: {locationBadge}
                </div>
              </div>
            ) : (
              <p className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No location data available yet.
              </p>
            )}
          </div>
        </div>

        {aggregateStats.totalTrips === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.5rem] border border-emerald-200 bg-white/10 p-8 text-center"
            style={{ backdropFilter: 'blur(18px)' }}
          >
            <p className="text-2xl">🌿</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">No trips yet</h3>
            <p className="mt-2 text-sm text-slate-500">Start exploring sustainable routes to begin building your green impact!</p>
            <button
              type="button"
              onClick={() => navigate('/map')}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Find a Route →
            </button>
          </motion.div>
        ) : (
          <>
            <div className="space-y-5 border-t border-emerald-200/70 pt-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Green Journey</h2>
                <p className="mt-2 text-sm text-white/70">Track your impact and stay motivated with eco-friendly travel stats.</p>
                {aggregateStats.mostUsedMode && (
                  <p className="mt-3 text-sm font-semibold text-emerald-700">
                    Favorite Transport Mode: {aggregateStats.mostUsedMode.charAt(0).toUpperCase() + aggregateStats.mostUsedMode.slice(1)}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <motion.div
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[1.5rem] border border-emerald-200 bg-white/10 p-6"
                  style={{ backdropFilter: 'blur(18px)' }}
                >
                  <p className="text-3xl font-semibold">🌿</p>
                  <p className="mt-4 text-2xl font-bold text-emerald-700">{aggregateStats.totalTrips}</p>
                  <p className="mt-2 text-sm text-slate-500">Total Trips</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                  className="rounded-[1.5rem] border border-emerald-200 bg-white/10 p-6"
                  style={{ backdropFilter: 'blur(18px)' }}
                >
                  <p className="text-3xl font-semibold">📍</p>
                  <p className="mt-4 text-2xl font-bold text-emerald-700">{aggregateStats.totalDistance} km</p>
                  <p className="mt-2 text-sm text-slate-500">Total Distance</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                  className="rounded-[1.5rem] border border-emerald-200 bg-white/10 p-6"
                  style={{ backdropFilter: 'blur(18px)' }}
                >
                  <p className="text-3xl font-semibold">💨</p>
                  <p className="mt-4 text-2xl font-bold text-emerald-700">{aggregateStats.totalCarbonSaved} kg</p>
                  <p className="mt-2 text-sm text-slate-500">CO₂ Saved</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                  className="rounded-[1.5rem] border border-emerald-200 bg-white/10 p-6"
                  style={{ backdropFilter: 'blur(18px)' }}
                >
                  <p className="text-3xl font-semibold">{aggregateStats.mostUsedMode ? getModeEmoji(aggregateStats.mostUsedMode) : '🚌'}</p>
                  <p className="mt-4 text-2xl font-bold text-emerald-700">
                    {aggregateStats.mostUsedMode
                      ? aggregateStats.mostUsedMode.charAt(0).toUpperCase() + aggregateStats.mostUsedMode.slice(1)
                      : 'None yet'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Favourite Mode</p>
                </motion.div>
              </div>
            </div>

            <div className="space-y-4 border-t border-emerald-200/70 pt-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Badges Earned</h2>
                <p className="mt-1 text-sm text-white/70">Celebrate your sustainable travel milestones.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {badges.map((badge) => (
                  <motion.div
                    key={badge.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[1.5rem] border border-emerald-200 bg-white/10 p-5 text-center"
                    style={{ backdropFilter: 'blur(18px)' }}
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-2xl">
                      {badge.emoji}
                    </div>
                    <h3 className="text-sm font-semibold text-white">{badge.title}</h3>
                    <p className="mt-2 text-sm text-white/70">{badge.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-emerald-200/70 pt-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Trip History</h2>
                <p className="mt-1 text-sm text-white/70">Your saved routes and trips.</p>
              </div>

              {routesLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-[1.5rem] border border-emerald-200 bg-white/10 p-4"
                      style={{ backdropFilter: 'blur(18px)' }}
                    >
                      <div className="space-y-3">
                        <div className="h-6 w-32 rounded-md bg-slate-500/30" />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="h-12 rounded-lg bg-slate-500/30" />
                          <div className="h-12 rounded-lg bg-slate-500/30" />
                        </div>
                        <div className="flex gap-3">
                          <div className="h-4 w-20 rounded bg-slate-500/30" />
                          <div className="h-4 w-20 rounded bg-slate-500/30" />
                          <div className="h-4 w-24 rounded bg-slate-500/30" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : savedRoutes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[1.5rem] border border-emerald-200 bg-white/10 p-8 text-center"
                  style={{ backdropFilter: 'blur(18px)' }}
                >
                  <p className="text-3xl">🌿</p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">No trips yet</h3>
                  <p className="mt-2 text-sm text-slate-500">Start exploring green routes to begin building your trip history!</p>
                  <button
                    type="button"
                    onClick={() => navigate('/map')}
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    Find a Route →
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {savedRoutes.map((route, index) => (
                    <motion.div
                      key={route.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
                      className="relative rounded-[1.5rem] border border-emerald-200 bg-white/10 p-4"
                      style={{ backdropFilter: 'blur(18px)' }}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getModeEmoji(route.transport_mode)}</span>
                              <div>
                                <p className="font-semibold text-emerald-700">
                                  {route.transport_mode
                                    ? route.transport_mode.charAt(0).toUpperCase() + route.transport_mode.slice(1)
                                    : 'Trip'}
                                </p>
                                <p className="text-xs text-slate-500">{formatDate(route.created_at)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-300">{truncateText(route.from_location, 30)}</span>
                            <span className="text-slate-500">→</span>
                            <span className="text-sm font-medium text-slate-300">{truncateText(route.to_location, 30)}</span>
                          </div>

                          <div className="flex flex-wrap gap-3 text-sm text-slate-600 items-center">
                            <span>📍 {Number(route.distance_km || 0).toFixed(1)} km</span>
                            <span>💨 {Number(route.carbon_saved || 0).toFixed(2)} kg CO₂</span>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ tripId: route.id, show: true })}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500 transition hover:bg-red-500/20"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {/* Delete Confirmation Popover */}
                          <AnimatePresence>
                            {deleteConfirm.show && deleteConfirm.tripId === route.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute right-4 top-full z-20 mt-2 rounded-lg border border-red-200 bg-red-50 p-3 shadow-lg"
                              >
                                <p className="mb-3 text-sm font-medium text-red-900">Delete this trip?</p>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRoute(route.id)}
                                    className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-600"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirm({ tripId: null, show: false })}
                                    className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.section>
  )
}

export default Profile
