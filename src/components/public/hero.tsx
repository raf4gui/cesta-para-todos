import { ShoppingBasket, Truck, MessageCircle, Award } from "lucide-react"
import Image from "next/image"

export default function Hero() {
  return (
    <>
      <section className="relative w-full overflow-visible" style={{ background: "linear-gradient(135deg, #f0f7f0 0%, #faf8f5 45%, #fef6ed 100%)" }}>
        {/* Decorative corner shapes */}
        <div className="absolute top-0 right-0 w-[38%] h-[70%] max-w-[480px] pointer-events-none select-none" aria-hidden="true" style={{ background: "radial-gradient(ellipse at top right, rgba(249,160,83,0.18) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-[40%] h-[55%] max-w-[480px] pointer-events-none select-none" aria-hidden="true" style={{ background: "radial-gradient(ellipse at bottom left, rgba(50,128,43,0.15) 0%, transparent 65%)" }} />

        {/* Dots grid — desktop only */}
        <div className="absolute top-24 left-6 z-10 hidden lg:grid grid-cols-4 gap-2.5 opacity-30 pointer-events-none select-none" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#006B2E]" />
          ))}
        </div>

        {/* ════════════════════════════════════════
            DESKTOP — two columns (lg+)
            ════════════════════════════════════════ */}
        <div className="hidden lg:flex w-full max-w-7xl mx-auto px-8 xl:px-12 items-stretch min-h-0">

          {/* ── Left: text column (flex-1 so mascot stays ~35%) ── */}
          <div className="flex-1 flex flex-col justify-center py-14 xl:py-16 pr-8 xl:pr-12">

            {/* Badge */}
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-[#006B2E]/20 bg-white px-4 py-1.5 text-xs font-bold text-[#006B2E] shadow-sm mb-4">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6A00]/10 text-[#FF6A00]">
                <ShoppingBasket className="h-3 w-3 stroke-[2.5]" />
              </span>
              Monte do seu jeito!
            </div>

            {/* H1 */}
            <h1 className="text-[2.8rem] xl:text-[3.2rem] leading-[1.05] font-black tracking-tight text-[#006B2E] mb-4">
              Monte sua <br />
              <span className="text-[#FF6A00]">cesta</span><br />
              do seu jeito.
            </h1>

            {/* Support text */}
            <p className="text-sm xl:text-base text-[#526157] font-medium leading-relaxed max-w-[420px] mb-6">
              Escolha os produtos que deseja e receba tudo com praticidade através da Cesta para Todos.
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <a
                href="#customizer"
                aria-label="Montar Minha Cesta"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6A00] px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_5px_20px_rgba(255,106,0,0.30)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e55c00] hover:shadow-[0_8px_24px_rgba(255,106,0,0.40)] active:scale-95"
              >
                <ShoppingBasket className="h-4 w-4 stroke-[2.5]" />
                Montar Minha Cesta
              </a>
              <a
                href="#ready-baskets"
                aria-label="Ver Cestas Prontas"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#006B2E] bg-white px-7 py-3.5 text-sm font-extrabold text-[#006B2E] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#006B2E]/6 active:scale-95"
              >
                Ver Cestas Prontas
              </a>
            </div>
          </div>

          {/* ── Right: mascot column ── */}
          <div className="relative flex-shrink-0 w-[38%] xl:w-[36%] flex items-end justify-center overflow-visible">
            <div className="relative z-20 -mb-8 xl:-mb-10 -ml-8 xl:-ml-12 overflow-visible flex items-end justify-center">
              <Image
                src="/heroimagem.png"
                alt="Mascote Cesta Para Todos"
                width={1024}
                height={1024}
                className="heroMascot"
                priority
                quality={100}
              />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            TABLET — two columns (md to lg-)
            ════════════════════════════════════════ */}
        <div className="hidden md:flex lg:hidden w-full max-w-4xl mx-auto px-6 items-stretch min-h-0">

          {/* ── Left: text column ── */}
          <div className="flex-1 flex flex-col justify-center py-12 pr-6">
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-[#006B2E]/20 bg-white px-3.5 py-1.5 text-xs font-bold text-[#006B2E] shadow-sm mb-3">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6A00]/10 text-[#FF6A00]">
                <ShoppingBasket className="h-2.5 w-2.5 stroke-[2.5]" />
              </span>
              Monte do seu jeito!
            </div>

            <h1 className="text-[2.2rem] leading-[1.06] font-black tracking-tight text-[#006B2E] mb-3">
              Monte sua <br />
              <span className="text-[#FF6A00]">cesta</span><br />
              do seu jeito.
            </h1>

            <p className="text-sm text-[#526157] font-medium leading-relaxed max-w-sm mb-5">
              Escolha os produtos que deseja e receba tudo com praticidade através da Cesta para Todos.
            </p>

            <div className="flex flex-col gap-2.5 max-w-[280px]">
              <a
                href="#customizer"
                aria-label="Montar Minha Cesta"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6A00] px-6 py-3 text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(255,106,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e55c00] active:scale-95 text-center"
              >
                <ShoppingBasket className="h-4 w-4 stroke-[2.5]" />
                Montar Minha Cesta
              </a>
              <a
                href="#ready-baskets"
                aria-label="Ver Cestas Prontas"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#006B2E] bg-white px-6 py-3 text-sm font-extrabold text-[#006B2E] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#006B2E]/5 active:scale-95 text-center"
              >
                Ver Cestas Prontas
              </a>
            </div>
          </div>

          {/* ── Right: mascot (tablet) ── */}
          <div className="relative flex-shrink-0 w-[38%] flex items-end justify-center overflow-visible">
            <div className="relative z-20 -mb-6 overflow-visible flex items-end justify-center">
              <Image
                src="/heroimagem.png"
                alt="Mascote Cesta Para Todos"
                width={1024}
                height={1024}
                className="heroMascot"
                style={{ maxWidth: "430px" }}
                priority
                quality={100}
              />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            MOBILE — single column stacked (< md)
            ════════════════════════════════════════ */}
        <div className="flex flex-col md:hidden w-full px-5 pt-20 pb-2">

          {/* Badge */}
          <div className="self-center inline-flex items-center gap-2 rounded-full border border-[#006B2E]/20 bg-white px-3.5 py-1.5 text-xs font-bold text-[#006B2E] shadow-sm mb-3">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6A00]/10 text-[#FF6A00]">
              <ShoppingBasket className="h-2.5 w-2.5 stroke-[2.5]" />
            </span>
            Monte do seu jeito!
          </div>

          {/* H1 */}
          <h1 className="text-[1.7rem] leading-[1.08] font-black tracking-tight text-[#006B2E] text-center mb-3">
            Monte sua{" "}
            <span className="text-[#FF6A00]">cesta</span>{" "}
            do seu jeito.
          </h1>

          {/* Support text */}
          <p className="text-sm text-[#526157] font-medium leading-relaxed text-center max-w-[300px] self-center mb-4">
            Escolha os produtos que deseja e receba tudo com praticidade.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-2.5 w-full max-w-[320px] self-center mb-6">
            <a
              href="#customizer"
              aria-label="Montar Minha Cesta"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6A00] py-3.5 text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(255,106,0,0.28)] transition-all duration-300 active:scale-95 text-center"
            >
              <ShoppingBasket className="h-4 w-4 stroke-[2.5]" />
              Montar Minha Cesta
            </a>
            <a
              href="#ready-baskets"
              aria-label="Ver Cestas Prontas"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#006B2E] bg-white py-3.5 text-sm font-extrabold text-[#006B2E] transition-all duration-300 active:scale-95 text-center"
            >
              Ver Cestas Prontas
            </a>
          </div>

          {/* Mascot — max 220px, centered */}
          <div className="self-center flex justify-center items-end w-full overflow-visible">
            <Image
