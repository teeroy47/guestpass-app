"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  signInWithOtp: (email: string) => Promise<{ error: string | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
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
  const [initialised, setInitialised] = useState(false)
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  const ensureUserProfile = async (authUser: User) => {
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
    } else {
      console.log("[auth] ensureUserProfile success", authUser.id)
    }
  }

  const loadCurrentUser = async () => {
    console.log("[auth] loadCurrentUser start")
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    console.log("[auth] loadCurrentUser getUser response", { user, error })

    if (error) {
      console.error("[auth] loadCurrentUser getUser error", error)
      setUser(null)
      return
    }

    console.log("[auth] loadCurrentUser getUser result", user?.id ?? null)

    if (user) {
      await ensureUserProfile(user)
    }

    setUser(user ?? null)
    console.log("[auth] loadCurrentUser complete", user?.id ?? null)
  }

  useEffect(() => {
    if (initialised) {
      return
    }

    loadCurrentUser()
      .catch((error) => {
        console.error("Initial auth load failed", error)
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
        setInitialised(true)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null

      if (sessionUser) {
        await ensureUserProfile(sessionUser)
      }

      setUser(sessionUser)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialised, supabase])

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}` } })
    if (error) {
      console.error("Sign in with OTP failed", error)
      return { error: error.message }
    }
    return { error: null }
  }

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error("Password sign-in failed", error)
      return { error: error.message }
    }
    return { error: null }
  }

  const signUpWithPassword = async (email: string, password: string) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({ email, password })

    if (error) {
      console.error("Password sign-up failed", error)
      return { error: error.message }
    }

    if (user) {
      await ensureUserProfile(user)
    }

    return { error: null }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out failed", error)
      return
    }
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser: loadCurrentUser,
      signInWithOtp,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
