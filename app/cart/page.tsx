import { Link } from "react-router-dom"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

import { SiteFooter } from "@/components/layout/site-footer"
import Navbar from "@/components/shadcn-space/blocks/navbar-01/navbar"
import { getCartSubtotal, removeCartItem, updateCartItemQuantity, useCartItems } from "@/lib/cart"
import { usePublicAccount } from "@/lib/public-account"

function formatMoney(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CartPage() {
  const items = useCartItems()
  const publicAccount = usePublicAccount()
  const subtotal = getCartSubtotal()

  return (
    <div className="min-h-screen bg-transparent text-black">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-[0_18px_55px_rgba(0,0,0,0.12)]">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-balance text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Review your event passes.
          </h1>
          <p className="mt-4 text-base leading-8 text-zinc-600">
            This is the demo checkout flow for GuestPass public event discovery.
          </p>
        </div>

        {items.length === 0 ? (
          <section className="mx-auto mt-10 max-w-2xl rounded-3xl border border-zinc-200 bg-white/85 p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <h2 className="text-2xl font-black tracking-tight">Your cart is empty.</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Add the Founders Gala demo pass from Events to test the checkout journey.
            </p>
            <Link
              to="/events"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Browse Events
            </Link>
          </section>
        ) : (
          <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-zinc-200 bg-white/85 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Event pass</p>
                      <h2 className="mt-2 text-xl font-black tracking-tight">{item.title}</h2>
                      <div className="mt-2 space-y-1 text-sm text-zinc-600">
                        {item.passType ? (
                          <p className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] text-black">
                            {item.passType}
                          </p>
                        ) : null}
                        {item.date ? <p>{item.date}</p> : null}
                        {item.venue ? <p>{item.venue}</p> : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="inline-flex h-11 items-center rounded-full border border-zinc-200 bg-white">
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-50 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                          aria-label={`Decrease ${item.title} quantity`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-black">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-50 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                          aria-label={`Increase ${item.title} quantity`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="min-w-16 text-right text-lg font-black">
                        {formatMoney((item.unitPrice ?? 0) * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove ${item.title} from your cart?`)) {
                            removeCartItem(item.id)
                          }
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-black hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="h-fit rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Checkout summary</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-black">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Service fee</span>
                  <span className="font-bold text-black">{formatMoney(0)}</span>
                </div>
                <div className="border-t border-zinc-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black">Total</span>
                    <span className="text-2xl font-black">{formatMoney(subtotal)}</span>
                  </div>
                </div>
              </div>
              <Link
                to={publicAccount ? "/checkout" : "/account/auth?redirect=/checkout"}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                {publicAccount ? "Continue to Checkout" : "Sign in to Checkout"}
              </Link>
              <Link
                to="/events"
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-bold text-black transition hover:border-black hover:bg-zinc-50"
              >
                Add another pass
              </Link>
            </aside>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
