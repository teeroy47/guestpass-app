import { useEffect, useState } from "react"

export type CartItem = {
  id: string
  title: string
  passType?: string
  date?: string
  venue?: string
  unitPrice?: number
  quantity: number
}

const CART_STORAGE_KEY = "guestpass.cart.v1"
const CART_UPDATED_EVENT = "guestpass:cart-updated"

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<CartItem>
  return Boolean(item.id && item.title && Number(item.quantity) > 0)
}

export function readCartItems(): CartItem[] {
  if (typeof window === "undefined") return []

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!storedCart) return []
    const parsed = JSON.parse(storedCart)
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : []
  } catch {
    return []
  }
}

export function writeCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.filter(isCartItem)))
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}

export function addCartItem(item: CartItem) {
  const existingItems = readCartItems()
  const existingItem = existingItems.find((cartItem) => cartItem.id === item.id)

  if (existingItem) {
    writeCartItems(
      existingItems.map((cartItem) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
          : cartItem,
      ),
    )
    return
  }

  writeCartItems([...existingItems, item])
}

export function updateCartItemQuantity(id: string, quantity: number) {
  const safeQuantity = Math.max(0, Math.floor(quantity))
  const nextItems = readCartItems()
    .map((item) => (item.id === id ? { ...item, quantity: safeQuantity } : item))
    .filter((item) => item.quantity > 0)

  writeCartItems(nextItems)
}

export function removeCartItem(id: string) {
  writeCartItems(readCartItems().filter((item) => item.id !== id))
}

export function clearCartItems() {
  writeCartItems([])
}

export function getCartCount() {
  return readCartItems().reduce((total, item) => total + item.quantity, 0)
}

export function getCartSubtotal() {
  return readCartItems().reduce((total, item) => total + (item.unitPrice ?? 0) * item.quantity, 0)
}

export function useCartItems() {
  const [items, setItems] = useState<CartItem[]>(() => readCartItems())

  useEffect(() => {
    const updateItems = () => setItems(readCartItems())

    updateItems()
    window.addEventListener(CART_UPDATED_EVENT, updateItems)
    window.addEventListener("storage", updateItems)

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, updateItems)
      window.removeEventListener("storage", updateItems)
    }
  }, [])

  return items
}

export function useCartCount() {
  const [count, setCount] = useState(() => getCartCount())

  useEffect(() => {
    const updateCount = () => setCount(getCartCount())

    updateCount()
    window.addEventListener(CART_UPDATED_EVENT, updateCount)
    window.addEventListener("storage", updateCount)

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, updateCount)
      window.removeEventListener("storage", updateCount)
    }
  }, [])

  return count
}
