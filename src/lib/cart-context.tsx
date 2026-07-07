"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react"

export interface CartItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  chosen_brand_id?: string
  brand_name?: string
  unit_price: number
  total_price: number
  basket_id?: string
  basket_name?: string
  image_url?: string
  specs?: string
  notes?: string
  is_basket_item?: boolean
  items?: Array<{
    product_id: string
    quantity: number
    chosen_brand_id?: string
    brand_name?: string
    specs?: string
  }>
}

interface CartState {
  items: CartItem[]
  clientName: string
  clientPhone: string
  totalItems: number
  totalValue: number
}

interface CartContextType extends CartState {
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, delta: number) => void
  setClientName: (name: string) => void
  setClientPhone: (phone: string) => void
  clearCart: () => void
  hydrated: boolean
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY_ITEMS = "cesta_cart_items"
const STORAGE_KEY_NAME = "cesta_cart_name"
const STORAGE_KEY_PHONE = "cesta_cart_phone"

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [clientName, setClientNameState] = useState("")
  const [clientPhone, setClientPhoneState] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(loadStorage<CartItem[]>(STORAGE_KEY_ITEMS, []))
    setClientNameState(loadStorage<string>(STORAGE_KEY_NAME, ""))
    setClientPhoneState(loadStorage<string>(STORAGE_KEY_PHONE, ""))
    setHydrated(true)
  }, [])

  useEffect(() => { localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_NAME, clientName) }, [clientName])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PHONE, clientPhone) }, [clientPhone])

  const setClientName = useCallback((name: string) => { setClientNameState(name) }, [])
  const setClientPhone = useCallback((phone: string) => { setClientPhoneState(phone) }, [])

  const addItem = useCallback((newItem: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === newItem.id)
      if (existing) {
        return prev.map(i => i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity, total_price: (i.quantity + newItem.quantity) * i.unit_price } : i)
      }
      return [...prev, newItem]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems(prev => {
      const result: CartItem[] = []
      for (const i of prev) {
        if (i.id !== id) { result.push(i); continue }
        const newQty = i.quantity + delta
        if (newQty <= 0) continue
        result.push({ ...i, quantity: newQty, total_price: newQty * i.unit_price })
      }
      return result
    })
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setClientNameState("")
    setClientPhoneState("")
  }, [])

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const totalValue = useMemo(() => items.reduce((s, i) => s + i.total_price, 0), [items])

  return (
    <CartContext.Provider value={{ items, clientName, clientPhone, totalItems, totalValue, addItem, removeItem, updateQuantity, setClientName, setClientPhone, clearCart, hydrated }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
