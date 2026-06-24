import { Link, Navigate, useNavigate } from "react-router-dom"
import { CalendarDays, Heart, QrCode, ShoppingBag, Ticket, UserRound } from "lucide-react"

import { SiteFooter } from "@/components/layout/site-footer"
import Navbar from "@/components/shadcn-space/blocks/navbar-01/navbar"
import { signOutPublicAccount, usePublicAccount } from "@/lib/public-account"

const demoTickets = [
  {
    id: "GP-FG-STD-1001",
    event: "Founders Gala Demo Night",
    passType: "VIP",
    date: "2026-07-18 - 12:00",
    venue: "Art Farm, Harare",
  },
]

const demoOrders = [
  { id: "GP-DEMO-4821", event: "Founders Gala Demo Night", status: "Active", total: "$75.00" },
  { id: "GP-DEMO-2174", event: "Product Launch Preview", status: "Past", total: "$25.00" },
]

const wishlist = ["Investor Dinner", "Customer Conference", "Tech Summit Demo"]

export default function PublicAccountPage() {
  const account = usePublicAccount()
  const navigate = useNavigate()

  if (!account) {
    return <Navigate to="/account/auth" replace />
  }

  return (
    <div className="min-h-screen bg-transparent text-black">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section id="dashboard" className="rounded-[2rem] border border-zinc-200 bg-white/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-black text-xl font-black text-white">
                {account.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">User Dashboard</p>
                <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Welcome, {account.name}</h1>
                <p className="mt-2 text-sm text-zinc-600">{account.email}</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                  Manage your event passes, saved events, and checkout identity from one public-facing account.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                signOutPublicAccount()
                navigate("/")
              }}
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-black text-black transition hover:border-black hover:bg-zinc-50"
            >
              Sign out
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active tickets", value: "1", icon: Ticket },
            { label: "Active orders", value: "1", icon: ShoppingBag },
            { label: "Saved events", value: "3", icon: Heart },
            { label: "QR ready", value: "Yes", icon: QrCode },
          ].map((metric) => (
            <div key={metric.label} className="rounded-3xl border border-zinc-200 bg-white/85 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
              <metric.icon className="h-5 w-5 text-black" />
              <p className="mt-5 text-3xl font-black tracking-[-0.04em]">{metric.value}</p>
              <p className="mt-1 text-sm text-zinc-600">{metric.label}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div id="my-tickets" className="rounded-[2rem] border border-zinc-200 bg-white/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">My Tickets</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Ready for the gate</h2>
              </div>
              <QrCode className="h-6 w-6" />
            </div>
            <div className="mt-5 space-y-3">
              {demoTickets.map((ticket) => (
                <article key={ticket.id} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black">{ticket.event}</h3>
                      <p className="mt-1 text-sm text-zinc-600">{ticket.passType} pass for {account.name}</p>
                      <p className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-500">
                        <CalendarDays className="h-4 w-4" />
                        {ticket.date} - {ticket.venue}
                      </p>
                    </div>
                    <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-white font-mono text-xs font-black shadow-sm">
                      QR
                      <span className="block text-[9px] text-zinc-500">{ticket.id}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div id="orders" className="rounded-[2rem] border border-zinc-200 bg-white/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Orders</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Past and active</h2>
            <div className="mt-5 space-y-3">
              {demoOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black">{order.event}</p>
                      <p className="mt-1 text-xs text-zinc-500">{order.id}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${order.status === "Active" ? "bg-black text-white" : "bg-white text-zinc-600"}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-black">{order.total}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="wishlist" className="mt-8 rounded-[2rem] border border-zinc-200 bg-white/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Wishlist</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {wishlist.map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <Heart className="h-4 w-4" />
                <p className="mt-4 font-black">{item}</p>
                <Link to="/events" className="mt-3 inline-flex text-sm font-bold text-zinc-600 underline underline-offset-4 hover:text-black">
                  Find similar events
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-zinc-200 bg-black p-6 text-white shadow-[0_18px_60px_rgba(0,0,0,0.12)] sm:p-8">
          <UserRound className="h-6 w-6" />
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">Checkout details feed your QR pass.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
            During checkout, GuestPass collects the attendee name, email, and phone number. That attendee name becomes the identity attached to the QR code and ticket record.
          </p>
          <Link to="/events" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-black">
            Browse events
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
