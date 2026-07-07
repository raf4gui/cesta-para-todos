import AdminSidebar from "@/components/admin/sidebar"
import AdminHeader from "@/components/admin/header"
import MobileSidebar from "@/components/admin/mobile-sidebar"
import { OrderNotification } from "@/components/admin/order-notification"
import { ReminderProvider } from "@/lib/reminder-context"
import { SidebarProvider } from "@/lib/sidebar-context"
import { ReminderToast } from "@/components/admin/reminder-toast"
import { RealtimeProvider } from "@/lib/realtime-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RealtimeProvider>
    <ReminderProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <AdminSidebar />
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto bg-muted/20 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#dfe7dd] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-[#c8d6c4]">
              {children}
            </main>
          </div>
          <MobileSidebar />
          <OrderNotification />
          <ReminderToast />
        </div>
      </SidebarProvider>
    </ReminderProvider>
    </RealtimeProvider>
  )
}
