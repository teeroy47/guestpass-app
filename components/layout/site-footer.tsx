import { Link } from "react-router-dom"
import type { SVGProps } from "react"

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15.6 3c.38 2.62 1.84 4.18 4.4 4.35v3.08a7.7 7.7 0 0 1-4.28-1.35v6.15c0 3.08-2.02 5.77-5.72 5.77-3.18 0-5.5-2.08-5.5-5.08 0-3.35 2.78-5.37 6.12-5.08v3.2c-1.52-.24-2.92.45-2.92 1.8 0 1.18.95 1.88 2.12 1.88 1.48 0 2.32-.82 2.32-2.65V3h3.46Z"
        fill="currentColor"
      />
    </svg>
  )
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="7" r="1.1" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14.15 8.34V6.9c0-.7.46-.86.78-.86h1.98V3.1L14.18 3c-3.03 0-3.72 2.28-3.72 3.73v1.61H8v3.3h2.46V21h3.69v-9.36h2.5l.33-3.3h-2.83Z"
        fill="currentColor"
      />
    </svg>
  )
}

export const socialLinks = [
  { label: "TikTok", href: "https://www.tiktok.com/@guestpasszw?_r=1&_t=ZS-97S4yHIeYa8", icon: TikTokIcon },
  { label: "Instagram", href: "https://www.instagram.com/guestpasszw?igsh=bTN0b3NjeTFhODQz&utm_source=qr", icon: InstagramIcon },
  { label: "Facebook", href: "https://www.facebook.com/share/15t4WU5cstN/?mibextid=wwXIfr", icon: FacebookIcon },
]

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white">
              <img src="/guestpass-logo.png" alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className="text-lg font-black tracking-tight text-black">GuestPass</span>
          </Link>
          <div className="flex items-center gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:border-black hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 border-t border-zinc-100 pt-6 text-sm text-zinc-500 md:flex-row">
          <p>© {currentYear} GuestPass. Event access, guest intelligence, and live check-in operations.</p>
          <div className="flex gap-5">
            <Link to="/our-solution" className="hover:text-black">Our Solution</Link>
            <Link to="/events" className="hover:text-black">Events</Link>
            <Link to="/about" className="hover:text-black">About Us</Link>
            <Link to="/contact" className="hover:text-black">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
