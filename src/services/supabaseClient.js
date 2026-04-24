import { createClient } from "@supabase/supabase-js"
import { Capacitor } from "@capacitor/core"
import { Preferences } from "@capacitor/preferences"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase env vars missing. Check Vercel environment variable names.")
}

const capacitorStorage = {
  getItem: async (key) => {
    const { value } = await Preferences.get({ key })
    return value
  },
  setItem: async (key, value) => {
    await Preferences.set({ key, value })
  },
  removeItem: async (key) => {
    await Preferences.remove({ key })
  },
}

const authStorage = Capacitor.isNativePlatform() ? capacitorStorage : undefined

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(authStorage ? { storage: authStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
