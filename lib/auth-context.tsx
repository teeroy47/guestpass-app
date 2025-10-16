"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

interface AuthContextType {
  user: User | null
  loading: boolean
  displayName: string | null
  hasDisplayName: boolean
  refreshUser: () => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
  signInWithOtp: (email: string) => Promise<{ error: string | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithPassword: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  const fetchDisplayName = useCallback(async (userId: string) => {
    try {
      console.log("[auth] fetchDisplayName: Querying for user", userId)
      const { data, error } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("[auth] fetchDisplayName error", error)
        return null
      }

      console.log("[auth] fetchDisplayName: Query result", data)
      return data?.display_name || null
    } catch (error) {
      console.error("[auth] fetchDisplayName unexpected error", error)
      return null
    }
  }, [supabase])

  const ensureUserProfile = useCallback(async (authUser: User) => {
    console.log("[auth] ensureUserProfile start", authUser.id)
    const email = authUser.email
    if (!email) {
      console.warn("[auth] ensureUserProfile skip: missing email", authUser.id)
      return
    }

    const metadataFullName = authUser.user_metadata?.full_name
    const fullName =
      typeof metadataFullName === "string" && metadataFullName.trim().length > 0 ? metadataFullName : email

    const metadataRole = authUser.app_metadata?.role
    const role = typeof metadataRole === "string" && metadataRole.trim().length > 0 ? metadataRole : "admin"

    try {
      const { error } = await supabase
        .from("users")
        .upsert(
          {
            id: authUser.id,
            email,
            full_name: fullName,
            role,
          },
          { onConflict: "id" },
        )

      if (error) {
        console.error("[auth] ensureUserProfile error", error)
        // Don't throw - we want to continue even if profile creation fails
      } else {
        console.log("[auth] ensureUserProfile success", authUser.id)
        
        // Fetch display name after ensuring profile
        const name = await fetchDisplayName(authUser.id)
        setDisplayName(name)
        console.log("[auth] Display name fetched:", name)
      }
    } catch (error) {
      console.error("[auth] ensureUserProfile unexpected error", error)
      // Don't throw - we want to continue even if profile creation fails
    }
  }, [supabase, fetchDisplayName])

