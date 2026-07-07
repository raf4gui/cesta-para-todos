"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  FolderTree,
  Tags,
  ShoppingBasket,
  Boxes,
  DollarSign,
  BarChart3,
  StickyNote,
  FileText,
  Settings,
  LogOut,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/auth-client"
import { useUnreadOrders } from "@/lib/realtime-context"
import { useSidebar } from "@/lib/sidebar-context"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/marcas", label: "Marcas", icon: Tags },
  { href: "/admin/cestas", label: "Cestas", icon: ShoppingBasket },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes },
  { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/admin/anotacoes", label: "Anotações", icon: StickyNote },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/nfe", label: "Nota Fiscal", icon: FileText },
  { href: "/admin/configuracoes/gerais", label: "Configurações", icon: Settings },
  { href: "/admin/configuracoes/fiscais", label: "Config. Fiscais", icon: FileText },
]

export default function MobileSidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()
  const { count: unreadCount } = useUnreadOrders()

  const handleLogout = async () => {
    await signOut()
    window.location.replace("/login")
  }

  return (
    <>
      {/* Overlay — semi-transparent dark, fades in/out */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          "bg-black/40",
          "transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel — solid white, slides from the left */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 md:hidden",
          "w-72 max-w-[85vw]",
          "bg-white",
          "border-r border-gray-200",
          "shadow-[4px_0_24px_rgba(0,0,0,0.15)]",
          "flex flex-col",
          "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Fixed header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <div className="relative h-[42px] w-36">
            <Image
              src="/WheelSexta.png"
              alt="Cesta para Todos"
              fill
              className="object-contain"
              priority
            />
          </div>
          <button
            onClick={close}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-1 bg-white">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium min-h-[44px] transition-colors duration-150",
                  isActive
                    ? "bg-[#006B2E] text-white"
                    : "text-gray-900 hover:bg-gray-100 hover:text-[#006B2E]"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0 text-current" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.label === "Pedidos" && unreadCount > 0 && (
                  <span className="flex items-center justify-center h-5 min-w-5 rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none flex-shrink-0">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Fixed logout */}
        <div className="px-3 py-3 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium min-h-[44px] text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  )
}
