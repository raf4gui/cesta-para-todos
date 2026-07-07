function fmtCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR")
}

function fmtPhone(v: string) {
  if (!v) return ""
  const d = v.replace(/\D/g, "")
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return v
}

function fmtCpfCnpj(v: string) {
  if (!v) return ""
  const d = v.replace(/\D/g, "")
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  return v
}

export interface ThermalOptions {
  width: string
  fontSize: number
  fontFamily?: string
  showLogo?: boolean
  showPhone?: boolean
  showAddress?: boolean
  showNotes?: boolean
}

function padCenter(text: string, width: number): string {
  const len = text.length
  if (len >= width) return text
  const left = Math.floor((width - len) / 2)
  return " ".repeat(left) + text + " ".repeat(width - len - left)
}

function padRight(text: string, width: number): string {
  const len = text.length
  if (len >= width) return text
  return text + " ".repeat(width - len)
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
  const ff = "'Courier New', 'Lucida Console', monospace"
  const total = Number(order.total_value) || items.reduce((s: number, i: any) => s + Number(i.total_price), 0)

  const is80 = options.width === "80mm"
  const cols = is80 ? 42 : 30
  const sep = "-".repeat(cols)
  const dbl = "=".repeat(cols)

  const statusLabel = (order.status || "").replace(/_/g, " ")

  const itemsHtml = items.map((item: any) => {
    const brandName = item.chosen_brand?.name || item.product?.brand?.name || ""
    const productName = item.name || item.product?.name || "Item"
    const displayName = brandName ? `${productName} (${brandName})` : productName
    const qty = item.quantity
    const unitPrice = fmtCurrency(Number(item.unit_price))
    const lineTotal = fmtCurrency(Number(item.total_price))

    const qtyStr = `${qty}x`
    const unitStr = `${unitPrice}`
    const totalStr = `${lineTotal}`

    if (is80) {
      const line1 = `${qtyStr} ${displayName}`
      const line2 = `    ${padRight(unitStr, 14)}${padRight("", cols - 14 - totalStr.length)}${totalStr}`
      return `<pre style="margin:0;line-height:1.4;font-size:${fs}px;font-family:${ff};white-space:pre-wrap;word-break:break-word;">${line1}\n${line2}</pre>`
    }

    const line1 = `${qtyStr} ${displayName}`
    const line2 = `    ${padRight(unitStr, 12)}${padRight("", cols - 12 - totalStr.length)}${totalStr}`
    return `<pre style="margin:0;line-height:1.4;font-size:${fs}px;font-family:${ff};white-space:pre-wrap;word-break:break-word;">${line1}\n${line2}</pre>`
  }).join("\n")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Pedido ${protocol}</title>
<style>
  @page {
    margin: 0;
    size: ${options.width} 297mm;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${options.width};
    min-height: 100%;
    background: #fff;
    color: #000;
  }
  body {
    font-family: ${ff};
    font-size: ${fs}px;
    line-height: 1.25;
    padding: 2mm 3mm;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .receipt { width: 100%; }

  .center { text-align: center; }
  .bold { font-weight: 700; }

  .logo {
    max-height: ${is80 ? "50px" : "35px"};
    max-width: 90%;
    margin-bottom: 2px;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  .store-name {
    font-size: ${fs + (is80 ? 4 : 2)}px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 1px;
    line-height: 1.2;
  }
  .store-info { font-size: ${fs - 1}px; line-height: 1.3; margin-bottom: 1px; }

  .sep { border: none; border-top: 1px dashed #000; margin: 3mm 0; }
  .dbl-sep { border: none; border-top: 2px solid #000; margin: 3mm 0; }

  .section-title {
    font-weight: 700;
    font-size: ${fs}px;
    margin: 2mm 0 1mm;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: ${fs}px;
    line-height: 1.4;
  }
  .info-row .label { font-weight: 700; white-space: nowrap; }
  .info-row .value { text-align: right; flex: 1; padding-left: 4px; }

  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: ${fs + (is80 ? 4 : 2)}px;
    font-weight: 700;
    padding: 1mm 0;
    line-height: 1.3;
  }

  .footer-text {
    text-align: center;
    font-size: ${fs}px;
    margin-top: 3mm;
    line-height: 1.4;
  }
  .footer-text .thanks {
    font-weight: 700;
    font-size: ${fs + 1}px;
    text-transform: uppercase;
  }

  .obs-text {
    font-size: ${fs}px;
    margin-top: 2mm;
    font-style: italic;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .customer-box {
    border: 1px dashed #000;
    padding: 1mm 1.5mm;
    margin: 1mm 0;
    font-size: ${fs}px;
  }
  .customer-box .c-label {
    font-size: ${fs - 2}px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @media print {
    html, body {
      width: ${options.width};
      margin: 0;
      padding: 0;
    }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="receipt">

  <!-- Logo -->
  ${options.showLogo !== false ? `<div class="center"><img src="${logoUrl}" alt="Logo" class="logo" /></div>` : ""}

  <!-- Store Header -->
  <div class="center store-name">${store.company_name || "Cesta para Todos"}</div>
  ${store.cnpj ? `<div class="center store-info">CNPJ: ${fmtCpfCnpj(store.cnpj)}</div>` : ""}
  ${store.address_line ? `<div class="center store-info">${store.address_line}${store.city_state ? ", " + store.city_state : ""}</div>` : ""}
  ${store.company_phone ? `<div class="center store-info">TEL: ${fmtPhone(store.company_phone)}</div>` : ""}

  <hr class="sep" />

  <!-- Order Info -->
  <div class="info-row"><span class="label">PEDIDO</span><span class="value">${protocol}</span></div>
  <div class="info-row"><span class="label">DATA</span><span class="value">${fmtDate(order.created_at)} ${new Date(order.created_at).toLocaleTimeString("pt-BR")}</span></div>
  <div class="info-row"><span class="label">STATUS</span><span class="value">${statusLabel}</span></div>
  ${order.delivery_type ? `<div class="info-row"><span class="label">TIPO</span><span class="value">${order.delivery_type === "ENTREGA" ? "Entrega" : "Retirada"}</span></div>` : ""}
  ${order.payment_method ? `<div class="info-row"><span class="label">PAGAMENTO</span><span class="value">${order.payment_method}</span></div>` : ""}
  ${order.payment_status ? `<div class="info-row"><span class="label">STATUS PAG</span><span class="value">${order.payment_status.replace(/_/g, " ")}</span></div>` : ""}

  <hr class="sep" />

  <!-- Customer -->
  <div class="customer-box">
    <div class="c-label">Cliente</div>
    <div style="font-weight:700;margin-top:1px;">${customer?.name || "-"}</div>
    ${options.showPhone !== false && customer?.phone ? `<div>TEL: ${fmtPhone(customer.phone)}</div>` : ""}
    ${customer?.cpf_cnpj ? `<div>CPF/CNPJ: ${fmtCpfCnpj(customer.cpf_cnpj)}</div>` : ""}
    ${options.showAddress !== false && order.delivery_address ? `<div>END: ${order.delivery_address}</div>` : ""}
  </div>

  <hr class="sep" />

  <!-- Items -->
  <div class="section-title">ITENS</div>
  ${itemsHtml}
  ${items.length === 0 ? '<div class="center" style="padding:2mm 0;color:#999;">Nenhum item</div>' : ""}

  <hr class="sep" />

  <!-- Total -->
  <div class="total-row">
    <span>TOTAL</span>
    <span>${fmtCurrency(total)}</span>
  </div>

  <!-- Observations -->
  ${options.showNotes !== false && order.notes ? `<div class="obs-text"><span class="bold">OBS:</span> ${order.notes}</div>` : ""}

  <hr class="dbl-sep" />

  <!-- Footer -->
  <div class="footer-text">
    <div class="thanks">Obrigado pela prefer&ecirc;ncia!</div>
    <div>${store.company_name || "Cesta para Todos"}</div>
    ${store.company_phone ? `<div>TEL: ${fmtPhone(store.company_phone)}</div>` : ""}
    ${store.whatsapp_phone ? `<div>WhatsApp: ${fmtPhone(store.whatsapp_phone)}</div>` : ""}
    <div style="margin-top:2mm;font-size:${fs - 1}px;">${fmtDateTime(new Date().toISOString())}</div>
    <div style="font-size:${fs - 1}px;">Protocolo: ${protocol}</div>
  </div>

</div>

<!-- Actions (screen only) -->
<div class="no-print" style="text-align:center;padding:3mm 0;margin-top:3mm;border-top:1px solid #ddd;">
  <button onclick="window.print()" style="padding:8px 24px;font-size:12px;font-weight:700;background:#006B2E;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:6px;">Imprimir</button>
  <button onclick="window.close()" style="padding:8px 24px;font-size:12px;font-weight:600;background:#f0f0f0;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Fechar</button>
</div>

</body>
</html>`
}
