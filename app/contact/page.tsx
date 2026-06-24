import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Mail, Phone } from "lucide-react"

import { SiteFooter } from "@/components/layout/site-footer"
import { socialLinks } from "@/components/layout/site-footer"
import Navbar from "@/components/shadcn-space/blocks/navbar-01/navbar"

const contactEmail = "chiunye16@gmail.com"
const contactPhone = "+263785211893"

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") || "")
    const email = String(formData.get("email") || "")
    const message = String(formData.get("message") || "")
    const subject = encodeURIComponent(`GuestPass enquiry from ${name || "website visitor"}`)
    const body = encodeURIComponent([`Name: ${name}`, `Email: ${email}`, "", message].join("\n"))

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-transparent text-black">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <motion.section
          className="grid gap-5 rounded-[2rem] border border-zinc-200 bg-white/84 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:grid-cols-[0.85fr_1fr] lg:p-5"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-[1.5rem] bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Contact Us</p>
            <h1 className="mt-4 text-balance text-4xl font-black tracking-[-0.045em] sm:text-6xl">
              Let’s talk about your next event.
            </h1>
            <p className="mt-5 text-sm leading-7 text-zinc-300">
              Reach out if you are planning an event, want GuestPass for your venue, or need help
              bringing guest access, payment tracking, and check-in operations into one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`tel:${contactPhone}`}
                aria-label="Call GuestPass"
                className="group inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-black transition-colors hover:bg-zinc-100"
              >
                <Phone className="h-4 w-4" />
                Call us
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href={`mailto:${contactEmail}`}
                aria-label="Email GuestPass"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                <Mail className="h-4 w-4" />
                Email us
              </a>
            </div>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-300 transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-black">
                Name
                <input
                  name="name"
                  required
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                  placeholder="Your name"
                />
              </label>
              <label className="text-sm font-bold text-black">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm font-bold text-black">
              Message
              <textarea
                name="message"
                required
                rows={6}
                className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium leading-6 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                placeholder="Tell us about your event, guest list size, entrances, and what you need help with."
              />
            </label>
            <button
              type="submit"
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:w-auto"
            >
              Send Message
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            {sent ? (
              <p className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                Your email client should open with the message prepared. Send it from there to reach us.
              </p>
            ) : null}
          </form>
        </motion.section>
      </main>
      <SiteFooter />
    </div>
  )
}
