import { useEffect, useState } from "react"

export type PublicAccount = {
  id: string
  name: string
  email: string
  phone?: string
}

const PUBLIC_ACCOUNT_STORAGE_KEY = "guestpass.public-account.v1"
const PUBLIC_ACCOUNT_UPDATED_EVENT = "guestpass:public-account-updated"
const PENDING_PUBLIC_ACCOUNT_STORAGE_KEY = "guestpass.pending-public-account.v1"

export const demoPublicCredentials = {
  email: "attendee@guestpass.demo",
  password: "Guestpass123",
  name: "Tapiwanashe Chiunye",
  phone: "+263 78 521 1893",
}

function isPublicAccount(value: unknown): value is PublicAccount {
  if (!value || typeof value !== "object") return false
  const account = value as Partial<PublicAccount>
  return Boolean(account.id && account.name && account.email)
}

export function readPublicAccount(): PublicAccount | null {
  if (typeof window === "undefined") return null

  try {
    const storedAccount = window.localStorage.getItem(PUBLIC_ACCOUNT_STORAGE_KEY)
    if (!storedAccount) return null
    const parsed = JSON.parse(storedAccount)
    return isPublicAccount(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writePublicAccount(account: PublicAccount | null) {
  if (typeof window === "undefined") return

  if (account) {
    window.localStorage.setItem(PUBLIC_ACCOUNT_STORAGE_KEY, JSON.stringify(account))
  } else {
    window.localStorage.removeItem(PUBLIC_ACCOUNT_STORAGE_KEY)
  }

  window.dispatchEvent(new Event(PUBLIC_ACCOUNT_UPDATED_EVENT))
}

export function signInPublicDemo(email: string, password: string) {
  if (
    email.trim().toLowerCase() !== demoPublicCredentials.email ||
    password !== demoPublicCredentials.password
  ) {
    return {
      account: null,
      error: "Use the demo attendee credentials for now.",
    }
  }

  const account = {
    id: "demo-public-attendee",
    name: demoPublicCredentials.name,
    email: demoPublicCredentials.email,
    phone: demoPublicCredentials.phone,
  }

  writePublicAccount(account)
  return { account, error: null }
}

export function signUpPublicDemo(account: Omit<PublicAccount, "id">) {
  const publicAccount = {
    id: `public-${Date.now()}`,
    ...account,
  }

  writePublicAccount(publicAccount)
  return { account: publicAccount, error: null }
}

export function storePendingPublicAccount(account: Omit<PublicAccount, "id">) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PENDING_PUBLIC_ACCOUNT_STORAGE_KEY, JSON.stringify(account))
}

export function readPendingPublicAccount(): Omit<PublicAccount, "id"> | null {
  if (typeof window === "undefined") return null

  try {
    const storedAccount = window.localStorage.getItem(PENDING_PUBLIC_ACCOUNT_STORAGE_KEY)
    if (!storedAccount) return null
    const parsed = JSON.parse(storedAccount) as Partial<PublicAccount>
    if (!parsed.name || !parsed.email) return null
    return {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
    }
  } catch {
    return null
  }
}

export function clearPendingPublicAccount() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(PENDING_PUBLIC_ACCOUNT_STORAGE_KEY)
}

export function signOutPublicAccount() {
  writePublicAccount(null)
}

export function usePublicAccount() {
  const [account, setAccount] = useState<PublicAccount | null>(() => readPublicAccount())

  useEffect(() => {
    const updateAccount = () => setAccount(readPublicAccount())

    updateAccount()
    window.addEventListener(PUBLIC_ACCOUNT_UPDATED_EVENT, updateAccount)
    window.addEventListener("storage", updateAccount)

    return () => {
      window.removeEventListener(PUBLIC_ACCOUNT_UPDATED_EVENT, updateAccount)
      window.removeEventListener("storage", updateAccount)
    }
  }, [])

  return account
}
