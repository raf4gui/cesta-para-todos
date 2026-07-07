"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { FolderTree, LayoutDashboard, ShoppingBasket, Tags, Package, LogOut, Users, Settings, ClipboardList, BarChart3, Boxes, DollarSign, FileText, ChevronLeft, StickyNote, ShoppingBag, Gift, Wine } from "lucide-react"
import { signOut } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { useUnreadOrders } from "@/lib/realtime-context"
import { useState } from "react"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/produtos/personalizacao", label: "Cesta Personalizada", icon: ShoppingBag },
  { href: "/admin/cestas-prontas", label: "Cestas Prontas", icon: ShoppingBasket },
  { href: "/admin/kits", label: "Kits", icon: Gift },
  { href: "/admin/fardos", label: "Fardos", icon: Wine },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/marcas", label: "Marcas", icon: Tags },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes },
  { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/admin/anotacoes", label: "Anotações", icon: StickyNote },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/nfe", label: "Nota Fiscal", icon: FileText },
  { href: "/admin/configuracoes/gerais", label: "Configurações", icon: Settings },
  { href: "/admin/configuracoes/fiscais", label: "Config. Fiscais", icon: FileText },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { count: unreadCount } = useUnreadOrders()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await signOut()
    router.replace("/login")
  }

  return (
    <>
      {/* Expand button (tablet, when collapsed) */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="hidden md:flex lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 h-10 w-6 rounded-r-md bg-sidebar border border-l-0 border-sidebar-border items-center justify-center hover:bg-sidebar-accent text-sidebar-foreground shadow-sm"
          title="Abrir menu"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      )}

      <aside className={cn(
        "bg-sidebar border-r border-sidebar-border flex-col h-screen sticky top-0 flex-shrink-0 z-20 transition-all duration-200",
        "hidden md:flex",
        collapsed ? "md:w-0 md:min-w-0 md:overflow-hidden md:border-r-0" : "md:w-64",
        "lg:w-64 lg:min-w-[16rem] lg:overflow-visible"
      )}>
        {/* Logo area */}
        <div className={cn(
          "h-20 flex items-center justify-center border-b border-sidebar-border relative flex-shrink-0",
          collapsed ? "md:hidden lg:flex" : ""
        )}>
          <Link href="/admin" className="relative h-[60px] w-full mx-6">
            <Image
              src="/WheelSexta.png"
              alt="Cesta para Todos logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
          {/* Collapse button (tablet only) */}
          <button
            onClick={() => setCollapsed(true)}
            className="hidden md:flex lg:hidden absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border items-center justify-center hover:bg-sidebar-accent text-sidebar-foreground shadow-sm flex-shrink-0"
            title="Recolher sidebar"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 px-4 py-6 space-y-1.5 overflow-y-auto",
          collapsed ? "md:hidden lg:flex" : ""
        )}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
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

        {/* Logout */}
        <div className={cn(
          "p-4 border-t border-sidebar-border bg-sidebar/50 flex-shrink-0",
          collapsed ? "md:hidden lg:block" : ""
        )}>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  )
}
