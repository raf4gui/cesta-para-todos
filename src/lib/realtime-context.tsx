"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { getUnreadOrdersCount } from "@/app/admin/pedidos/actions"

export type TableName = "products" | "baskets" | "categories" | "brands" | "stock_movements" | "orders" | "financial_entries" | "nfe_emissions" | "contas_receber" | "recurring_expenses"

interface UnreadOrder {
  id: string
  protocol: string
  customer_name?: string
  total_value?: number
}

interface RealtimeContextType {
  getVersion(table: TableName): number
  subscribe(table: TableName, listener: () => void): () => void
  unreadCount: number
  unreadLoading: boolean
  latestNewOrder: UnreadOrder | null
  consumeNewOrder(): void
  refreshUnreadCount(): void
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

const SYNC_TABLES: TableName[] = ["products", "baskets", "categories", "brands", "stock_movements", "financial_entries", "nfe_emissions", "contas_receber", "recurring_expenses"]

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [versions, setVersions] = useState<Record<string, number>>({})
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadLoading, setUnreadLoading] = useState(true)
  const [latestNewOrder, setLatestNewOrder] = useState<UnreadOrder | null>(null)
  const notifiedIds = useRef<Set<string>>(new Set())
  const restored = useRef(false)
  const listenersRef = useRef<Map<string, Set<() => void>>>(new Map())

  const emitChange = useCallback((table: string) => {
    listenersRef.current.get(table)?.forEach((fn) => fn())
  }, [])

  const subscribe = useCallback((table: TableName, listener: () => void) => {
    if (!listenersRef.current.has(table)) {
      listenersRef.current.set(table, new Set())
    }
    listenersRef.current.get(table)!.add(listener)
    return () => { listenersRef.current.get(table)?.delete(listener) }
  }, [])

  const bumpVersion = useCallback((table: string) => {
    setVersions((prev) => ({ ...prev, [table]: (prev[table] || 0) + 1 }))
    emitChange(table)
  }, [emitChange])

  useEffect(() => {
    if (restored.current) return
    restored.current = true
    try {
      const stored = sessionStorage.getItem("opencode_notified_orders")
      if (stored) {
        const ids: string[] = JSON.parse(stored)
        ids.forEach((id) => notifiedIds.current.add(id))
      }
    } catch {}
  }, [])

  const saveNotifiedIds = useCallback(() => {
    try {
      sessionStorage.setItem("opencode_notified_orders", JSON.stringify([...notifiedIds.current]))
    } catch {}
  }, [])

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadOrdersCount()
      setUnreadCount(count)
    } catch {
    } finally {
      setUnreadLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUnreadCount()
  }, [refreshUnreadCount])

  // Subscribe to sync tables
  useEffect(() => {
    const channels = SYNC_TABLES.map((table) =>
      supabase
        .channel(`sync-${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => {
          bumpVersion(table)
        })
        .subscribe()
    )
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)) }
  }, [bumpVersion])

  // Subscribe to orders
  useEffect(() => {
    const channel = supabase
      .channel("sync-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload: any) => {
        const newOrder = payload.new
        setUnreadCount((c) => c + 1)
        bumpVersion("orders")

        if (!notifiedIds.current.has(newOrder.id)) {
          notifiedIds.current.add(newOrder.id)
          saveNotifiedIds()
          setLatestNewOrder({
            id: newOrder.id,
            protocol: newOrder.protocol,
            customer_name: newOrder.customer_name || undefined,
            total_value: newOrder.total_value || undefined,
          })
          playNotificationSound()
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload: any) => {
        if (payload.new.viewed_at && !payload.old.viewed_at) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        bumpVersion("orders")
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "orders" }, () => {
        refreshUnreadCount()
        bumpVersion("orders")
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [refreshUnreadCount, saveNotifiedIds])

  const getVersion = useCallback((table: TableName) => versions[table] || 0, [versions])
  const consumeNewOrder = useCallback(() => { setLatestNewOrder(null) }, [])

  return (
    <RealtimeContext.Provider
      value={{
        getVersion,
        subscribe,
        unreadCount,
        unreadLoading,
        latestNewOrder,
        consumeNewOrder,
        refreshUnreadCount,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider")
  return ctx
}

export function useRealtimeRefresh(...tables: TableName[]) {
  const ctx = useRealtime()
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const unsubs = tables.map((t) =>
      ctx.subscribe(t, () => {
        setVersion((prev) => prev + 1)
      })
    )
    return () => unsubs.forEach((fn) => fn())
  }, [tables, ctx])

  return version
}

export function useUnreadOrders() {
  const ctx = useRealtime()
  return { count: ctx.unreadCount, loading: ctx.unreadLoading, refresh: ctx.refreshUnreadCount }
}
