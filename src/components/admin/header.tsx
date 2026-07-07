"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, LogOut, Bell } from "lucide-react"
import { signOut } from "@/lib/auth-client"
import { useReminders } from "@/lib/reminder-context"
import { useSidebar } from "@/lib/sidebar-context"

const TITLE_MAP: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/pedidos": "Pedidos",
  "/admin/clientes": "Clientes",
  "/admin/produtos": "Produtos",
  "/admin/categorias": "Categorias",
  "/admin/marcas": "Marcas",
  "/admin/cestas": "Cestas",
  "/admin/estoque": "Estoque",
  "/admin/financeiro": "Financeiro",
  "/admin/anotacoes": "Anotações",
  "/admin/relatorios": "Relatórios",
  "/admin/nfe": "Nota Fiscal",
  "/admin/configuracoes/gerais": "Configurações",
  "/admin/configuracoes/fiscais": "Config. Fiscais",
}

export default function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { open } = useSidebar()
  const { unreadCount: reminderCount } = useReminders()

  const handleLogout = async () => {
    await signOut()
    router.replace("/login")
  }

  const currentTitle = Object.entries(TITLE_MAP).find(
    ([href]) => pathname === href || (href !== "/admin" && pathname.startsWith(href))
  )?.[1] ?? "Painel"

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#dfe7dd] bg-white/90 backdrop-blur-md">
      <div className="flex h-16 md:h-20 items-center justify-between px-4 sm:px-6">

        <div className="flex items-center space-x-3 md:space-x-0">
          <button
            onClick={open}
            className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-lg hover:bg-[#f0f7f0] text-[#102016] transition-colors"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="md:hidden relative h-[42px] w-28 sm:w-40">
            <Image
              src="/WheelSexta.png"
              alt="Cesta para Todos Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h2 className="hidden md:block text-xl font-bold text-[#102016]">
            {currentTitle}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-[#006B2E] uppercase tracking-wider">Administração</span>
            <span className="text-sm font-medium text-[#526157]">Painel Centralizado</span>
          </div>

          <Link
            href="/admin/anotacoes"
            className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-[#f0f7f0] text-[#526157] transition-colors"
            title="Lembretes pendentes"
          >
            <Bell className="w-5 h-5" />
            {reminderCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[14px] rounded-full bg-red-500 text-white text-[9px] font-bold px-1 leading-none shadow-sm">
                {reminderCount > 99 ? "99+" : reminderCount}
              </span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
