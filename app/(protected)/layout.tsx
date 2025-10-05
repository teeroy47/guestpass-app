"use client"

import { type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/auth/login-form"

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

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

  return <>{children}</>
}