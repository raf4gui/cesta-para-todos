"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { useRealtime } from "@/lib/realtime-context"
import { getLembretesPendentes } from "@/app/admin/anotacoes/actions"

export interface Reminder {
  id: string
  titulo: string
  descricao: string
  prioridade: string
  categoria: string
  cor: string
}

interface ReminderContextType {
  pendingReminders: Reminder[]
  unreadCount: number
  dismissReminder: (id: string) => void
  clearAll: () => void
}

const ReminderContext = createContext<ReminderContextType | null>(null)

const DISMISSED_KEY = "cesta_reminder_dismissed"

function loadDismissed(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY)
    if (stored) return new Set(JSON.parse(stored))
  } catch {}
  return new Set()
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
  } catch {}
}

const POLL_INTERVAL = 30000

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const dismissedRef = useRef<Set<string>>(loadDismissed())
  const { subscribe } = useRealtime()

  const fetchReminders = useCallback(async () => {
    try {
      const data = await getLembretesPendentes()
      const filtered = data
        .filter((r: any) => !dismissedRef.current.has(r.id))
        .map((r: any) => ({
          id: r.id,
          titulo: r.titulo || "Sem título",
          descricao: r.descricao
            ? r.descricao.length > 60
              ? r.descricao.slice(0, 60) + "..."
              : r.descricao
            : "",
          prioridade: r.prioridade,
          categoria: r.categoria,
          cor: r.cor || "",
        }))
      setReminders(filtered)
    } catch {}
  }, [])

  useEffect(() => {
    fetchReminders()
    const interval = setInterval(fetchReminders, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchReminders])

  useEffect(() => {
    const unsub = subscribe("orders", () => {
      fetchReminders()
    })
    return unsub
  }, [subscribe, fetchReminders])

  const dismissReminder = useCallback((id: string) => {
    dismissedRef.current.add(id)
    saveDismissed(dismissedRef.current)
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    for (const r of reminders) {
      dismissedRef.current.add(r.id)
    }
    saveDismissed(dismissedRef.current)
    setReminders([])
  }, [reminders])

  return (
    <ReminderContext.Provider
      value={{ pendingReminders: reminders, unreadCount: reminders.length, dismissReminder, clearAll }}
    >
      {children}
    </ReminderContext.Provider>
  )
}

export function useReminders() {
  const ctx = useContext(ReminderContext)
  if (!ctx) throw new Error("useReminders must be used within ReminderProvider")
  return ctx
}
