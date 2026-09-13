import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface AuthUser {
  id: string
  email: string
}

interface AuthValue {
  mode: 'supabase' | 'local'
  ready: boolean
  user: AuthUser | null
  /** Small data-URL image, kept in auth user metadata (or localStorage in local mode). */
  avatar: string | null
  setAvatar(dataUrl: string | null): Promise<void>
  signIn(email: string, password: string): Promise<string | null>
  signOut(): Promise<void>
}

const AVATAR_KEY = 'avatar'

const LOCAL_USER: AuthUser = { id: 'local', email: 'local device' }

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(supabase ? null : LOCAL_USER)
  const [ready, setReady] = useState(!supabase)
  const [avatar, setAvatarState] = useState<string | null>(() => {
    if (supabase) return null
    try {
      return localStorage.getItem(AVATAR_KEY)
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (!supabase) return
    // INITIAL_SESSION arrives right after subscribing, so one listener covers start-up too.
    // Only swap the user object when the id actually changes; token refreshes must not
    // look like a new sign-in to the data layer.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      setUser((prev) => {
        if (!u) return null
        if (prev && prev.id === u.id) return prev
        return { id: u.id, email: u.email ?? '' }
      })
      setAvatarState((u?.user_metadata?.avatar as string | undefined) ?? null)
      setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthValue = {
    mode: supabase ? 'supabase' : 'local',
    ready,
    user,
    avatar,
    async setAvatar(dataUrl) {
      setAvatarState(dataUrl)
      if (supabase) {
        await supabase.auth.updateUser({ data: { avatar: dataUrl } })
      } else {
        try {
          if (dataUrl) localStorage.setItem(AVATAR_KEY, dataUrl)
          else localStorage.removeItem(AVATAR_KEY)
        } catch {
          /* storage unavailable */
        }
      }
    },
    async signIn(email, password) {
      if (!supabase) return null
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error ? error.message : null
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
