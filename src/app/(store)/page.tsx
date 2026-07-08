import Header from "@/components/public/header"
import Footer from "@/components/public/footer"
import CatalogSection from "@/components/public/catalog-section"
import Hero from "@/components/public/hero"
import FAQ from "@/components/public/faq"
import { getStoreSettings } from "@/app/admin/configuracoes/actions"

export const dynamic = "force-dynamic"

export default async function Home() {
  const settings = await getStoreSettings()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header whatsappPhone={settings.whatsapp_phone} addressLine={settings.address_line} cityState={settings.city_state} />

      <main className="flex-1">
        <Hero />
        <CatalogSection />
        <FAQ />
      </main>

      <Footer
        supportEmail={settings.support_email}
        whatsappPhone={settings.whatsapp_phone}
        addressLine={settings.address_line}
        cityState={settings.city_state}
      />
    </div>
  )
}
