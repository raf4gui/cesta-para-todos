import Image from "next/image"
import Link from "next/link"
import { Mail, MapPin, MessageCircle, ShieldCheck } from "lucide-react"

export default function Footer({
  supportEmail = "",
  whatsappPhone = "",
}: {
  supportEmail?: string
  whatsappPhone?: string
  addressLine?: string
  cityState?: string
}) {
  return (
    <footer className="bg-[#0A0A0A] text-gray-300">
      <div className="border-b border-white/5 bg-[#111111]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <ShieldCheck className="h-6 w-6 text-[#006B2E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Segurança e Qualidade</p>
              <p className="text-xs text-gray-400 mt-1">Cestas verificadas com garantia de entrega</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <MessageCircle className="h-6 w-6 text-[#FF6A00]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Atendimento Rápido</p>
              <p className="text-xs text-gray-400 mt-1">Feche seu pedido diretamente pelo WhatsApp</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <MapPin className="h-6 w-6 text-[#006B2E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Entrega Local</p>
              <p className="text-xs text-gray-400 mt-1">Carnaíba de Baixo, Pindobaçu e região</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <div className="relative h-14 w-48 rounded-md bg-white p-2">
            <Image src="/WheelSexta.png" alt="Cesta para Todos Logo" fill className="object-contain p-2" />
          </div>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-gray-400">
            Cestas básicas e kits montados para famílias, empresas e compras recorrentes. 
            Soluções práticas e atendimento de excelência.
          </p>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-bold tracking-wider text-white">Navegação</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><Link href="/#cestas" className="hover:text-white transition-colors">Catálogo de Cestas</Link></li>
            <li><Link href="/#processo" className="hover:text-white transition-colors">Como funciona</Link></li>
            <li><Link href="/#faq" className="hover:text-white transition-colors">Perguntas Frequentes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-bold tracking-wider text-white">Contato</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[#FF6A00] flex-shrink-0" />
              <span>
                Carnaíba de Baixo<br />
                Pindobaçu - Bahia
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#006B2E] flex-shrink-0" />
              <a href={`mailto:${supportEmail}`} className="hover:text-white transition-colors">{supportEmail}</a>
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-[#FF6A00] flex-shrink-0" />
              <a href={`https://api.whatsapp.com/send?phone=${whatsappPhone}`} className="hover:text-white transition-colors">WhatsApp Comercial</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>&copy; {new Date().getFullYear()} Cesta para Todos. Todos os direitos reservados.</div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-gray-300 transition-colors">Administração</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
