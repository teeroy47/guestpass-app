import { Suspense } from "react"
import { Dashboard } from "@/components/dashboard/dashboard"
import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/lib/auth-context"

export const dynamic = "error"
export const runtime = "nodejs"

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <ProtectedDashboard />
    </Suspense>
  )
}

function ProtectedDashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Checking authentication...</span>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <Dashboard />
}
