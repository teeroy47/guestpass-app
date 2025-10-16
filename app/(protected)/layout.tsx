"use client"

import { type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import { NamePromptDialog } from "@/components/auth/name-prompt-dialog"

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading, hasDisplayName, displayName, updateDisplayName } = useAuth()

  console.log("[ProtectedLayout] Render state:", { 
    hasUser: !!user, 
    loading, 
    hasDisplayName, 
    displayName 
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  // Show name prompt if user doesn't have a display name
  console.log("[ProtectedLayout] Checking name prompt condition:", { hasDisplayName })
  if (!hasDisplayName) {
    return (
      <>
        <NamePromptDialog
          open={true}
          onSubmit={updateDisplayName}
          userEmail={user.email || ""}
        />
        {/* Render children in background but make them non-interactive */}
        <div className="pointer-events-none opacity-50">{children}</div>
      </>
    )
  }

  return <>{children}</>
}