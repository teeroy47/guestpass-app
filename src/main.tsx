import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@/styles/globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { EventsProvider } from '@/lib/events-context'
import { GuestsProvider } from '@/lib/guests-context'

const container = document.getElementById('root')
if (!container) throw new Error('Root container not found')

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(container).render(
  <ErrorBoundary>
    <AuthProvider>
      <EventsProvider>
        <GuestsProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GuestsProvider>
      </EventsProvider>
    </AuthProvider>
  </ErrorBoundary>,
)
