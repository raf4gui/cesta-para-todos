"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { getCalendarEvents } from "@/app/admin/financeiro/actions"

function fmt(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) }

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

const TYPE_COLORS: Record<string, string> = {
  recebimento: "bg-green-500",
  vencimento: "bg-red-500",
  recorrente: "bg-blue-500",
}

const TYPE_LABELS: Record<string, string> = {
  recebimento: "Recebimento",
  vencimento: "Vencimento",
  recorrente: "Recorrente",
}

function CalendarTabContent() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [events, setEvents] = useState<Record<number, Array<{ id: string; title: string; type: string; value: number }>>>({})
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCalendarEvents(month, year)
      setEvents(data)
    } catch {} finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const today = new Date()

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const dayEvents = selectedDay ? events[selectedDay] ?? [] : []

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-[#f0f4f0] transition-colors">
            <ChevronLeft className="h-5 w-5 text-[#526157]" />
          </button>
          <h2 className="text-lg font-bold text-[#102016]">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-[#f0f4f0] transition-colors">
            <ChevronRight className="h-5 w-5 text-[#526157]" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#006B2E] border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-bold text-[#526157] py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} className="min-h-[72px] border border-[#f0f4f0] bg-[#fcfdfa]" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dayEventsList = events[day] ?? []
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                const isSelected = selectedDay === day
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[72px] border border-[#f0f4f0] p-1.5 text-left transition-colors hover:bg-[#fcfdfa] ${
                      isSelected ? "ring-2 ring-[#006B2E] ring-inset bg-[#fcfdfa]" : ""
                    } ${isToday ? "bg-[#006B2E]/5" : ""}`}
                  >
                    <span className={`text-xs font-semibold inline-flex items-center justify-center h-6 w-6 rounded-full ${
                      isToday ? "bg-[#006B2E] text-white" : "text-[#102016]"
                    }`}>
                      {day}
                    </span>
                    {dayEventsList.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex gap-0.5">
                          {Array.from(new Set(dayEventsList.map(e => e.type))).slice(0, 3).map(type => (
                            <span key={type} className={`inline-block h-1.5 w-1.5 rounded-full ${TYPE_COLORS[type] || "bg-gray-400"}`} />
                          ))}
                        </div>
                        <span className="text-[9px] text-[#8c9c91] font-medium">{dayEventsList.length} evento(s)</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className="flex gap-4 mt-4 text-xs text-[#526157]">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Recebimento</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Vencimento</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Recorrente</span>
        </div>
      </div>

      {selectedDay !== null && (
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#102016]">
              Eventos - {selectedDay} de {MONTHS[month]} {year}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-[#f0f4f0]">
              <X className="h-4 w-4 text-[#526157]" />
            </button>
          </div>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-[#8c9c91] text-center py-6">Nenhum evento neste dia.</p>
          ) : (
            <div className="space-y-2">
              {dayEvents.map((evt, idx) => (
                <div key={`${evt.id}-${idx}`} className="flex items-center gap-3 rounded-lg border border-[#dfe7dd] p-3 hover:bg-[#fcfdfa]">
                  <span className={`inline-block h-3 w-3 rounded-full shrink-0 ${TYPE_COLORS[evt.type] || "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#102016] truncate">{evt.title}</p>
                    <p className="text-[11px] text-[#526157]">{TYPE_LABELS[evt.type] || evt.type}</p>
                  </div>
                  <span className="text-sm font-mono font-bold text-[#102016] shrink-0">{fmt(evt.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CalendarioTab() {
  return <CalendarTabContent />
}
