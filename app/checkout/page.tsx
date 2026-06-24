import { FormEvent, useMemo, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { CheckCircle2, CreditCard, Mail, Phone, ShoppingBag, User } from "lucide-react"

import { SiteFooter } from "@/components/layout/site-footer"
import Navbar from "@/components/shadcn-space/blocks/navbar-01/navbar"
import { clearCartItems, getCartSubtotal, useCartItems } from "@/lib/cart"
import { usePublicAccount } from "@/lib/public-account"

function formatMoney(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CheckoutPage() {
  const items = useCartItems()
  const account = usePublicAccount()
  const subtotal = getCartSubtotal()
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attendeeName, setAttendeeName] = useState("")
  const orderId = useMemo(() => `GP-DEMO-${Math.floor(1000 + Math.random() * 9000)}`, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    setAttendeeName(String(formData.get("name") ?? account?.name ?? "Guest"))
    setSubmitted(true)
    clearCartItems()
  }

  if (!submitted && items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  if (!submitted && !account) {
    return <Navigate to="/account/auth?redirect=/checkout" replace />
  }

  return (
    <div className="min-h-screen bg-transparent text-black">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {submitted ? (
          <section className="mx-auto max-w-2xl rounded-3xl border border-zinc-200 bg-white/90 p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_18px_55px_rgba(16,185,129,0.18)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Demo checkout complete</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">Your pass order is confirmed.</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              This test order has been recorded locally for the demo flow. The QR pass identity will display as {attendeeName || account?.name || "Guest"}.
            </p>
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <span className="text-zinc-500">Order reference</span>
              <p className="mt-1 font-mono text-lg font-black">{orderId}</p>
            </div>
            <Link
              to="/account"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              View account dashboard
            </Link>
          </section>
        ) : (
          <>
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Secure demo checkout</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Confirm your pass details.
              </h1>
              <p className="mt-4 text-base leading-8 text-zinc-600">
                The attendee name, email, and phone number collected here become the identity attached to the QR pass.
              </p>
            </div>

            <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold">
                    Full name
                    <span className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        required
                        name="name"
                        defaultValue={account?.name ?? ""}
                        placeholder="Tapiwanashe Chiunye"
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
                      />
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Email address
                    <span className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        required
                        type="email"
                        name="email"
                        defaultValue={account?.email ?? ""}
                        placeholder="guest@example.com"
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
                      />
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Phone number
                    <span className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        required
                        name="phone"
                        defaultValue={account?.phone ?? ""}
                        placeholder="+263 78 000 0000"
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
                      />
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Payment method
                    <span className="relative">
                      <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <select
                        name="payment"
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
                      >
                        <option>Demo payment</option>
                        <option>EcoCash</option>
                        <option>Bank transfer</option>
                        <option>Cash on arrival</option>
                      </select>
                    </span>
                  </label>
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Delivery</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    After checkout, GuestPass will generate a QR invitation using the attendee name above and deliver it to the saved contact record.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {isSubmitting ? "Placing order..." : "Place demo order"}
                </button>
              </form>

              <aside className="h-fit rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Order summary</p>
                <div className="mt-5 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 border-b border-zinc-100 pb-4 last:border-b-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {item.passType ? `${item.passType} pass - ` : ""}Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-black">{formatMoney((item.unitPrice ?? 0) * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-5">
                  <span className="font-black">Total</span>
                  <span className="text-2xl font-black">{formatMoney(subtotal)}</span>
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
