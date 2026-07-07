"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { ChevronDown } from "lucide-react"

const items = [
  { q: "Como faço o pedido?", a: "Escolha a cesta, selecione as marcas e finalize pelo WhatsApp. A loja confirma os detalhes diretamente na conversa." },
  { q: "Posso montar minha própria cesta?", a: "Sim — oferecemos cestas personalizáveis onde você escolhe as marcas de cada item." },
  { q: "O pagamento é pelo WhatsApp?", a: "O pagamento é combinado diretamente com a loja via WhatsApp; não processamos pagamentos online." },
  { q: "Vocês entregam na minha cidade?", a: "Atendemos principalmente a região local. Entre em contato via WhatsApp para confirmar disponibilidade." },
  { q: "Quanto tempo demora a entrega?", a: "O prazo varia por região. Após confirmação pelo WhatsApp, informaremos o prazo estimado." },
  { q: "Posso pedir para outra pessoa?", a: "Sim — informe os dados do destinatário no campo de contato ao finalizar o pedido." },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function onKey(e: KeyboardEvent, idx: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (idx + 1) % items.length
      refs.current[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (idx - 1 + items.length) % items.length
      refs.current[prev]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      refs.current[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      refs.current[items.length - 1]?.focus()
    }
  }

  return (
    <section id="faq" className="py-12" style={{ background: "linear-gradient(180deg, #f6faf6 0%, #ffffff 50%, #fafbf9 100%)" }}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">Perguntas Frequentes</h3>
        <div className="space-y-3" role="list">
          {items.map((it, idx) => {
            const isOpen = open === idx
            return (
              <div key={idx} className="w-full">
                <button
                  ref={(el) => {
                    refs.current[idx] = el
                  }}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${idx}`}
                  id={`faq-toggle-${idx}`}
                  onKeyDown={(e) => onKey(e, idx)}
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="w-full text-left p-4 bg-[#FBFBFB] rounded-lg flex items-start justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B2E]"
                >
                  <div>
                    <div className="font-semibold">{it.q}</div>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} aria-hidden />
                </button>

                <div
                  id={`faq-panel-${idx}`}
                  role="region"
                  aria-labelledby={`faq-toggle-${idx}`}
                  className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                  style={{ maxHeight: isOpen ? '200px' : '0px' }}
                >
                  <div className="p-4 text-sm text-[#444444]">{it.a}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
