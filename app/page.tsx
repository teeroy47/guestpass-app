import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Armchair,
  BarChart3,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  Flashlight,
  Lightbulb,
  LockKeyhole,
  Phone,
  Radio,
  ScanLine,
  Send,
  ShieldCheck,
  ArrowUpRight,
  UserRound,
  Users,
  Wifi,
  X,
} from "lucide-react"
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"

import Navbar from "@/components/shadcn-space/blocks/navbar-01/navbar"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type StorySection = {
  id: string
  eyebrow: string
  title: string
  body: string
  metric: string
  metricLabel: string
  focus: string
  icon: React.ComponentType<{ className?: string }>
  bullets: string[]
}

const heroHeadline = "Command-center infrastructure for modern event access."
const heroHeadlineWords = heroHeadline.split(" ")

const heroStats = [
  { label: "Guest lists catered for over 5 events", value: "3,000+", countTo: 3000, icon: Users },
  { label: "QR verification target", value: "<1s", icon: ScanLine },
  { label: "Scanner sync", value: "Realtime", icon: Radio },
  { label: "Role-based controls", value: "Multi-role", icon: ShieldCheck },
]

const consoleMetrics = [
  { label: "Invited Guests", value: "4,782", helper: "Founders Gala", icon: Users },
  { label: "Checked In", value: "2,391", helper: "50.0% of invited", icon: CheckCircle2 },
  { label: "Active Entrances", value: "6", helper: "All entrances online", icon: Wifi },
  { label: "Scanner Sessions", value: "18", helper: "Active now", icon: ScanLine },
]

const scanRows = [
  ["10:42:31", "Olivia Rhye", "Main Entrance", "Granted"],
  ["10:42:28", "Liam Johnson", "VIP Entrance", "Granted"],
  ["10:42:24", "Noah Williams", "Main Entrance", "Duplicate"],
  ["10:42:19", "Emma Brown", "Side Entrance A", "Granted"],
]

const entranceLoad = [
  ["Main", 78],
  ["VIP", 61],
  ["Side A", 33],
  ["Back", 48],
]

const storySections: StorySection[] = [
  {
    id: "mhinduro",
    eyebrow: "Invitation Layer",
    title: "Launch private events without exposing the operating console.",
    body: "Create the event, import guests, generate encrypted QR invitations, and keep sensitive workflows behind role-based access.",
    metric: "4,782",
    metricLabel: "Guests invited",
    focus: "Invitation delivery",
    icon: Send,
    bullets: ["Branded invitation delivery", "Unique QR code per guest", "Owner-safe public discovery"],
  },
  {
    id: "guest-intelligence",
    eyebrow: "Guest Intelligence",
    title: "Keep every guest record searchable, structured, and operationally useful.",
    body: "GuestPass stores seating, cuisine, notes, VIP flags, ticket type, company details, and custom fields so teams can act quickly at the door.",
    metric: "18",
    metricLabel: "Custom fields supported",
    focus: "Guest profile",
    icon: Users,
    bullets: ["Dietary and table metadata", "VIP and ticket segmentation", "Fast search-ready records"],
  },
  {
    id: "scan-operations",
    eyebrow: "Live Gate Operations",
    title: "Scanner teams stay synced while entrances get crowded.",
    body: "Every scan updates the operational dashboard in real time, with duplicate detection, access point tracking, and offline-safe sync queues.",
    metric: "<1s",
    metricLabel: "Verification target",
    focus: "Scanner sync",
    icon: ScanLine,
    bullets: ["Duplicate check-ins surfaced instantly", "Entrance-level load tracking", "Offline queue protection"],
  },
  {
    id: "usher-command",
    eyebrow: "Usher Command",
    title: "Coordinate distributed teams from one control layer.",
    body: "Monitor active scanner sessions, assign entrances, compare scan counts, and spot bottlenecks before they become guest-facing issues.",
    metric: "6",
    metricLabel: "Active entrances",
    focus: "Usher performance",
    icon: Radio,
    bullets: ["Active session monitoring", "Entrance assignment visibility", "Performance by access point"],
  },
  {
    id: "analytics",
    eyebrow: "Reconciliation",
    title: "Turn check-in activity into clean attendance intelligence.",
    body: "After the event, export attendance, review no-shows, reconcile scan history, and keep a durable audit trail for stakeholders.",
    metric: "99.6%",
    metricLabel: "Scan accuracy",
    focus: "Attendance analytics",
    icon: BarChart3,
    bullets: ["No-show and attendance reporting", "Exportable operational logs", "Event archive continuity"],
  },
]

