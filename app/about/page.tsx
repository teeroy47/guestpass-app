import { motion } from "framer-motion"
import { Building2, ClipboardCheck, LockKeyhole } from "lucide-react"

import { SiteFooter } from "@/components/layout/site-footer"
import Navbar from "@/components/shadcn-space/blocks/navbar-01/navbar"

const values = [
  {
    title: "Built for event operators",
    copy: "GuestPass is designed for teams managing real entrances, real guests, real payments, and real pressure on event day.",
    icon: Building2,
  },
  {
    title: "Private by default",
    copy: "Public visitors can find events, while sensitive guest lists, scanner tools, and operations remain protected inside the console.",
    icon: LockKeyhole,
  },
  {
    title: "Operationally clear",
    copy: "Every workflow is shaped around confidence: know who was invited, who arrived, who scanned, and what needs follow-up.",
    icon: ClipboardCheck,
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-transparent text-black">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <motion.section
          className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white/82 shadow-[0_18px_55px_rgba(0,0,0,0.06)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid gap-0 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="border-b border-zinc-200 p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">About GuestPass</p>
              <h1 className="mt-4 text-balance text-4xl font-black tracking-[-0.045em] text-black sm:text-6xl">
                We turn event-day uncertainty into a controlled access operation.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-zinc-600">
                GuestPass exists for organizers who need more than a guest list. It brings invitations,
                guest intelligence, QR verification, scanner coordination, and attendance records into
                one calm operating layer.
              </p>
            </div>

            <div className="grid gap-3 p-4 sm:p-5">
              {values.map(({ title, copy, icon: Icon }) => (
                <motion.article
                  key={title}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 transition-colors hover:bg-white"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-black">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black tracking-[-0.025em] text-black">{title}</h2>
                      <p className="mt-2 text-sm leading-7 text-zinc-600">{copy}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>
      </main>
      <SiteFooter />
    </div>
  )
}
