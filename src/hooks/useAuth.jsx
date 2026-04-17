import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "../services/supabaseClient"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile from "profiles" table by auth user id
  const fetchProfile = useCallback(async (authUserId) => {
    if (!authUserId) {
      setUser(null)
      return
    }
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUserId)
        .maybeSingle()

      if (error) throw error
      // Merge auth uid into profile so user.id is always auth.uid()
      setUser(profileData ? { ...profileData, id: authUserId } : { id: authUserId })
    } catch (error) {
      console.error("Error fetching profile:", error)
      // Even if profile fetch fails, keep auth uid so trips can still be inserted
      setUser({ id: authUserId })
    }
  }, [])

  // Expose this so Profile page can re-fetch after new trips are added
  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.user?.id) {
      await fetchProfile(data.session.user.id)
    }
  }, [fetchProfile])

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        setSession(data.session)
        await fetchProfile(data.session?.user?.id)
      } catch (error) {
        console.error("Error fetching initial session:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      await fetchProfile(newSession?.user?.id)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [fetchProfile])

  // ── Trip helpers ────────────────────────────────────────────────────────────

  /**
   * Insert a trip row.  user_id is always taken from the live session so it
   * matches auth.uid() and satisfies the RLS policy:
   *   CREATE POLICY "Users can insert own trips"
   *     ON trips FOR INSERT
   *     WITH CHECK (user_id = auth.uid());
   */
  const insertTrip = useCallback(async (tripData) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const authUid = sessionData?.session?.user?.id

    if (!authUid) {
      throw new Error("Not authenticated. Cannot save trip.")
    }

    const row = {
      user_id: authUid,                          // always auth.uid()
      from_location: tripData.from_location || "Unknown",
      to_location: tripData.to_location || "",
      transport_mode: tripData.transport_mode || "",
      distance_km: tripData.distance_km ?? 0,
      carbon_saved: tripData.carbon_saved ?? 0,
      // created_at defaults to now() in Supabase — no need to send it
    }

    const { data, error } = await supabase.from("trips").insert(row).select().single()
    if (error) throw error
    return data
  }, [])

  /**
   * Fetch all trips for the logged-in user, newest first.
   */
  const fetchTrips = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const authUid = sessionData?.session?.user?.id
    if (!authUid) return []

    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", authUid)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching trips:", error)
      return []
    }
    return data ?? []
  }, [])

  /**
   * Derive favorite transport mode from an array of trips.
   * Returns null if no trips exist.
   */
  const getFavoriteTransportMode = useCallback((trips = []) => {
    if (!trips.length) return null
    const counts = trips.reduce((acc, t) => {
      const mode = t.transport_mode || "unknown"
      acc[mode] = (acc[mode] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }, [])

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isLoggedIn: !!session?.user,
        // expose auth uid directly for convenience
        authUid: session?.user?.id ?? null,
        refreshUser,
        insertTrip,
        fetchTrips,
        getFavoriteTransportMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
