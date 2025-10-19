"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { Loader2 } from "lucide-react"

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createBrowserSupabaseClient()
        
        // Get the hash fragment from the URL (Supabase sends tokens in the hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        console.log("[auth-callback] Processing callback", { type, hasAccessToken: !!accessToken })

        if (type === 'signup' || type === 'email') {
          if (accessToken && refreshToken) {
            // Set the session with the tokens from the URL
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              console.error("[auth-callback] Session error", sessionError)
              setError("Failed to confirm your email. Please try again.")
              setTimeout(() => navigate("/login"), 3000)
              return
            }

            if (data.user) {
              console.log("[auth-callback] Email confirmed successfully, redirecting to dashboard")
              // Redirect to dashboard after successful email confirmation
              setTimeout(() => navigate("/dashboard"), 1000)
              return
            }
          }
        }

        // If we get here and there's no valid session, redirect to login
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          console.log("[auth-callback] No valid session found")
          setError("Invalid or expired confirmation link.")
          setTimeout(() => navigate("/login"), 3000)
          return
        }

        // If there's a session, redirect to dashboard
        navigate("/dashboard")
      } catch (err) {
        console.error("[auth-callback] Unexpected error", err)
        setError("Something went wrong. Please try signing in.")
        setTimeout(() => navigate("/login"), 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive text-lg font-semibold">⚠️ {error}</div>
          <p className="text-sm text-muted-foreground">Redirecting you to the login page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <div className="space-y-2">
          <p className="text-lg font-semibold">Confirming your email...</p>
          <p className="text-sm text-muted-foreground">Please wait while we set up your account</p>
        </div>
      </div>
    </div>
  )
}