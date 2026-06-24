import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarDays, CheckCircle2, Loader2, MapPin, Search, ShoppingCart } from "lucide-react"
import Navbar from "@/components/shadcn-space/blocks/navbar-01/navbar"
import { SiteFooter } from "@/components/layout/site-footer"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { addCartItem } from "@/lib/cart"
import { usePublicAccount } from "@/lib/public-account"

type PublicEvent = {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  venue: string | null
  status: string
  isDemo?: boolean
  price?: number
  priceLabel?: string
  ticketClasses?: TicketClass[]
}

type TicketClass = {
  id: string
  name: string
  price: number
  description: string
  perks: string[]
}

const demoEvent: PublicEvent = {
  id: "demo-founders-gala-pass",
  title: "Founders Gala Demo Night",
  description: "A premium invitation-only demo event for trying GuestPass discovery, cart, and checkout without touching production event data.",
  starts_at: "2026-07-18T12:00:00+02:00",
  ends_at: "2026-07-18T23:00:00+02:00",
  venue: "Art Farm, Harare",
  status: "demo",
  isDemo: true,
  price: 25,
  priceLabel: "$25.00 - $150.00",
  ticketClasses: [
    {
      id: "standard",
      name: "Standard",
      price: 25,
      description: "General event access with secure QR verification.",
      perks: ["QR invitation", "General entry", "Event updates"],
    },
    {
      id: "vip",
      name: "VIP",
      price: 75,
      description: "Priority event access for guests who need a smoother arrival.",
      perks: ["Priority entrance", "Reserved seating zone", "VIP guest label"],
    },
    {
      id: "vvip",
      name: "VVIP",
      price: 150,
      description: "Premium access with the highest visibility for event teams.",
      perks: ["VVIP access point", "Front-row seating", "Dedicated usher support"],
    },
  ],
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function normalizeSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function eventMatchesTerm(event: PublicEvent, rawTerm: string) {
  const term = normalizeSearchTerm(rawTerm).toLowerCase()
  if (!term) return true
  return [event.title, event.description, event.venue, event.status]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term))
}

function EventResultsSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6 text-left">
      {[0, 1, 2].map((item) => (
        <div key={item} className="overflow-hidden rounded-3xl border border-[#e3e8ee] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <Skeleton className="aspect-[4/5] w-full bg-zinc-200" />
          <div className="p-4">
            <Skeleton className="h-5 w-4/5 rounded-full bg-zinc-200" />
            <Skeleton className="mt-3 h-4 w-3/5 rounded-full bg-zinc-200" />
            <Skeleton className="mt-2 h-4 w-2/5 rounded-full bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

function formatEventCardDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(value))
    .replace(",", " -")
}

function getEventPriceLabel(event: PublicEvent) {
  if (event.priceLabel) return event.priceLabel
  if (event.price) return `$${event.price.toFixed(2)}`
  return "Free"
}

function EventPoster({ event }: { event: PublicEvent }) {
  const initials = event.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.2),transparent_30%),linear-gradient(145deg,#171717_0%,#262626_48%,#050505_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle,rgba(255,255,255,0.45) 1px,transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/80 backdrop-blur-xl">
        GuestPass
      </div>
      <div className="absolute right-4 top-4 rounded-xl bg-black px-3 py-2 text-sm font-black shadow-[0_14px_30px_rgba(0,0,0,0.32)]">
        {getEventPriceLabel(event)}
      </div>
      <div className="absolute inset-x-0 top-[27%] flex justify-center">
        <div className="grid h-24 w-24 place-items-center rounded-[1.75rem] bg-white/95 text-4xl font-black text-black shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:h-28 sm:w-28">
          {initials || "GP"}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/55 to-transparent" />
      <div className="absolute inset-x-4 bottom-4">
        <div className="rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Secure QR access</p>
          <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-none tracking-[-0.04em]">{event.title}</h3>
        </div>
      </div>
    </div>
  )
}

function getTicketClasses(event: PublicEvent): TicketClass[] {
  if (event.ticketClasses?.length) return event.ticketClasses
  return [
    {
      id: "standard",
      name: "Standard",
      price: event.price ?? 0,
      description: "Standard guest access for this event.",
      perks: ["QR invitation", "Event entry"],
    },
  ]
}

