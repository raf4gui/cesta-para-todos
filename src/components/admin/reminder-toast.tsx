"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { useReminders, type Reminder } from "@/lib/reminder-context"
import { Bell, X } from "lucide-react"

const PRIORIDADE_DOT: Record<string, string> = {
  baixa: "bg-blue-500",
  normal: "bg-gray-400",
  alta: "bg-amber-500",
  urgente: "bg-red-500",
}

const CATEGORIA_BADGE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  geral: { label: "Geral", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  tarefa: { label: "Tarefa", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  ideia: { label: "Ideia", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  reuniao: { label: "Reunião", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  projeto: { label: "Projeto", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  outro: { label: "Outro", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
}

function playReminderSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

const AUTO_DISMISS_MS = 15000

export function ReminderToast() {
  const { pendingReminders, unreadCount, dismissReminder, clearAll } = useReminders()
  const [visible, setVisible] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const prevCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startAutoDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setMinimized(false)
    }, AUTO_DISMISS_MS)
  }, [])

  useEffect(() => {
    if (unreadCount > 0 && unreadCount !== prevCountRef.current) {
      if (unreadCount > prevCountRef.current) {
        playReminderSound()
      }
      setVisible(true)
      setMinimized(false)
      startAutoDismiss()
    }
    prevCountRef.current = unreadCount
  }, [unreadCount, startAutoDismiss])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!visible || unreadCount === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[110] flex flex-col items-end gap-2 max-w-sm w-full">
      {/* Header bar */}
      <div className="w-full rounded-xl border border-[#dfe7dd] bg-white shadow-lg overflow-hidden">
        <Link
          href="/admin/anotacoes"
          className="flex items-center gap-3 px-4 py-3 border-b border-[#dfe7dd] hover:bg-[#fcfdfa] transition-colors"
          onClick={() => { setVisible(false); setMinimized(false) }}
        >
          <div className="h-9 w-9 rounded-full bg-[#006B2E]/10 flex items-center justify-center flex-shrink-0">
            <Bell className="h-4 w-4 text-[#006B2E]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#102016]">
              {unreadCount} {unreadCount === 1 ? "lembrete pendente" : "lembretes pendentes"}
            </p>
            <p className="text-[11px] text-[#526157]">Clique para ver todas</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMinimized(!minimized)
              }}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400"
            >
              <svg className={`h-4 w-4 transition-transform ${minimized ? "" : "rotate-180"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m18 15-6-6-6 6" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setVisible(false)
                setMinimized(false)
              }}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Link>

        {/* Reminder list */}
        {!minimized && (
          <div className="max-h-72 overflow-y-auto divide-y divide-[#dfe7dd]">
            {pendingReminders.slice(0, 5).map((reminder: Reminder) => {
              const dotColor = PRIORIDADE_DOT[reminder.prioridade] || "bg-gray-400"
              const catBadge = CATEGORIA_BADGE[reminder.categoria] || CATEGORIA_BADGE.geral
              return (
                <div
                  key={reminder.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[#fcfdfa] transition-colors group"
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#102016] truncate">{reminder.titulo}</p>
                    {reminder.descricao && (
                      <p className="text-[11px] text-[#526157] mt-0.5 truncate">{reminder.descricao}</p>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold mt-1 ${catBadge.bg} ${catBadge.text} ${catBadge.border}`}
                    >
                      {catBadge.label}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      dismissReminder(reminder.id)
                    }}
                    className="p-1 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex-shrink-0"
                    title="Descartar"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
            {pendingReminders.length > 5 && (
              <div className="px-4 py-2 text-center">
                <span className="text-[11px] text-[#526157]">+{pendingReminders.length - 5} mais</span>
              </div>
            )}
          </div>
        )}

        {/* Clear all button */}
        {!minimized && unreadCount > 0 && (
          <div className="border-t border-[#dfe7dd] px-4 py-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                clearAll()
                setVisible(false)
                setMinimized(false)
              }}
              className="w-full h-8 rounded-lg bg-[#006B2E] text-white text-xs font-semibold hover:bg-[#005324] transition-colors"
            >
              Limpar todos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