const platformCards = [
  ["Unified QR Access", "Generate encrypted QR codes, scan at the gate, and keep every check-in auditable.", ScanLine],
  ["Guest Intelligence", "Track table, cuisine, notes, invitation delivery, VIP status, and custom fields.", Users],
  ["Live Usher Operations", "Monitor active scanners, entrance assignments, duplicates, and offline sync queues.", Radio],
  ["Attendance Analytics", "Understand guest flow, check-in rate, no-shows, entrances, and exportable reports.", BarChart3],
] as const

function AnimatedHeroHeadline() {
  return (
    <h1 className="text-balance text-5xl font-black tracking-[-0.045em] text-black sm:text-6xl lg:text-7xl">
      {heroHeadlineWords.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="hero-word-reveal inline-block"
          style={{ "--hero-word-delay": `${index * 72}ms` } as React.CSSProperties}
        >
          {word}
          {index < heroHeadlineWords.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
    </h1>
  )
}

function AnimatedHeroCopy() {
  return (
    <p className="hero-copy-reveal mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
      GuestPass unifies QR invitations, guest intelligence, live scanner operations,
      role-based access, and realtime attendance analytics into one secure operating
      layer for serious event teams.
    </p>
  )
}

function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [value, setValue] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) {
      setValue(to)
      return
    }

    let frame = 0
    let startTime: number | null = null
    const duration = 1300

    const tick = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp
      }

      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(to * eased))

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick)
      }
    }

    frame = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [reduceMotion, to])

  return (
    <>
      {new Intl.NumberFormat("en").format(value)}
      {suffix}
    </>
  )
}

