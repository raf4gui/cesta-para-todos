function fmtCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

function fmtPhone(v: string) {
  if (!v) return ""
  const d = v.replace(/\D/g, "")
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return v
}

export interface ThermalOptions {
  width: string          // "58mm" or "80mm"
  fontSize: number       // 9-11 for 58mm, 12 for 80mm
  fontFamily?: string    // monospace fallback
  showLogo?: boolean
  showPhone?: boolean
  showAddress?: boolean
  showNotes?: boolean
}

export function renderThermalPrintHtml(
  order: any,
  items: any[],
  store: any,
  options: ThermalOptions,
) {
  const customer = order.customer || {}
  const protocol = order.protocol || ""
  const logoUrl = store.logo_url || "/WheelSexta.png"
  const fs = options.fontSize
  const ff = options.fontFamily || "'Courier New', Courier, monospace"
  const total = Number(order.total_value) || items.reduce((s: number, i: any) => s + Number(i.total_price), 0)

  const dashed = "-".repeat(options.width === "80mm" ? 42 : 32)
  const doubleDash = "=".repeat(options.width === "80mm" ? 42 : 32)

  const itemsHtml = items.map((item: any) => {
    const brandName = item.chosen_brand?.name || item.product?.brand?.name || ""
    const productName = item.name || item.product?.name || "Item"
    const displayName = brandName ? `${productName} (${brandName})` : productName
    const lineTotal = fmtCurrency(Number(item.total_price))
    const line = `${item.quantity}x ${displayName}`
    return `<div style="display:flex;justify-content:space-between">
      <span>${line}</span>
      <span>${lineTotal}</span>
    </div>`
  }).join("")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pedido ${protocol}</title>
<style>
  @page { margin: 0; size: ${options.width} auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${ff};
    font-size: ${fs}px;
    color: #000;
    background: #fff;
    line-height: 1.3;
    width: ${options.width};
    margin: 0 auto;
    padding: 4px 6px;
  }

  .receipt { width: 100%; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: 700; }
  .dashed { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .double-dashed { border: none; border-top: 2px dashed #000; margin: 8px 0; }

  .logo { max-height: 40px; max-width: 100%; margin-bottom: 4px; }
  .store-name { font-size: ${fs + 2}px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .store-info { font-size: ${fs - 1}px; margin-bottom: 2px; }

  .header-line { font-size: ${fs}px; margin-bottom: 1px; }
  .section-title { font-weight: 700; margin-top: 6px; margin-bottom: 2px; font-size: ${fs}px; text-decoration: underline; }

  .item-row {
    display: flex;
    justify-content: space-between;
    font-size: ${fs}px;
    line-height: 1.5;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: ${fs + 2}px;
    font-weight: 700;
    padding: 4px 0;
  }

  .footer-text {
    text-align: center;
    font-size: ${fs - 1}px;
    margin-top: 8px;
    line-height: 1.5;
  }

  .obs-text {
    font-size: ${fs}px;
    margin-top: 4px;
    font-style: italic;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; width: ${options.width}; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="receipt">

  <!-- Logo -->
  ${options.showLogo !== false ? `<div class="center"><img src="${logoUrl}" alt="Logo" class="logo" /></div>` : ""}

  <!-- Store Name -->
  <div class="center store-name">${store.company_name || "Cesta para Todos"}</div>
  ${store.cnpj ? `<div class="center store-info">CNPJ: ${store.cnpj}</div>` : ""}
  ${store.address_line ? `<div class="center store-info">${store.address_line}${store.city_state ? ", " + store.city_state : ""}</div>` : ""}

  <hr class="dashed" />

  <!-- Order Info -->
  <div class="header-line"><span class="bold">PEDIDO:</span> ${protocol}</div>
  <div class="header-line"><span class="bold">DATA:</span> ${fmtDate(order.created_at)}</div>
  <div class="header-line"><span class="bold">STATUS:</span> ${(order.status || "").replace(/_/g, " ")}</div>

  <hr class="dashed" />

  <!-- Customer -->
  <div class="section-title">CLIENTE</div>
  <div class="header-line">${customer?.name || "-"}</div>
  ${options.showPhone !== false && customer?.phone ? `<div class="header-line"><span class="bold">TEL:</span> ${fmtPhone(customer.phone)}</div>` : ""}
  ${options.showAddress !== false && order.delivery_address ? `<div class="header-line"><span class="bold">END:</span> ${order.delivery_address}</div>` : ""}
  ${order.delivery_type ? `<div class="header-line"><span class="bold">ENTREGA:</span> ${order.delivery_type === "ENTREGA" ? "Entrega" : "Retirada"}</div>` : ""}
  ${order.payment_method ? `<div class="header-line"><span class="bold">PAG:</span> ${order.payment_method}</div>` : ""}

  <hr class="dashed" />

  <!-- Items -->
  <div class="section-title">ITENS</div>
  ${itemsHtml}
  ${items.length === 0 ? '<div class="center" style="padding:8px;color:#999;">Nenhum item</div>' : ""}

  <hr class="dashed" />

  <!-- Total -->
  <div class="total-row">
    <span>TOTAL</span>
    <span>${fmtCurrency(total)}</span>
  </div>

  <!-- Observations -->
  ${options.showNotes !== false && order.notes ? `<div class="obs-text"><span class="bold">OBS:</span> ${order.notes}</div>` : ""}

  <hr class="double-dashed" />

  <!-- Footer -->
  <div class="footer-text">
    <div style="font-weight:700;font-size:${fs + 1}px">Obrigado pela prefer&ecirc;ncia!</div>
    <div>${store.company_name || "Cesta para Todos"}</div>
    ${store.company_phone ? `<div>TEL: ${fmtPhone(store.company_phone)}</div>` : ""}
    <div style="margin-top:4px;font-size:${fs - 1}px;">${fmtDate(new Date().toISOString())} &mdash; ${new Date().toLocaleTimeString("pt-BR")}</div>
  </div>

</div>

<!-- Actions (screen only) -->
<div class="no-print" style="text-align:center;padding:12px 0;margin-top:12px;border-top:1px solid #ddd;">
  <button onclick="window.print()" style="padding:8px 24px;font-size:12px;font-weight:700;background:#006B2E;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:6px;">Imprimir</button>
  <button onclick="window.close()" style="padding:8px 24px;font-size:12px;font-weight:600;background:#f0f0f0;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Fechar</button>
</div>

</body>
</html>`
}
