import Header from "@/components/public/header"
import Footer from "@/components/public/footer"
import CatalogSection from "@/components/public/catalog-section"
import Hero from "@/components/public/hero"
import FAQ from "@/components/public/faq"
import { ClipboardCheck, MessageCircle, PackageCheck, Truck } from "lucide-react"
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

        <section id="processo" className="py-14 md:py-18" style={{ background: "linear-gradient(180deg, #fafbf9 0%, #f6faf6 50%, #eef7f0 100%)" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <span className="text-sm font-black uppercase tracking-[0.18em] text-[#FF6A00]">Compra organizada</span>
                <h2 className="mt-2 text-3xl font-black tracking-normal text-[#102016] sm:text-4xl">
                  Um fluxo simples para vender pelo celular sem perder controle.
                </h2>
                <p className="mt-4 text-base font-medium leading-7 text-[#526157]">
                  O cliente escolhe no site, chama a loja pelo WhatsApp e a equipe recebe o pedido no painel para organizar cestas, marcas e produtos.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: PackageCheck, title: "1. Cliente escolhe a cesta", text: "Cards com imagem, nome e tipo da cesta para decisão rápida." },
                  { icon: MessageCircle, title: "2. Conversa vai para o WhatsApp", text: "A loja confirma marcas, quantidades, endereço e disponibilidade." },
                  { icon: ClipboardCheck, title: "3. Pedido entra no painel", text: "A equipe acompanha status, pagamento, observações e histórico interno." },
                  { icon: Truck, title: "4. Entrega combinada", text: "Atendimento local para Carnaíba de Baixo, Pindobaçu e região." },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-lg border border-[#dfe7dd] bg-[#fbfcf8] p-5">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-[#006B2E] text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-black text-[#102016]">{item.title}</h3>
                      <p className="mt-2 text-sm font-medium leading-6 text-[#526157]">{item.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

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