function QrPreview() {
  const cells = [
    "1111111010101111111",
    "1000001011101000001",
    "1011101010001011101",
    "1011101011111011101",
    "1000001010101000001",
    "1111111010101111111",
    "0000000011100000000",
    "1010111110111010110",
    "0011100010101111001",
    "1110101111100010111",
    "1001110100011110010",
    "0010101110110011101",
    "1111111001101010100",
    "1000001010110011110",
    "1011101011101110001",
    "1011101000111010111",
    "1000001011010010100",
    "1111111010111110111",
  ]

  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black p-4 text-white shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-zinc-400">
        <span>QR Protocol</span>
        <span>Encrypted</span>
      </div>
      <div
        className="grid aspect-square w-full grid-cols-[repeat(19,minmax(0,1fr))] gap-0.5 rounded-xl bg-white p-3"
        aria-label="GuestPass encrypted QR preview"
      >
        {cells.join("").split("").map((cell, index) => (
          <span key={index} className={cn("rounded-[2px]", cell === "1" ? "bg-black" : "bg-white")} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-300">
        <LockKeyhole className="h-3.5 w-3.5" />
        Encryption active
      </div>
    </div>
  )
}

function ConsolePreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.12),transparent_48%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-8 -bottom-8 z-0 h-24 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.18),rgba(0,0,0,0.06)_42%,transparent_72%)] blur-2xl" />
      <div className="relative z-10 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
        <div className={cn("grid lg:grid-cols-[188px_1fr]", compact ? "min-h-[440px]" : "min-h-[560px]")}>
          <aside className="hidden border-r border-zinc-200 bg-zinc-50/80 p-5 lg:block">
            <div className="mb-8 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                <img src="/guestpass-logo.png" alt="" className="h-6 w-6 object-contain" />
              </span>
              <span className="text-sm font-black tracking-tight">GuestPass</span>
            </div>
            <div className="space-y-1 text-xs font-medium text-zinc-500">
              {["Overview", "Events", "Guests", "Invitations", "Scan Dashboard", "Analytics"].map((item) => (
                <div
                  key={item}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg px-3 transition-colors duration-200",
                    item === "Overview" ? "bg-black text-white" : "hover:bg-white",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <section className="bg-white p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-black">Founders Gala</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    Live Event
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  May 24, 2026 - 6:00 PM - 11:00 PM
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-10 rounded-xl">
                View Event Details
              </Button>
            </div>

            <div className="grid gap-3 xl:grid-cols-[190px_1fr_190px]">
              <QrPreview />

              <div className="grid grid-cols-2 gap-3">
                {consoleMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    className="rounded-2xl border border-zinc-200 bg-white p-4"
                    whileHover={{ y: -3, scale: 1.01 }}
                    transition={{ duration: 0.18 }}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.4 }}
                    style={{ transitionDelay: `${index * 40}ms` }}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-zinc-500">{metric.label}</p>
                      <metric.icon className="h-4 w-4 text-zinc-400" />
                    </div>
                    <p className="text-2xl font-black tracking-tight">{metric.value}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{metric.helper}</p>
                  </motion.div>
                ))}
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-bold">Gate Load</p>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-black" />
                    Realtime
                  </span>
                </div>
                <p className="text-4xl font-black tracking-tight">52%</p>
                <p className="mt-1 text-[11px] text-zinc-500">Average capacity</p>
                <div className="my-5 h-2 rounded-full bg-zinc-200">
                  <motion.div
                    className="h-full rounded-full bg-black"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 0.52 }}
                    viewport={{ once: false, amount: 0.5 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    style={{ originX: 0 }}
                  />
                </div>
                <div className="space-y-3">
                  {entranceLoad.map(([label, value]) => (
                    <div key={label as string} className="grid grid-cols-[48px_1fr_30px] items-center gap-2 text-[11px]">
                      <span className="font-medium text-zinc-600">{label}</span>
                      <span className="h-1.5 rounded-full bg-zinc-200">
                        <motion.span
                          className="block h-full rounded-full bg-black"
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: Number(value) / 100 }}
                          viewport={{ once: false, amount: 0.5 }}
                          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                          style={{ originX: 0 }}
                        />
                      </span>
                      <span className="text-right text-zinc-500">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <p className="text-sm font-bold">Live Scan Activity</p>
                <span className="text-[11px] font-semibold text-zinc-500">Synced 2s ago</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-zinc-50 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Time</th>
                      <th className="px-4 py-3 font-semibold">Guest</th>
                      <th className="px-4 py-3 font-semibold">Access Point</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {scanRows.map(([time, guest, access, status]) => (
                      <tr key={`${time}-${guest}`}>
                        <td className="px-4 py-3 font-mono text-zinc-500">{time}</td>
                        <td className="px-4 py-3 font-semibold text-black">{guest}</td>
                        <td className="px-4 py-3 text-zinc-500">{access}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold",
                              status === "Duplicate" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-black",
                            )}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 -bottom-1 z-20 h-28 rounded-b-[2rem] bg-gradient-to-b from-transparent via-white/65 to-[#f4f4f5]" />
    </div>
  )
}

function StoryText({
  section,
  index,
  total,
  progress,
}: {
  section: StorySection
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const reduceMotion = useReducedMotion()
  const start = index / total
  const center = (index + 0.5) / total
  const end = (index + 1) / total
  const y = useTransform(progress, [start, center, end], reduceMotion ? [0, 0, 0] : [10, 0, -10])
  const scale = useTransform(progress, [start, center, end], reduceMotion ? [1, 1, 1] : [0.995, 1, 0.995])
  const Icon = section.icon
  const isRoot = index === 0

  return (
    <motion.article
      id={section.id}
      className={cn(
        "relative scroll-mt-28 py-4 pl-10 sm:pl-14 lg:py-5",
        isRoot ? "pb-5 lg:pb-6" : "",
      )}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.28, margin: "-8% 0px -8% 0px" }}
      transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{ y, scale }}
    >
      <span className="absolute left-3 top-9 h-4 w-4 rounded-full border border-zinc-300 bg-white shadow-[0_0_0_6px_rgba(244,244,245,0.95)] sm:left-4" />
      <span className="absolute left-[19px] top-9 hidden h-px w-7 bg-zinc-200 sm:block" />
      <div
        className={cn(
          "relative w-full rounded-[1.75rem] border border-zinc-200 bg-white/92 shadow-[0_18px_55px_rgba(0,0,0,0.06)] backdrop-blur-xl",
          isRoot ? "p-6 sm:p-7" : "p-5 sm:p-6",
        )}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.78fr)_minmax(480px,1fr)] xl:items-stretch">
          <div className="flex min-w-0 flex-col justify-between">
            <div className="flex items-start gap-5">
              <span className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-black text-white", isRoot ? "h-12 w-12" : "h-11 w-11")}>
                <Icon className={cn(isRoot ? "h-5 w-5" : "h-4 w-4")} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">{section.eyebrow}</p>
                <h2 className={cn("mt-2 text-balance font-black tracking-[-0.035em] text-black", isRoot ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl")}>
                  {section.title}
                </h2>
                <p className={cn("mt-4 max-w-2xl text-zinc-600", isRoot ? "text-base leading-8" : "text-sm leading-7")}>{section.body}</p>
              </div>
            </div>
            <div className={cn("mt-5 grid gap-4", isRoot ? "sm:grid-cols-[150px_1fr]" : "sm:grid-cols-[130px_1fr]")}>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className={cn("font-black tracking-tight", isRoot ? "text-3xl" : "text-2xl")}>{section.metric}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{section.metricLabel}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-sm font-black">{section.focus}</p>
                <ul className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
                  {section.bullets.slice(0, isRoot ? 3 : 2).map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80">
            <StoryProductScreen section={section} />
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function StoryInvitationScreen() {
  return (
    <div className="grid min-h-[420px] content-center gap-5 p-6 sm:grid-cols-[220px_1fr]">
      <QrPreview />
      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Campaign</p>
              <h4 className="mt-1 text-xl font-black tracking-tight">Founders Gala Invites</h4>
            </div>
            <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">Sending</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
            {[
              ["Sent", "4,782"],
              ["Opened", "3,906"],
              ["Pending", "412"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-zinc-50 p-3">
                <p className="text-lg font-black">{value}</p>
                <p className="text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold text-zinc-500">Delivery channels</p>
          <div className="mt-3 space-y-2">
            {["Email invitation", "WhatsApp resend", "Owner review queue"].map((label, index) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs">
                <span className="font-semibold">{label}</span>
                <span className="text-zinc-500">{index === 0 ? "Live" : index === 1 ? "Ready" : "Protected"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StoryGuestScreen() {
  return (
    <div className="min-h-[420px] p-5">
      <div className="mx-auto grid max-w-3xl gap-4 lg:grid-cols-2">
        <CheckInResultMini
          variant="success"
          initials="T"
          name="Tapiwanashe Chiunye"
          checkedInBy="Tinotenda Mapara"
          time="less than a minute ago"
        />
        <CheckInResultMini
          variant="duplicate"
          initials="TM"
          name="Tinotenda Mapara"
          checkedInBy="Tapiwanashe Chiunye"
          time="5 minutes ago"
        />
      </div>
    </div>
  )
}

function CheckInResultCard({
  variant,
  initials,
  name,
  checkedInBy,
  time,
}: {
  variant: "success" | "duplicate"
  initials: string
  name: string
  checkedInBy: string
  time: string
}) {
  const isDuplicate = variant === "duplicate"
  const details: Array<[string, string, React.ComponentType<{ className?: string }>]> = isDuplicate
    ? [
        ["Seating", "Free Seating", Armchair],
        ["Cuisine", "Traditional", ClipboardCheck],
      ]
    : [
        ["Phone", "709411271", Phone],
        ["Seating", "VIPP", Armchair],
      ]

  return (
    <div
      className={cn(
        "flex min-h-[390px] flex-col rounded-[1.65rem] border bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)]",
        isDuplicate ? "border-orange-200" : "border-emerald-200",
      )}
    >
      {isDuplicate && (
        <div className="mb-4 flex items-center justify-between text-orange-600">
          <div className="flex items-center gap-2 text-sm font-black">
            <CheckCircle2 className="h-5 w-5" />
            Already Checked In
          </div>
          <X className="h-5 w-5 text-zinc-500" />
        </div>
      )}

      <div className="text-center">
        <div
          className={cn(
            "mx-auto flex h-24 w-24 items-center justify-center rounded-full text-3xl font-medium text-white ring-8",
            isDuplicate
              ? "bg-gradient-to-br from-orange-400 to-orange-600 ring-orange-100"
              : "bg-gradient-to-br from-emerald-300 to-emerald-600 ring-emerald-100",
          )}
        >
          {initials}
        </div>
        <h4 className="mt-5 text-2xl font-black tracking-[-0.035em] text-zinc-950">{name}</h4>
        <span
          className={cn(
            "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold",
            isDuplicate ? "bg-zinc-100 text-zinc-800" : "bg-emerald-100 text-emerald-700",
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          Checked In
        </span>
      </div>

      <div
        className={cn(
          "mt-6 flex-1 rounded-2xl border p-4",
          isDuplicate ? "border-zinc-100 bg-zinc-50" : "border-emerald-200 bg-emerald-50/30",
        )}
      >
        <div className="space-y-3">
          {details.map(([label, value, Icon]) => (
            <div key={label as string} className="flex items-center gap-3 text-sm">
              <Icon className={cn("h-5 w-5 shrink-0", isDuplicate ? "text-zinc-400" : "text-emerald-600")} />
              <p className="text-zinc-500">
                {label}: <span className="font-bold text-zinc-950">{value as string}</span>
              </p>
            </div>
          ))}
        </div>

        {!isDuplicate && (
          <div className="mt-4 space-y-3 border-y border-emerald-200 py-4">
            {[
              ["Parking", "Parking Inside"],
              ["Row Number", "3"],
              ["Reception Table Number", "2"],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[10px_1fr] gap-3 text-sm">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <p className="text-zinc-500">
                  {label}: <span className="block font-bold text-zinc-950">{value}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3 text-sm text-zinc-500">
          <div className="flex items-center gap-3">
            <UserRound className={cn("h-5 w-5", isDuplicate ? "text-zinc-400" : "text-emerald-600")} />
            <span>
              Checked in by <span className="font-semibold text-zinc-700">{checkedInBy}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Clock3 className={cn("h-5 w-5", isDuplicate ? "text-zinc-400" : "text-emerald-600")} />
            <span>{time}</span>
          </div>
        </div>
      </div>

      {isDuplicate ? (
        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-center text-sm font-bold text-orange-700">
          This guest has already been checked in. No action needed.
        </div>
      ) : (
        <button className="mt-5 h-11 rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-[0_12px_30px_rgba(5,150,105,0.22)]">
          Check In Another Guest
        </button>
      )}
    </div>
  )
}

function ScannerPhoneFrame({
  title,
  accent,
  className,
  children,
}: {
  title: string
  accent: "neutral" | "active"
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[245px]", className)}>
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{title}</p>
      <div
        className={cn(
          "overflow-hidden rounded-[2rem] border bg-black shadow-[0_22px_65px_rgba(0,0,0,0.16)]",
          accent === "active" ? "border-zinc-700" : "border-zinc-800",
        )}
      >
        {children}
      </div>
    </div>
  )
}

function ScannerTopBar({ checkedIn }: { checkedIn: string }) {
  return (
    <div className="border-b border-white/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-black tracking-[-0.03em]">Tech</p>
          <p className="mt-1 text-sm text-zinc-400">{checkedIn}</p>
          <span className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
            Online
          </span>
        </div>
        <X className="mt-2 h-5 w-5 text-zinc-300" />
      </div>
    </div>
  )
}

function ScannerTip() {
  return (
    <div className="border-t border-white/10 px-5 py-4 text-center">
      <p className="flex items-start justify-center gap-2 text-xs leading-5 text-zinc-400">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-yellow-200" />
        Ask guests to brighten their screen and hold the QR code steady
      </p>
      <div className="mx-auto mt-5 h-5 w-28 rounded-lg bg-white" />
    </div>
  )
}

function CheckInResultMini({
  variant,
  initials,
  name,
  checkedInBy,
  time,
}: {
  variant: "success" | "duplicate"
  initials: string
  name: string
  checkedInBy: string
  time: string
}) {
  const isDuplicate = variant === "duplicate"

  return (
    <div
      className={cn(
        "rounded-[1.65rem] border bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.06)]",
        isDuplicate ? "border-orange-200" : "border-emerald-200",
      )}
    >
      {isDuplicate && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-black text-orange-600">
          <CheckCircle2 className="h-4 w-4" />
          Already Checked In
        </div>
      )}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-medium text-white ring-4",
            isDuplicate
              ? "bg-gradient-to-br from-orange-400 to-orange-600 ring-orange-100"
              : "bg-gradient-to-br from-emerald-300 to-emerald-600 ring-emerald-100",
          )}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-black tracking-[-0.03em] text-zinc-950">{name}</p>
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
              isDuplicate ? "bg-zinc-100 text-zinc-700" : "bg-emerald-100 text-emerald-700",
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Checked In
          </span>
        </div>
      </div>
      <div className={cn("mt-4 rounded-2xl p-4", isDuplicate ? "bg-zinc-50" : "bg-emerald-50/50")}>
        <div className="space-y-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Armchair className={cn("h-4 w-4", isDuplicate ? "text-zinc-400" : "text-emerald-600")} />
            <span>
              Seating: <strong className="text-zinc-900">{isDuplicate ? "Free Seating" : "VIPP"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserRound className={cn("h-4 w-4", isDuplicate ? "text-zinc-400" : "text-emerald-600")} />
            <span>
              Checked in by <strong className="text-zinc-700">{checkedInBy}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className={cn("h-4 w-4", isDuplicate ? "text-zinc-400" : "text-emerald-600")} />
            <span>{time}</span>
          </div>
        </div>
      </div>
      {isDuplicate && (
        <p className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-center text-xs font-bold text-orange-700">
          This guest has already been checked in. No action needed.
        </p>
      )}
    </div>
  )
}

function StoryScanScreen() {
  return (
    <div className="min-h-[420px] p-5">
      <div className="mx-auto grid max-w-xl gap-4 sm:grid-cols-2 sm:items-center">
        <ScannerPhoneFrame title="Ready scanner" accent="neutral">
          <div className="flex min-h-[470px] flex-col bg-black text-white">
            <ScannerTopBar checkedIn="0 / 0 checked in" />
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-zinc-700">
                <Camera className="h-9 w-9" />
              </span>
              <h4 className="mt-8 text-2xl font-black tracking-[-0.03em]">Ready to Scan</h4>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                Grant camera permissions and press start to begin scanning guest passes.
              </p>
              <button className="mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-white/10 px-5 text-sm font-bold text-white">
                <Camera className="h-4 w-4" />
                Start Scanning
              </button>
            </div>
            <ScannerTip />
          </div>
        </ScannerPhoneFrame>

        <ScannerPhoneFrame title="Active scanner" accent="active" className="lg:scale-[1.04]">
          <div className="flex min-h-[500px] flex-col bg-black text-white">
            <ScannerTopBar checkedIn="2,391 checked in" />
            <div className="flex flex-1 flex-col justify-center px-5">
              <div className="relative mx-auto aspect-square w-full max-w-[250px] rounded-[2rem] bg-gradient-to-br from-zinc-950 via-red-950 to-red-700 shadow-[0_0_65px_rgba(127,29,29,0.28)]">
                <span className="absolute -right-4 -top-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-black shadow-[0_14px_35px_rgba(0,0,0,0.28)]">
                  <Flashlight className="h-5 w-5" />
                </span>
                <div className="absolute inset-6 rounded-[1.45rem] border border-white/12" />
                <div className="absolute inset-x-6 bottom-5 rounded-full border border-white/15 bg-black/70 px-4 py-3 text-center text-sm font-bold backdrop-blur-xl">
                  Position QR code within frame
                </div>
              </div>
              <div className="mt-7 grid grid-cols-3 gap-2">
                {([
                  ["Glare", Flashlight],
                  ["A11y", UserRound],
                  ["Pause", Camera],
                ] as Array<[string, React.ComponentType<{ className?: string }>]>) .map(([label, Icon]) => (
                  <button key={label as string} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-white/15 text-xs font-bold text-white">
                    <Icon className="h-3.5 w-3.5" />
                    {label as string}
                  </button>
                ))}
              </div>
            </div>
            <ScannerTip />
          </div>
        </ScannerPhoneFrame>
      </div>
    </div>
  )
}

function StoryUsherScreen() {
  return (
    <div className="min-h-[420px] content-center p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Active Ushers", "18"],
          ["Avg scans", "133"],
          ["Accuracy", "99.6%"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {["Jessica Taylor - Main Entrance - 312 scans", "Michael Brown - VIP Entrance - 278 scans", "Sarah Wilson - Side Entrance A - 198 scans"].map((row) => (
          <div key={row} className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 text-xs last:border-b-0">
            <span className="font-semibold">{row}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-1 font-bold">Online</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StoryAnalyticsScreen() {
  return (
    <div className="grid min-h-[420px] content-center gap-5 p-6 lg:grid-cols-[1fr_240px]">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-black">Check-in Over Time</p>
          <span className="text-xs text-zinc-500">May 24, 2026</span>
        </div>
        <div className="relative h-44 rounded-xl bg-zinc-50">
          <svg viewBox="0 0 360 160" className="h-full w-full overflow-visible p-4" aria-hidden="true">
            <path d="M20 130 C70 112 92 92 132 84 C180 74 205 50 242 42 C284 34 310 18 340 12" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" />
            {[20, 132, 242, 340].map((cx, index) => (
              <circle key={cx} cx={cx} cy={[130, 84, 42, 12][index]} r="5" fill="black" />
            ))}
          </svg>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-sm font-black">Entrance split</p>
        <div className="mx-auto mt-5 flex h-36 w-36 items-center justify-center rounded-full border-[18px] border-zinc-300 border-t-black border-r-zinc-500 bg-white">
          <div className="text-center">
            <p className="text-xl font-black">2,391</p>
            <p className="text-xs text-zinc-500">Total</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StoryProductScreen({ section }: { section: StorySection }) {
  if (section.id === "guest-intelligence") return <StoryGuestScreen />
  if (section.id === "scan-operations") return <StoryScanScreen />
  if (section.id === "usher-command") return <StoryUsherScreen />
  if (section.id === "analytics") return <StoryAnalyticsScreen />
  return <StoryInvitationScreen />
}

function StoryVisual({ activeSection, progress }: { activeSection: StorySection; progress: MotionValue<number> }) {
  const reduceMotion = useReducedMotion()
  const easedProgress = useSpring(progress, { stiffness: 90, damping: 26, mass: 0.4 })
  const y = useTransform(easedProgress, [0, 1], reduceMotion ? [0, 0] : [26, -26])
  const rotate = useTransform(easedProgress, [0, 1], reduceMotion ? [0, 0] : [-1.8, 1.8])
  const glow = useTransform(easedProgress, [0, 0.5, 1], ["0 24px 80px rgba(0,0,0,0.08)", "0 34px 110px rgba(0,0,0,0.14)", "0 24px 80px rgba(0,0,0,0.08)"])

  return (
    <motion.div
      className="relative mx-auto w-full max-w-3xl"
      style={{ y, rotate, boxShadow: glow }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_20%,rgba(0,0,0,0.14),transparent_58%)] blur-2xl" />
      <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white">
        <motion.div
          key={activeSection.id}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <StoryProductScreen section={activeSection} />
        </motion.div>

      </div>
    </motion.div>
  )
}

export function ScrollStory() {
  const containerRef = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.45 })

  if (reduceMotion) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-5xl space-y-3 before:absolute before:left-[19px] before:top-9 before:h-[calc(100%-4.5rem)] before:w-px before:bg-zinc-200 sm:before:left-6">
          {storySections.map((section) => (
            <StoryText key={section.id} section={section} index={0} total={1} progress={smoothProgress} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section ref={containerRef} className="relative mx-auto w-full max-w-[92rem] px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mx-auto w-full space-y-5 before:absolute before:left-[19px] before:top-9 before:h-[calc(100%-4.5rem)] before:w-px before:bg-zinc-200 sm:before:left-6">
        {storySections.map((section, index) => (
          <StoryText
            key={section.id}
            section={section}
            index={index}
            total={storySections.length}
            progress={smoothProgress}
          />
        ))}
      </div>
    </section>
  )
}

export function PlatformCards() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <motion.div
        className="grid gap-4 rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.25 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {platformCards.map(([title, copy, Icon]) => (
          <motion.article
            key={title}
            className="group rounded-2xl border border-zinc-100 bg-zinc-50 p-5 transition-colors duration-200 hover:bg-white"
            variants={{
              hidden: { opacity: 0, y: 34, scale: 0.98 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, scale: 1.015 }}
          >
            <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white transition-transform duration-200 group-hover:-translate-y-0.5">
              <Icon className="h-5 w-5 text-black" />
            </span>
            <h2 className="text-base font-black tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{copy}</p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  )
}

export function SolutionScaleSection() {
  return (
    <section id="tizivei" className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <motion.div
        className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-black p-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.12)] sm:p-10"
        initial={{ opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.35 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Built to scale</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              A serious access layer for serious event teams.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-300">
              GuestPass keeps public discovery, event owner workflows, admin operations,
              scanner tooling, and attendance analytics connected without exposing the
              internal console to regular visitors.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Secure QR protocol", ShieldCheck],
              ["Realtime scan sync", Wifi],
              ["Role-aware operations", LockKeyhole],
              ["Clean reconciliation", ClipboardCheck],
            ].map(([label, Icon]) => (
              <motion.div
                key={label as string}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
                whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.08)" }}
                transition={{ duration: 0.18 }}
              >
                <Icon className="h-5 w-5 text-white" />
                <p className="mt-4 text-sm font-bold">{label as string}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default function HomePage() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-transparent text-black">
      <Navbar />
      <main id="paden" className="overflow-hidden">
        <section className="mx-auto flex min-h-[calc(100dvh-88px)] w-full max-w-7xl flex-col items-center px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pt-10">
          <div className="mx-auto max-w-4xl text-center">
            <AnimatedHeroHeadline />
            <AnimatedHeroCopy />
            <motion.div
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.72, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to="/contact"
                className="group relative inline-flex h-10 w-fit items-center overflow-hidden rounded-full bg-black py-1 pe-12 ps-4 text-sm font-semibold text-white transition-all duration-500 hover:bg-zinc-800 hover:pe-4 hover:ps-12 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <span className="relative z-10">Get Started</span>
                <span className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
                  <ArrowUpRight size={16} />
                </span>
              </Link>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-zinc-200 bg-white px-6">
                <Link to="/events">Find Events</Link>
              </Button>
            </motion.div>
          </div>

          <motion.div
            className="mt-8 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.85 } } }}
          >
            {heroStats.map((stat) => (
              <motion.div
                key={stat.label}
                className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl"
                variants={{
                  hidden: { opacity: 0, y: 24, scale: 0.97 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <stat.icon className="mb-3 h-5 w-5 text-black" />
                <p className="text-xl font-black tracking-tight">
                  {"countTo" in stat ? <AnimatedCounter to={stat.countTo} suffix="+" /> : stat.value}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-8 w-full"
            initial={{ opacity: 0, y: 34, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.98, ease: [0.22, 1, 0.36, 1] }}
          >
            <ConsolePreview />
          </motion.div>

          <motion.div
            className="mt-10 flex w-full justify-center pb-2"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
              transition={reduceMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Link
                to="/our-solution"
                className="group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-black py-1 pe-13 ps-6 text-sm font-bold text-white shadow-[0_12px_34px_rgba(0,0,0,0.14)] transition-all duration-500 hover:bg-zinc-900 hover:pe-5 hover:ps-13 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <span className="relative z-10">View our solution</span>
                <span className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-all duration-500 group-hover:right-[calc(100%-42px)] group-hover:rotate-45">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
