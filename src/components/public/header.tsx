"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu, MessageCircle, X } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export default function Header({
  whatsappPhone = "",
}: {
  whatsappPhone?: string
  addressLine?: string
  cityState?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
    <header className={cn(
      "fixed top-0 z-50 w-full transition-all duration-300 ease-in-out",
      scrolled
        ? "bg-white/85 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-b border-[#dfe7dd] py-3"
        : "bg-transparent py-5 md:py-6"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="Cesta para Todos">
            <div className="relative h-14 w-56 md:h-16 md:w-64">
              <Image src="/WheelSexta.png" alt="Cesta para Todos" fill className="object-contain object-left" priority />
            </div>
          </Link>


          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#cestas"
              className="flex items-center min-h-[44px] px-3 text-sm font-semibold text-gray-700 hover:text-[#006B2E] transition-colors duration-200 rounded-lg hover:bg-[#f0f7f0]"
            >
              Cestas
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={`https://api.whatsapp.com/send?phone=${whatsappPhone}`}
              className="inline-flex h-11 min-h-[44px] items-center gap-2 rounded-full bg-[#006B2E] px-6 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#005c27] hover:shadow-[0_6px_20px_rgba(0,107,46,0.35)] shadow-[0_4px_14px_rgba(0,107,46,0.3)]"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              WhatsApp
            </Link>
          </div>

          <button
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg p-2 md:hidden text-gray-700 hover:bg-[#f0f7f0] transition-colors duration-200"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)}>
          <div className="ml-auto flex h-full w-[85%] max-w-sm flex-col bg-white p-6 shadow-2xl transition-all duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between">
              <div className="relative h-14 w-56">
                <Image src="/WheelSexta.png" alt="Cesta para Todos" fill className="object-contain object-left" />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fechar menu"
                className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>


            <nav className="flex flex-col gap-1">
              <Link
                href="#cestas"
                onClick={() => setIsOpen(false)}
                className="flex items-center min-h-[44px] rounded-xl px-4 py-2 text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-colors duration-200"
              >
                Cestas
              </Link>
              <span className="flex items-center min-h-[44px] rounded-xl px-4 py-2 text-lg font-semibold text-gray-400 cursor-default">
                Carrinho
              </span>
              <span className="flex items-center min-h-[44px] rounded-xl px-4 py-2 text-lg font-semibold text-gray-400 cursor-default">
                Pedidos
              </span>
              <span className="flex items-center min-h-[44px] rounded-xl px-4 py-2 text-lg font-semibold text-gray-400 cursor-default">
                Categorias
              </span>
            </nav>

            <div className="mt-auto pt-6">
              <Link
                href={`https://api.whatsapp.com/send?phone=${whatsappPhone}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 min-h-[44px] w-full rounded-full bg-[#006B2E] px-6 text-sm font-bold text-white transition-all duration-200 hover:bg-[#005c27] shadow-[0_4px_14px_rgba(0,107,46,0.3)]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                WhatsApp
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