  const loadCurrentUser = useCallback(async () => {
    console.log("[auth] loadCurrentUser start")
    
    try {
      // First check if we have a session in storage
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log("[auth] loadCurrentUser getSession response", { 
        hasSession: !!session, 
        userId: session?.user?.id,
        error: sessionError 
      })
      
      if (sessionError) {
        console.error("[auth] loadCurrentUser getSession error", sessionError)
        setUser(null)
        return
      }
      
      // If we have a session, get the user details
      if (session?.user) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        console.log("[auth] loadCurrentUser getUser response", { userId: user?.id, error })

        if (error) {
          console.error("[auth] loadCurrentUser getUser error", error)
          setUser(null)
          return
        }

        if (user) {
          await ensureUserProfile(user)
          setUser(user)
          console.log("[auth] User session restored successfully", user.id)
        } else {
          setUser(null)
        }
      } else {
        console.log("[auth] loadCurrentUser no session found")
        setUser(null)
      }
      
      console.log("[auth] loadCurrentUser complete")
    } catch (error) {
      console.error("[auth] loadCurrentUser unexpected error", error)
      setUser(null)
    }
  }, [supabase, ensureUserProfile])

  useEffect(() => {
    console.log("[auth] useEffect: Initializing auth state")
    let mounted = true
    
    // Listen for auth state changes (this will fire immediately with current session)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[auth] Auth state changed:", event, session?.user?.id)
      
      if (!mounted) {
        console.log("[auth] Component unmounted, skipping state update")
        return
      }
      
      const sessionUser = session?.user ?? null

      // Update user state immediately
      setUser(sessionUser)
      setLoading(false)
      console.log("[auth] Auth state updated, loading complete")

      // Clear display name if user signed out
      if (!sessionUser) {
        setDisplayName(null)
        console.log("[auth] User signed out, cleared display name")
      }

      // Ensure profile in background (don't block UI)
      if (sessionUser) {
        ensureUserProfile(sessionUser)
          .then(() => console.log("[auth] Profile ensured for user", sessionUser.id))
          .catch((error) => console.error("[auth] Failed to ensure user profile", error))
      }
    })

    // Also manually check session on mount (for immediate feedback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      console.log("[auth] Initial session check:", session?.user?.id || "no session")
      
      if (session?.user) {
        // Set user immediately, don't wait for profile
        setUser(session.user)
        setLoading(false)
        // Ensure profile in background
        ensureUserProfile(session.user).catch(console.error)
      } else {
        setLoading(false)
      }
    }).catch((error) => {
      console.error("[auth] Initial session check failed", error)
      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      console.log("[auth] Cleaning up auth subscription")
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, ensureUserProfile])

  const signInWithOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}` } })
    if (error) {
      console.error("[auth] Sign in with OTP failed", error)
      return { error: error.message }
    }
    return { error: null }
  }, [supabase])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error("[auth] Password sign-in failed", error)
      return { error: error.message }
    }
    console.log("[auth] Password sign-in successful")
    return { error: null }
  }, [supabase])

  const signUpWithPassword = useCallback(async (email: string, password: string, displayName?: string) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`
      }
    })

    if (error) {
      console.error("[auth] Password sign-up failed", error)
      return { error: error.message }
    }

    if (user) {
      await ensureUserProfile(user)
      
      // If display name was provided during signup, save it immediately
      if (displayName && displayName.trim().length > 0) {
        try {
          const { error: updateError } = await supabase
            .from("users")
            .update({ display_name: displayName.trim() })
            .eq("id", user.id)
          
          if (updateError) {
            console.error("[auth] Failed to save display name during signup", updateError)
          } else {
            setDisplayName(displayName.trim())
            console.log("[auth] Display name saved during signup:", displayName.trim())
          }
        } catch (err) {
          console.error("[auth] Unexpected error saving display name during signup", err)
        }
      }
    }

    console.log("[auth] Password sign-up successful")
    return { error: null }
  }, [supabase, ensureUserProfile])

  const updateDisplayName = useCallback(async (name: string) => {
    if (!user) {
      throw new Error("No user logged in")
    }

    console.log("[auth] Updating display name for user", user.id)

    try {
      const { error } = await supabase
        .from("users")
        .update({ display_name: name })
        .eq("id", user.id)

      if (error) {
        console.error("[auth] updateDisplayName error", error)
        throw new Error("Failed to update display name")
      }

      setDisplayName(name)
      console.log("[auth] Display name updated successfully:", name)
    } catch (error) {
      console.error("[auth] updateDisplayName unexpected error", error)
      throw error
    }
  }, [user, supabase])

  const signOut = useCallback(async () => {
    console.log("[auth] Signing out")
    
    // Set user to null immediately for instant UI feedback
    setUser(null)
    setDisplayName(null)
    
    // Sign out from Supabase (this will clear localStorage and trigger onAuthStateChange)
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    
    if (error) {
      console.error("[auth] Sign out failed", error)
      throw error
    }
    
    console.log("[auth] Sign out successful")
  }, [supabase])

  const value = useMemo(
    () => {
      const hasDisplayName = displayName !== null && displayName.trim().length > 0
      console.log("[auth] Context value updated:", { 
        hasUser: !!user, 
        loading, 
        displayName, 
        hasDisplayName 
      })
      return {
        user,
        loading,
        displayName,
        hasDisplayName,
        refreshUser: loadCurrentUser,
        updateDisplayName,
        signInWithOtp,
        signInWithPassword,
        signUpWithPassword,
        signOut,
      }
    },
    [user, loading, displayName, loadCurrentUser, updateDisplayName, signInWithOtp, signInWithPassword, signUpWithPassword, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
