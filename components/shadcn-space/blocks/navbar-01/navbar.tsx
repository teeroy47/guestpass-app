"use client"

import { useCallback, useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowUpRight, LogOut, Menu, ShoppingCart, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { useCartCount } from "@/lib/cart"
import { signOutPublicAccount, usePublicAccount } from "@/lib/public-account"

export type NavigationSection = {
  title: string
  href: string
  beta?: string
}

const navigationData: NavigationSection[] = [
  { title: "Home", href: "/#paden" },
  { title: "Our Solution", href: "/our-solution" },
  { title: "Events", href: "/events", beta: "Beta: public event discovery is rolling out." },
  { title: "Contact Us", href: "/contact" },
  { title: "About Us", href: "/about" },
]

const accountNavigationData: NavigationSection[] = [
  { title: "Dashboard", href: "/account#dashboard" },
  { title: "My Tickets", href: "/account#my-tickets" },
  { title: "Orders", href: "/account#orders" },
  { title: "Wishlist", href: "/account#wishlist" },
  { title: "Events", href: "/events", beta: "Beta" },
]

function GuestPassLogo() {
  const logoSrc = `${import.meta.env.BASE_URL}guestpass-logo.png`

  return (
    <Link to="/" className="flex items-center gap-3" aria-label="GuestPass home">
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <img
          src={logoSrc}
          alt=""
          className="h-8 w-8 object-contain"
          loading="eager"
        />
      </span>
      <span className="text-lg font-black tracking-tight text-foreground">GuestPass</span>
    </Link>
  )
}

const ConsoleButton = ({ className }: { className?: string }) => (
  <Button
    asChild
    className={cn(
      "group relative h-10 w-fit overflow-hidden rounded-full bg-black py-1 pe-12 ps-4 text-sm font-semibold text-white transition-all duration-500 hover:bg-zinc-800 hover:pe-4 hover:ps-12",
      className,
    )}
  >
    <Link to="/account/auth?mode=signup">
      <span className="relative z-10">Get Started</span>
      <span className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
        <ArrowUpRight size={16} />
      </span>
    </Link>
  </Button>
)

const CartButton = ({ count }: { count: number }) => (
  <Link
    to="/cart"
    aria-label={count > 0 ? `Shopping cart with ${count} item${count === 1 ? "" : "s"}` : "Shopping cart"}
    className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-black transition-colors hover:border-black hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
  >
    <ShoppingCart className="h-4 w-4" />
    {count > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-black leading-none text-white">
        {count > 99 ? "99+" : count}
      </span>
    ) : null}
  </Link>
)

const ProfileButton = ({ signedIn }: { signedIn: boolean }) => (
  <Link
    to={signedIn ? "/account" : "/account/auth"}
    aria-label={signedIn ? "Open your profile dashboard" : "Sign in or create an account"}
    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-black transition-colors hover:border-black hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
  >
    <UserRound className="h-4 w-4" />
  </Link>
)

const Navbar = () => {
  const [sticky, setSticky] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const cartCount = useCartCount()
  const publicAccount = usePublicAccount()
  const activeNavigation = publicAccount ? accountNavigationData : navigationData
  const isActiveNavItem = useCallback(
    (href: string) => {
      const [pathname, hash] = href.split("#")
      if (pathname !== location.pathname) return false
      return hash ? location.hash === `#${hash}` : true
    },
    [location.hash, location.pathname],
  )

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50)
  }, [])

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 1024) setIsOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [handleScroll, handleResize])

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <nav
          className={cn(
            "flex w-full items-center justify-between gap-3.5 transition-all duration-500 lg:gap-6",
            sticky
              ? "rounded-full border border-border/60 bg-background/75 p-2.5 shadow-2xl shadow-black/5 backdrop-blur-xl"
              : "rounded-2xl border border-transparent bg-transparent p-0",
          )}
        >
          <GuestPassLogo />

          <NavigationMenu className="hidden rounded-full bg-muted p-0.5 lg:flex">
            <NavigationMenuList className="flex gap-0">
              {activeNavigation.map((navItem) => (
                <NavigationMenuItem key={navItem.title}>
                  <NavigationMenuLink asChild>
                    {navItem.href.startsWith("/") ? (
                      <Link
                        to={navItem.href}
                        className={cn(
                          "rounded-full px-4 py-2 text-sm font-medium tracking-normal outline outline-transparent transition hover:bg-background hover:text-foreground hover:outline-border hover:shadow-xs",
                          isActiveNavItem(navItem.href)
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground",
                        )}
                        title={navItem.beta}
                        aria-current={isActiveNavItem(navItem.href) ? "page" : undefined}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {navItem.title}
                          {navItem.beta ? (
                            <span className="rounded-full bg-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-white">
                              Beta
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    ) : (
                      <a
                        href={navItem.href}
                        className="rounded-full px-4 py-2 text-sm font-medium tracking-normal text-muted-foreground outline outline-transparent transition hover:bg-background hover:text-foreground hover:outline-border hover:shadow-xs"
                      >
                        {navItem.title}
                      </a>
                    )}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="hidden items-center gap-3 lg:flex">
            <ProfileButton signedIn={Boolean(publicAccount)} />
            <CartButton count={cartCount} />
            {publicAccount ? (
              <button
                type="button"
                onClick={signOutPublicAccount}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-black transition hover:border-black hover:bg-zinc-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <ConsoleButton />
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ProfileButton signedIn={Boolean(publicAccount)} />
            <CartButton count={cartCount} />
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
                <Menu size={20} />
                <span className="sr-only">Menu</span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="mt-2 w-60">
                {activeNavigation.map((item) => (
                  <DropdownMenuItem key={item.title}>
                    {item.href.startsWith("/") ? (
                      <Link to={item.href} className="w-full cursor-pointer text-sm font-medium">
                        <span className="flex items-center justify-between gap-3">
                          {item.title}
                          {item.beta ? <span className="text-[10px] font-black uppercase text-zinc-500">Beta</span> : null}
                        </span>
                        {item.beta ? <span className="mt-1 block text-xs leading-5 text-zinc-500">{item.beta}</span> : null}
                      </Link>
                    ) : (
                      <a href={item.href} className="w-full cursor-pointer text-sm font-medium">
                        {item.title}
                      </a>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem>
                  <Link to={publicAccount ? "/account" : "/account/auth"} className="flex w-full cursor-pointer items-center gap-2 text-sm font-medium">
                    <UserRound className="h-4 w-4" />
                    {publicAccount ? "Profile" : "Sign in / Sign up"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/cart" className="flex w-full cursor-pointer items-center justify-between text-sm font-medium">
                    <span className="inline-flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Cart
                    </span>
                    {cartCount > 0 ? (
                      <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-black text-white">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    ) : null}
                  </Link>
                </DropdownMenuItem>
                {publicAccount ? (
                  <DropdownMenuItem>
                    <button
                      type="button"
                      onClick={signOutPublicAccount}
                      className="flex w-full cursor-pointer items-center gap-2 text-sm font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </DropdownMenuItem>
                ) : null}
                {!publicAccount ? (
                  <DropdownMenuItem>
                    <Link to="/account/auth?mode=signup" className="w-full cursor-pointer text-sm font-medium">
                      Get Started
                    </Link>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
