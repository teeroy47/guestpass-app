import React from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  MessageCircle,
  QrCode,
  Users,
} from "lucide-react"

import Navbar from "@/components/shadcn-space/blocks/navbar-01/navbar"
import { SiteFooter } from "@/components/layout/site-footer"
import { ScrollStory } from "@/app/page"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

const emotionalOutcomes = ["Confidence", "Control", "Visibility", "A smoother event", "Less stress"]
const problemHeadline = "Event organizers should not need spreadsheets, chat threads, and guesswork to run the door."
const problemHeadlineWords = problemHeadline.split(" ")
const operationalPain = ["Long queues", "Duplicate entries", "Lost invitations", "Payment gaps", "No live visibility"]

function PrimarySolutionCta({ className }: { className?: string }) {
  return (
    <Link
      to="/contact"
      className={cn(
        "group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-black py-1 pe-13 ps-6 text-sm font-bold text-white shadow-[0_12px_34px_rgba(0,0,0,0.14)] transition-all duration-500 hover:bg-zinc-900 hover:pe-5 hover:ps-13 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        className,
      )}
    >
      <span className="relative z-10">Bring order to your event</span>
      <span className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full text-white transition-all duration-500 group-hover:right-[calc(100%-42px)] group-hover:rotate-45 group-hover:bg-white group-hover:text-black">
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}

const chaosScenes = [
  {
    title: "Manual guest lists",
    problem: "Organizers print lists or search through spreadsheets while guests wait in line.",
    result: "Slow check-ins, frustrated guests, and human error.",
    icon: FileSpreadsheet,
  },
  {
    title: "WhatsApp chaos",
    problem: "Invitations get buried in chats, guests forget details, and responses are hard to track.",
    result: "Endless follow-ups, missed guests, and poor communication.",
    icon: MessageCircle,
  },
  {
    title: "No attendance visibility",
    problem: "Teams cannot see who has arrived, who is still coming, or how many people attended.",
    result: "Poor planning and no real-time insight.",
    icon: Users,
  },
  {
    title: "Payment confusion",
    problem: "EcoCash, bank transfers, cash, and InnBucks are reconciled manually across separate records.",
    result: "Missed payments and incorrect guest records.",
    icon: CreditCard,
  },
  {
    title: "GuestPass dashboard",
    problem: "Invitations, payments, QR tickets, check-ins, and reports become one connected flow.",
    result: "Chaos becomes control.",
    icon: LayoutDashboard,
    isSolution: true,
  },
]

function ChaosControlSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.78fr_1fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Chaos to control</p>
          <h2 className="mt-4 text-balance text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Events should be memorable for your guests, not stressful for your team.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-zinc-600">
            From invitations and payments to QR check-ins and attendance tracking,
            GuestPass removes the manual work that slows events down.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {emotionalOutcomes.map((outcome) => (
              <div key={outcome} className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <CheckCircle2 className="h-4 w-4 text-black" />
                {outcome}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {chaosScenes.map((scene, index) => (
            <motion.article
              key={scene.title}
              className={[
                "overflow-hidden rounded-[1.75rem] border p-5 shadow-[0_18px_55px_rgba(0,0,0,0.05)]",
                scene.isSolution ? "border-black bg-black text-white" : "border-zinc-200 bg-white",
              ].join(" ")}
              initial={{ opacity: 0, y: 28, scale: 0.985 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.35 }}
              transition={{ duration: 0.42, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="grid gap-5 md:grid-cols-[64px_1fr]">
                <span
                  className={[
                    "flex h-14 w-14 items-center justify-center rounded-2xl",
                    scene.isSolution ? "bg-white text-black" : "bg-zinc-100 text-black",
                  ].join(" ")}
                >
                  <scene.icon className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className={scene.isSolution ? "text-xs font-bold uppercase tracking-[0.18em] text-zinc-300" : "text-xs font-bold uppercase tracking-[0.18em] text-zinc-500"}>
                      Scene {index + 1}
                    </p>
                    {scene.isSolution && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-black">
                        <QrCode className="h-3.5 w-3.5" />
                        Organized
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.03em]">{scene.title}</h3>
                  <p className={scene.isSolution ? "mt-3 text-sm leading-7 text-zinc-300" : "mt-3 text-sm leading-7 text-zinc-600"}>
                    {scene.problem}
                  </p>
                  <div className={scene.isSolution ? "mt-4 rounded-2xl border border-white/10 bg-white/5 p-4" : "mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"}>
                    <p className={scene.isSolution ? "text-sm font-bold text-white" : "text-sm font-bold text-black"}>
                      {scene.result}
                    </p>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function OurSolutionPage() {
  return (
    <div className="min-h-screen bg-transparent text-black">
      <Navbar />
      <main>
        <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pt-16">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white shadow-[0_18px_55px_rgba(0,0,0,0.12)]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                Problem Statement
              </p>
              <h1 className="text-balance text-5xl font-black tracking-[-0.045em] sm:text-6xl">
                {problemHeadlineWords.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    className="hero-word-reveal inline-block"
                    style={{ "--hero-word-delay": `${index * 42}ms` } as React.CSSProperties}
                  >
                    {word}
                    {index < problemHeadlineWords.length - 1 ? "\u00a0" : ""}
                  </span>
                ))}
              </h1>
              <p className="hero-copy-reveal mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
                GuestPass transforms event management from a manual, stressful process into a
                streamlined digital experience, from guest invitations and payments to QR ticketing,
                check-ins, and attendance reporting.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <PrimarySolutionCta />
                <Link
                  to="/events"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-bold text-black transition-colors hover:bg-zinc-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Find Events
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="mx-auto mt-10 max-w-5xl">
            <motion.div
              className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_55px_rgba(0,0,0,0.06)]"
              initial={{ opacity: 0, y: 22, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="p-6 sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                    What GuestPass solves
                  </p>
                  <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                    Event operations break when every critical detail lives in a different place.
                  </h2>
                  <p className="mt-5 text-base leading-8 text-zinc-600">
                    Organizers are forced to jump between spreadsheets, printed guest lists,
                    WhatsApp threads, payment screenshots, and manual door checks. Before the
                    event even starts, the team is already trying to answer too many questions at once:
                    who was invited, who paid, who received their pass, who arrived, and which entrance
                    is becoming a bottleneck.
                  </p>
                  <p className="mt-4 text-base leading-8 text-zinc-600">
                    The real cost is not the QR code. It is the loss of confidence when the team cannot
                    see the full picture. GuestPass brings invitations, payments, guest records, scanner
                    activity, and attendance reporting into one operating layer so event day becomes
                    controlled, visible, and calm.
                  </p>
                </div>

                <div className="border-t border-zinc-200 bg-zinc-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
                  <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Manual process creates
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {operationalPain.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 rounded-2xl bg-black p-5 text-white">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                        GuestPass turns that into
                      </p>
                      <p className="mt-3 text-2xl font-black tracking-[-0.03em]">
                        Confidence, control, visibility, and less stress.
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">
                        One place to invite guests, verify access, monitor entrances, reconcile payments,
                        and export attendance after the event.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <ChaosControlSection />
        <ScrollStory />
      </main>
      <SiteFooter />
    </div>
  )
}