export function PublicEventsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const navigate = useNavigate()
  const publicAccount = usePublicAccount()
  const [query, setQuery] = useState("")
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [addedEventId, setAddedEventId] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasListedEvents, setHasListedEvents] = useState<boolean | null>(null)
  const activeRequestRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null

  const searchEvents = useCallback(
    async (rawTerm: string) => {
      const requestId = activeRequestRef.current + 1
      activeRequestRef.current = requestId
      const term = normalizeSearchTerm(rawTerm)

      setLoading(true)
      setError(null)

      try {
        let request = supabase
          .from("events")
          .select("id,title,description,starts_at,ends_at,venue,status")
          .is("deleted_at", null)
          .order("starts_at", { ascending: true })
          .limit(8)

        if (term) {
          request = request.ilike("title", `%${term}%`)
        }

        const { data, error: searchError } = await request

        if (requestId !== activeRequestRef.current) {
          return
        }

        if (searchError) {
          throw searchError
        }

        if (!term) {
          setHasListedEvents((data ?? []).length > 0)
        }

        const liveEvents = (data ?? []) as PublicEvent[]
        const demoEvents = eventMatchesTerm(demoEvent, term) ? [demoEvent] : []
        setEvents([...demoEvents, ...liveEvents])
      } catch (err) {
        if (requestId !== activeRequestRef.current) {
          return
        }

        console.error("Public event search failed", err)
        setEvents([])
        setError("Unable to search events right now. Please try again.")
      } finally {
        if (requestId === activeRequestRef.current) {
          setLoading(false)
        }
      }
    },
    [supabase],
  )

  const handleAddToCart = useCallback((event: PublicEvent, ticketClass: TicketClass) => {
    if (!publicAccount) {
      navigate("/account/auth?redirect=/events")
      return
    }

    addCartItem({
      id: `${event.id}:${ticketClass.id}`,
      title: event.title,
      passType: ticketClass.name,
      date: formatEventDate(event.starts_at),
      venue: event.venue ?? undefined,
      unitPrice: ticketClass.price,
      quantity: 1,
    })
    setAddedEventId(`${event.id}:${ticketClass.id}`)
    window.setTimeout(() => setAddedEventId(null), 1600)
  }, [navigate, publicAccount])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (hasListedEvents === false && normalizeSearchTerm(query)) {
      setEvents(eventMatchesTerm(demoEvent, query) ? [demoEvent] : [])
      setError(null)
      setLoading(false)
      return
    }

    debounceRef.current = window.setTimeout(() => {
      searchEvents(query)
    }, 220)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [hasListedEvents, query, searchEvents])

  useEffect(() => {
    const channel = supabase
      .channel("public-events-search")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        () => {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current)
          }

          debounceRef.current = window.setTimeout(() => {
            searchEvents(hasListedEvents === false ? "" : query)
          }, 180)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [hasListedEvents, query, searchEvents, supabase])

  return (
    <div className="min-h-screen bg-transparent text-[#0e1116]">
      <Navbar />
      <section className="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Find the right event you want to attend!
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#5b6472]">
          Can't find the event you are looking for?{" "}
          <a href="/contact" className="font-medium text-[#0e1116] underline underline-offset-4 hover:text-[#5b6472]">
            Let us know.
          </a>
        </p>
        <div className="mt-5 inline-flex max-w-xl items-center gap-2 rounded-full border border-[#e3e8ee] bg-white/80 px-4 py-2 text-left text-xs font-medium leading-5 text-[#5b6472] shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <span className="shrink-0 rounded-full bg-black px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-white">
            Beta
          </span>
          Public event discovery is rolling out. More listed events, pass selection, and checkout options are coming soon.
        </div>

        <label
          htmlFor="event-search"
          className="mt-10 inline-flex h-12 w-full max-w-[360px] items-center gap-2.5 rounded-full border border-[#e3e8ee] bg-white py-0 pl-[18px] pr-4 font-sans shadow-[0_1px_1px_rgba(14,17,22,0.03),0_18px_36px_-22px_rgba(14,17,22,0.18)] transition-[border-color,box-shadow] duration-200 ease-out focus-within:border-black focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.16),0_18px_36px_-22px_rgba(14,17,22,0.2)]"
        >
          <Search className="h-4 w-4 shrink-0 text-[#5b6472]" aria-hidden="true" />
          <input
            id="event-search"
            type="search"
            placeholder="Search events..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0e1116] outline-none placeholder:text-[#8a93a3]"
            autoComplete="off"
          />
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#5b6472]" aria-hidden="true" /> : null}
        </label>

        <div className="mt-10 w-full" aria-live="polite">
          {loading ? <EventResultsSkeleton /> : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm text-red-700 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              {error}
            </div>
          ) : null}

          {!error && !loading && events.length === 0 ? (
            <div className="rounded-2xl border border-[#e3e8ee] bg-white px-5 py-6 text-sm text-[#5b6472] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              {normalizeSearchTerm(query) ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <span>No events found for "{normalizeSearchTerm(query)}".</span>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-black text-black transition hover:border-black hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <>
                  There are no events at the moment, come back later when an event has been listed. If you're an event owner and you can't find your event,{" "}
                  <a href="/contact" className="font-medium text-[#0e1116] underline underline-offset-4 hover:text-[#5b6472]">
                    let us know
                  </a>
                  .
                </>
              )}
            </div>
          ) : null}

          {!error && !loading && events.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6 text-left xl:grid-cols-4">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="group mx-auto flex w-full max-w-[340px] flex-col overflow-hidden rounded-3xl bg-transparent transition duration-300 hover:-translate-y-1"
                >
                  <div className="rounded-[26px] border border-zinc-200 bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition duration-300 group-hover:shadow-[0_24px_55px_rgba(0,0,0,0.12)]">
                    <EventPoster event={event} />
                  </div>
                  <div className="px-3 pb-2 pt-4">
                    <h2 className="mt-3 line-clamp-2 text-xl font-black leading-tight tracking-[-0.03em] text-[#0e1116]">
                      {event.title}
                    </h2>
                    <div className="mt-2 space-y-1 text-base leading-6 text-[#5b6472]">
                      <p className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        {formatEventCardDate(event.starts_at)}
                      </p>
                      {event.venue ? (
                        <p className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          {event.venue}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEventId(event.id)}
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 text-sm font-bold text-black transition hover:border-black hover:bg-zinc-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      View pass options
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEventId(null)}>
        <DialogContent className="max-h-[88vh] overflow-hidden rounded-3xl border-zinc-200 bg-white p-0 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:max-w-2xl">
          {selectedEvent ? (
            <div className="flex max-h-[88vh] flex-col">
              <DialogHeader className="border-b border-zinc-200 px-5 pb-4 pt-6 text-left sm:px-6">
                <DialogTitle className="pr-10 text-2xl font-black tracking-[-0.04em] text-black">
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-6 text-zinc-600">
                  Choose the access class that fits your event experience. Sign in or create an account before adding a pass to your cart.
                </DialogDescription>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-600">
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {formatEventCardDate(selectedEvent.starts_at)}
                  </span>
                  {selectedEvent.venue ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {selectedEvent.venue}
                    </span>
                  ) : null}
                </div>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="grid gap-3">
                  {getTicketClasses(selectedEvent).map((ticketClass) => {
                    const itemId = `${selectedEvent.id}:${ticketClass.id}`

                    return (
                      <article
                        key={ticketClass.id}
                        className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Pass class</p>
                            <h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">{ticketClass.name}</h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-600">{ticketClass.description}</p>
                          </div>
                          <div className="shrink-0 rounded-2xl bg-black px-4 py-3 text-center text-white">
                            <span className="block text-xs font-bold uppercase tracking-[0.12em] text-white/60">Price</span>
                            <span className="mt-1 block text-xl font-black">${ticketClass.price.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          {ticketClass.perks.map((perk) => (
                            <span
                              key={perk}
                              className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold leading-5 text-zinc-700"
                            >
                              {perk}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(selectedEvent, ticketClass)}
                          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-black text-white transition hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          {addedEventId === itemId ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Added to cart
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4" />
                              {publicAccount ? `Add ${ticketClass.name} pass` : "Sign in to add pass"}
                            </>
                          )}
                        </button>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <SiteFooter />
    </div>
  )
}
