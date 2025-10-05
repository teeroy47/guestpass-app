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

createRoot(container).render(
  <React.StrictMode>
    <AuthProvider>
      <EventsProvider>
        <GuestsProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GuestsProvider>
      </EventsProvider>
    </AuthProvider>
  </React.StrictMode>,
)
