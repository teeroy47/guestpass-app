import React, { Suspense, lazy, useEffect } from "react"
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom"

import { AppRouteSkeleton } from "@/components/layout/app-route-skeleton"
import { SiteBackground } from "@/components/layout/site-background"
import { Toaster } from "@/components/ui/toaster"

const HomePage = lazy(() => import("@/app/page"))
const OurSolutionPage = lazy(() => import("@/app/our-solution/page"))
const AboutPage = lazy(() => import("@/app/about/page"))
const ContactPage = lazy(() => import("@/app/contact/page"))
const CartPage = lazy(() => import("@/app/cart/page"))
const CheckoutPage = lazy(() => import("@/app/checkout/page"))
const PublicAccountPage = lazy(() => import("@/app/account/page"))
const PublicAccountAuthPage = lazy(() => import("@/app/account/auth/page"))
const PublicEventsPage = lazy(() =>
  import("@/components/events/public-events-page").then((module) => ({
    default: module.PublicEventsPage,
  })),
)
const AuthCallback = lazy(() =>
  import("@/components/auth/auth-callback").then((module) => ({
    default: module.AuthCallback,
  })),
)
const ResendConfirmation = lazy(() =>
  import("@/components/auth/resend-confirmation").then((module) => ({
    default: module.ResendConfirmation,
  })),
)

function ScrollToRouteTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      window.requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ block: "start" })
      })
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [pathname, hash])

  return null
}

function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">404</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-black sm:text-5xl">
        This page is not available.
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-600">
        The link may be old, mistyped, or not part of the public GuestPass website yet.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        Go home
      </Link>
    </section>
  )
}

export default function LandingApp() {
  return (
    <div className="relative min-h-screen bg-white text-foreground">
      <SiteBackground />
      <ScrollToRouteTop />
      <main className="relative z-10">
        <Suspense fallback={<AppRouteSkeleton standalone />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/our-solution" element={<OurSolutionPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/events" element={<PublicEventsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account" element={<PublicAccountPage />} />
            <Route path="/account/auth" element={<PublicAccountAuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/resend-confirmation" element={<ResendConfirmation />} />
            <Route path="/login" element={<Navigate to="/account/auth" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Toaster />
    </div>
  )
}
