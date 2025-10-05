import React from "react"
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom"
import HomePage from "@/app/page"
import { Dashboard } from "@/components/dashboard/dashboard"
import { EventList } from "@/components/events/event-list"
import { GuestList } from "@/components/guests/guest-list"
import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/lib/auth-context"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Checking authentication...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default function App() {
  const { user } = useAuth()

  const navLinkClass = (isDisabled: boolean) =>
    `text-sm ${isDisabled ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground hover:text-foreground"}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-4 py-3 border-b border-border bg-card">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="font-bold">
              Guestpass
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className={navLinkClass(false)}>
                  Dashboard
                </Link>
                <Link to="/events" className={navLinkClass(false)}>
                  Events
                </Link>
                <Link to="/guests" className={navLinkClass(false)}>
                  Guests
                </Link>
              </>
            ) : (
              <>
                <span className={navLinkClass(true)}>Dashboard</span>
                <span className={navLinkClass(true)}>Events</span>
                <span className={navLinkClass(true)}>Guests</span>
              </>
            )}
          </div>
          <div>
            {user ? (
              <span className="text-sm text-muted-foreground">Signed in</span>
            ) : (
              <Link to="/login" className="text-sm text-muted-foreground">
                Login
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guests"
            element={
              <ProtectedRoute>
                <GuestList />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </main>
    </div>
  )
}
