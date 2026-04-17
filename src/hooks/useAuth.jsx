import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        setSession(data.session)

        // Fetch profile if session exists
        if (data.session?.user?.id) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single()

          if (profileError) throw profileError
          setUser(profileData)
        }
      } catch (error) {
        console.error("Error fetching initial session:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)

      if (newSession?.user?.id) {
        try {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newSession.user.id)
            .single()

          if (error) throw error
          setUser(profileData)
        } catch (error) {
          console.error("Error fetching profile on auth change:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
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
