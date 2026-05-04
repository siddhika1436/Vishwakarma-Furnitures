import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../utils/api'

const ADMIN_EMAIL = 'deepakschaudhari07@gmail.com'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from stored JWT — replaces supabase.auth.getSession()
    auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      setUser(null)
      setLoading(false)
    })

    // Supabase had onAuthStateChange; with JWT we just use local state.
    // No subscription needed — auth state changes happen via signIn/signOut calls.
  }, [])

  // Replaces supabase.auth.signUp(...)
  const signUp = async (email, password, fullName) => {
    const { data, error } = await auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    return { data, error }
  }

  // Replaces supabase.auth.signInWithPassword(...)
  const signIn = async (email, password) => {
    const { data, error } = await auth.signInWithPassword({ email, password })
    if (!error && data?.session?.user) {
      setUser(data.session.user)
    }
    return { data, error }
  }

  // Replaces supabase.auth.signOut()
  const signOut = async () => {
    const { error } = await auth.signOut()
    setUser(null)
    return { error }
  }

  const isAdmin = user?.email === ADMIN_EMAIL

  const value = {
    user,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
