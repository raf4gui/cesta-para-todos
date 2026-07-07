import { CartProvider } from "@/lib/cart-context";
import { CartButton } from "@/components/public/cart-drawer";
import { RealtimeProvider } from "@/lib/realtime-context";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <CartProvider>
        {children}
        <CartButton />
      </CartProvider>
    </RealtimeProvider>
  )
}
