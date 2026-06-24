import { FormEvent, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle2, Loader2, Lock, Mail, Phone, User } from "lucide-react"

import { SiteFooter } from "@/components/layout/site-footer"
import Navbar from "@/components/shadcn-space/blocks/navbar-01/navbar"
import { useAuth } from "@/lib/auth-context"
import {
  demoPublicCredentials,
  signInPublicDemo,
  storePendingPublicAccount,
  usePublicAccount,
  writePublicAccount,
} from "@/lib/public-account"

export default function PublicAccountAuthPage() {
  const { refreshUser, signInWithPassword, signUpWithPassword } = useAuth()
  const publicAccount = usePublicAccount()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/account"
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin"
  const [mode, setMode] = useState<"signin" | "signup">(initialMode)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [confirmationEmail, setConfirmationEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = mode === "signin" ? "Sign in to your GuestPass account." : "Create your public GuestPass account."

  const demoHint = useMemo(
    () => `${demoPublicCredentials.email} / ${demoPublicCredentials.password}`,
    [],
  )

  if (publicAccount) {
    return <Navigate to={redirectTo === "/account/auth" ? "/account" : redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")

    try {
      if (mode === "signin") {
        const demoResult = signInPublicDemo(email, password)
        if (!demoResult.error && demoResult.account) {
          navigate(redirectTo, { replace: true })
          return
        }

        const result = await signInWithPassword(email, password)
        if (result.error) {
          setError(result.error)
          return
        }

        await refreshUser()
        writePublicAccount({
          id: `public-${email.toLowerCase()}`,
          name: email.split("@")[0] || "GuestPass User",
          email,
        })
        navigate(redirectTo, { replace: true })
        return
      }

      const name = String(formData.get("name") ?? "").trim()
      const phone = String(formData.get("phone") ?? "").trim()
      const confirmPassword = String(formData.get("confirmPassword") ?? "")

      if (!name || !email || !password) {
        setError("Please enter your name, email, and password.")
        return
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters.")
        return
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }

      const result = await signUpWithPassword(email, password, name)
      if (result.error) {
        setError(result.error)
        return
      }

      storePendingPublicAccount({ name, email, phone })
      setConfirmationEmail(email)
      setSuccessMessage("Account created! Please check your email to confirm your account. After confirmation, you'll be redirected to your public dashboard.")
    } catch (err) {
      console.error("Public account auth failed", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-black">
      <Navbar />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Public access</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-zinc-600">
            Your public account is where event attendees can manage tickets, active orders, past purchases, and saved events without entering the internal organizer console.
          </p>
          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white/85 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Demo credentials</p>
            <p className="mt-2 font-mono text-sm font-bold text-black">{demoHint}</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-200 bg-white/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="grid grid-cols-2 rounded-full border border-zinc-200 bg-zinc-50 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin")
                setError(null)
                setSuccessMessage(null)
              }}
              className={`h-11 rounded-full text-sm font-black transition ${mode === "signin" ? "bg-black text-white" : "text-zinc-600 hover:text-black"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup")
                setError(null)
                setSuccessMessage(null)
              }}
              className={`h-11 rounded-full text-sm font-black transition ${mode === "signup" ? "bg-black text-white" : "text-zinc-600 hover:text-black"}`}
            >
              Sign Up
            </button>
          </div>

          <form key={mode} onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <label className="grid gap-2 text-sm font-bold">
                Full name
                <span className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    name="name"
                    placeholder="Your name"
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
                  />
                </span>
              </label>
            ) : null}

            <label className="grid gap-2 text-sm font-bold">
              Email address
              <span className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  required
                  type="email"
                  name="email"
                  defaultValue={mode === "signin" ? demoPublicCredentials.email : ""}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
                />
              </span>
            </label>

            {mode === "signup" ? (
              <label className="grid gap-2 text-sm font-bold">
                Phone number
                <span className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    name="phone"
                    placeholder="+263 78 000 0000"
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
                  />
                </span>
              </label>
            ) : null}

            <label className="grid gap-2 text-sm font-bold">
              Password
              <span className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  required
                  type="password"
                  name="password"
                  defaultValue={mode === "signin" ? demoPublicCredentials.password : ""}
                  placeholder="Password"
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
                />
              </span>
            </label>

            {mode === "signup" ? (
              <label className="grid gap-2 text-sm font-bold">
                Confirm password
                <span className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    required
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
                  />
                </span>
              </label>
            ) : null}

            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">{successMessage}</p>
                    <Link
                      to={`/resend-confirmation?email=${encodeURIComponent(confirmationEmail)}`}
                      className="mt-3 inline-flex font-black text-black underline underline-offset-4"
                    >
                      Resend confirmation email
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-black px-6 text-sm font-black text-white transition hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "signin" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-zinc-500">
            Need event owner support?{" "}
            <Link to="/contact" className="font-bold text-black underline underline-offset-4">
              Contact us
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