src="/heroimagem.png"
                alt="Mascote Cesta Para Todos"
                width={1024}
                height={1024}
              className="heroMascot"
              style={{ maxWidth: "220px" }}
              priority
              quality={100}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BENEFIT CARDS
          ══════════════════════════════════════════ */}
      <section className="relative z-20 py-5 md:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#dfe7dd] bg-white/96 p-5 md:p-7 shadow-[0_10px_36px_rgba(19,44,26,0.05)] backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 lg:divide-x lg:divide-[#dfe7dd]/60">

              <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:px-5 first:lg:pl-0">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#006B2E]/10 text-[#006B2E]">
                  <ShoppingBasket className="h-5 w-5 stroke-[2]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#102016]">Monte sua cesta</h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-[#526157]">Escolha os produtos que desejar.</p>
              </div>

              <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:px-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6A00]/10 text-[#FF6A00]">
                  <Truck className="h-5 w-5 stroke-[2]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#102016]">Receba em casa</h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-[#526157]">Entrega rápida e segura.</p>
              </div>

              <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:px-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#006B2E]/10 text-[#006B2E]">
                  <MessageCircle className="h-5 w-5 stroke-[2]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#102016]">Atendimento pelo WhatsApp</h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-[#526157]">Finalize seu pedido em poucos segundos.</p>
              </div>

              <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:px-5 last:lg:pr-0">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6A00]/10 text-[#FF6A00]">
                  <Award className="h-5 w-5 stroke-[2]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#102016]">Produtos de qualidade</h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-[#526157]">Selecionamos sempre as melhores marcas.</p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  )
}
