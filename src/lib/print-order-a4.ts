function fmtCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR")
}

function fmtCpfCnpj(v: string) {
  if (!v) return "-"
  const d = v.replace(/\D/g, "")
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  return v
}

function fmtPhone(v: string) {
  if (!v) return ""
  const d = v.replace(/\D/g, "")
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return v
}

const statusLabels: Record<string, string> = {
  AGUARDANDO_CONTATO: "Aguardando Contato",
  CONFIRMADO: "Confirmado",
  PREPARANDO: "Preparando",
  SAIU_PARA_ENTREGA: "Saiu para Entrega",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
}

function buildQrData(order: any, customer: any, store: any) {
  return JSON.stringify({
    protocolo: order.protocol || "",
    pedido: order.id || "",
    total: Number(order.total_value) || 0,
    cliente: customer?.name || "",
    data: order.created_at || "",
    loja: store.company_name || "Cesta para Todos",
  })
}

export function renderA4PrintHtml(order: any, items: any[], store: any) {
  const customer = order.customer || {}
  const protocol = order.protocol || ""
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.total_price), 0)
  const total = Number(order.total_value) || subtotal
  const statusLabel = statusLabels[order.status] || order.status?.replace(/_/g, " ") || ""
  const logoUrl = store.logo_url || "/WheelSexta.png"
  const qrData = buildQrData(order, customer, store)
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=120x120&chl=${encodeURIComponent(qrData)}`

  const showLogo = store.print_show_logo !== false
  const showQrCode = store.print_show_qrcode !== false
  const showNotes = store.print_show_notes !== false
  const showPhone = store.print_show_phone !== false
  const showAddress = store.print_show_address !== false

  function statusClass(s: string) {
    if (s === "CONFIRMADO" || s === "FINALIZADO") return "confirmed"
    if (s === "CANCELADO") return "canceled"
    return "pending"
  }

  const itemsHtml = items.map((item: any, idx: number) => {
    const brandName = item.chosen_brand?.name || item.product?.brand?.name || ""
    const productName = item.name || item.product?.name || "Item"
    const displayName = brandName ? `${productName} (${brandName})` : productName
    return `<tr>
      <td>${idx + 1}</td>
      <td>${displayName}</td>
      <td class="right mono">${item.quantity}</td>
      <td class="right mono">${fmtCurrency(Number(item.unit_price))}</td>
      <td class="right mono">${fmtCurrency(Number(item.total_price))}</td>
    </tr>`
  }).join("")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pedido ${protocol}</title>
<style>
  @page { margin: 2cm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    line-height: 1.5;
    background: #fff;
  }

  .print-page {
    max-width: 160mm;
    margin: 0 auto;
    padding: 0;
    position: relative;
  }

  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 80px;
    font-weight: 900;
    color: rgba(0, 107, 46, 0.04);
    letter-spacing: 8px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
  }

  .print-header {
    text-align: center;
    padding-bottom: 14px;
    border-bottom: 3px double #006B2E;
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
  }
  .print-header .logo { max-height: 75px; margin-bottom: 6px; }
  .print-header h1 { font-size: 24px; font-weight: 900; color: #006B2E; letter-spacing: 2px; text-transform: uppercase; }
  .print-header .doc-title { font-size: 13px; font-weight: 700; color: #102016; margin-top: 2px; letter-spacing: 1px; }
  .print-header .store-info { font-size: 9px; color: #555; margin-top: 4px; line-height: 1.6; }
  .print-header .store-info .whatsapp { color: #25D366; font-weight: 600; }
  .print-header .store-info .phone { font-weight: 600; }

  .print-order-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: #f8fbf8;
    border: 1px solid #dfe7dd;
    border-radius: 6px;
    margin-bottom: 14px;
    position: relative;
    z-index: 1;
  }
  .print-order-info .protocol { font-size: 18px; font-weight: 800; color: #102016; font-family: 'Courier New', monospace; }
  .print-order-info .date { font-size: 10px; color: #526157; margin-top: 2px; }
  .print-order-info .status-badge {
    display: inline-block;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .status-badge.confirmed { background: #e8f5e9; color: #2e7d32; }
  .status-badge.pending { background: #fff8e1; color: #f57f17; }
  .status-badge.canceled { background: #ffebee; color: #c62828; }

  .print-sections {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
    position: relative;
    z-index: 1;
  }
  .print-section { border: 1px solid #dfe7dd; border-radius: 6px; overflow: hidden; }
  .print-section .section-title {
    background: #f0f5f0;
    padding: 5px 10px;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #526157;
    border-bottom: 1px solid #dfe7dd;
  }
  .print-section .section-body { padding: 6px 10px; }
  .print-section .field { margin-bottom: 3px; }
  .print-section .field .label { font-size: 7.5px; color: #8c9c91; text-transform: uppercase; }
  .print-section .field .value { font-size: 11px; font-weight: 600; color: #102016; }

  table.items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    position: relative;
    z-index: 1;
  }
  table.items thead th {
    background: #006B2E;
    color: #fff;
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 6px 8px;
    text-align: left;
    font-weight: 700;
  }
  table.items thead th.right { text-align: right; }
  table.items tbody td {
    padding: 5px 8px;
    border-bottom: 1px solid #f0f4f0;
    font-size: 10px;
    color: #102016;
  }
  table.items tbody td.right { text-align: right; }
  table.items tbody td.mono { font-family: 'Courier New', monospace; }
  table.items tbody tr:nth-child(even) { background: #fafcfa; }
  table.items tbody tr:last-child td { border-bottom: 2px solid #006B2E; }

  .totals {
    margin-left: auto;
    width: 260px;
    margin-bottom: 12px;
    position: relative;
    z-index: 1;
  }
  .totals .row {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 11px;
    color: #526157;
  }
  .totals .row.total {
    border-top: 2px solid #006B2E;
    padding-top: 6px;
    margin-top: 3px;
    font-size: 15px;
    font-weight: 900;
    color: #006B2E;
  }

  .observation-box {
    border: 1px solid #dfe7dd;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 12px;
    background: #fcfdfa;
    position: relative;
    z-index: 1;
  }
  .observation-box .title { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #526157; margin-bottom: 3px; }
  .observation-box .text { font-size: 10px; color: #102016; line-height: 1.5; }

  .signature-area {
    border: 2px dashed #bbb;
    border-radius: 6px;
    padding: 20px 16px 10px;
    margin-bottom: 12px;
    text-align: center;
    position: relative;
    z-index: 1;
  }
  .signature-area .label {
    font-size: 8px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .signature-area .line {
    border-top: 1px solid #ccc;
    width: 60%;
    margin: 20px auto 4px;
  }
  .signature-area .sub-label {
    font-size: 8px;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
    margin-top: 8px;
    position: relative;
    z-index: 1;
  }
  .footer-bottom .qr-section {
    flex-shrink: 0;
    text-align: center;
  }
  .footer-bottom .qr-section img {
    width: 90px;
    height: 90px;
    display: block;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }
  .footer-bottom .qr-section .qr-label {
    font-size: 7px;
    color: #999;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .footer-bottom .footer-info {
    flex: 1;
    text-align: right;
  }

  .print-footer {
    text-align: center;
    font-size: 8px;
    color: #8c9c91;
    border-top: 1px solid #dfe7dd;
    padding-top: 8px;
    margin-top: 8px;
    position: relative;
    z-index: 1;
  }
  .print-footer .thank-you { font-size: 11px; font-weight: 700; color: #006B2E; margin-bottom: 3px; }
  .print-footer .page-number { font-size: 7px; color: #bbb; margin-top: 4px; }

  .no-print { position: relative; z-index: 10; }

  @media print {
    html, body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
    }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .watermark { display: block; }
    .no-print { display: none !important; }
    .print-section { break-inside: avoid; }
    table.items { break-inside: avoid; }
    .totals { break-inside: avoid; }
    .observation-box { break-inside: avoid; }
    .signature-area { break-inside: avoid; }
    .footer-bottom { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="print-page">

  <div class="watermark">CESTA PARA TODOS</div>

  <!-- Header -->
  <div class="print-header">
    ${showLogo ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ""}
    <h1>${store.company_name || "Cesta para Todos"}</h1>
    <div class="doc-title">COMPROVANTE DE VENDA &mdash; ${protocol}</div>
    <div class="store-info">
      ${store.cnpj ? `CNPJ: ${fmtCpfCnpj(store.cnpj)}` : ""}
      ${store.cnpj && store.company_phone ? " &mdash; " : ""}
      ${store.company_phone ? `<span class="phone">Tel: ${fmtPhone(store.company_phone)}</span>` : ""}
      ${store.whatsapp_phone ? ` &mdash; <span class="whatsapp">WhatsApp: ${fmtPhone(store.whatsapp_phone)}</span>` : ""}
      ${(store.cnpj || store.company_phone || store.whatsapp_phone) ? "<br />" : ""}
      ${store.address_line || ""}${store.address_line && store.city_state ? ", " : ""}${store.city_state || ""}
    </div>
  </div>

  <!-- Order Info -->
  <div class="print-order-info">
    <div>
      <div class="protocol">${protocol}</div>
      <div class="date">${fmtDateTime(order.created_at)}</div>
    </div>
    <div>
      <span class="status-badge ${statusClass(order.status)}">${statusLabel}</span>
    </div>
  </div>

  <!-- Customer & Delivery -->
  <div class="print-sections">
    <div class="print-section">
      <div class="section-title">Cliente</div>
      <div class="section-body">
        <div class="field">
          <div class="label">Nome</div>
          <div class="value">${customer?.name || "-"}</div>
        </div>
        ${showPhone && customer?.phone ? `<div class="field"><div class="label">Telefone</div><div class="value">${fmtPhone(customer.phone)}</div></div>` : ""}
        ${customer?.cpf_cnpj ? `<div class="field"><div class="label">CPF/CNPJ</div><div class="value">${fmtCpfCnpj(customer.cpf_cnpj)}</div></div>` : ""}
      </div>
    </div>
    <div class="print-section">
      <div class="section-title">Entrega & Pagamento</div>
      <div class="section-body">
        <div class="field">
          <div class="label">Tipo</div>
          <div class="value">${order.delivery_type === "ENTREGA" ? "Entrega" : "Retirada"}</div>
        </div>
        ${showAddress && order.delivery_address ? `<div class="field"><div class="label">Endereço</div><div class="value">${order.delivery_address}</div></div>` : ""}
        <div class="field">
          <div class="label">Pagamento</div>
          <div class="value">${order.payment_method || "A combinar"}</div>
        </div>
        <div class="field">
          <div class="label">Status Pagamento</div>
          <div class="value">${(order.payment_status || "").replace(/_/g, " ")}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <table class="items">
    <thead>
      <tr>
        <th style="width:35px">#</th>
        <th>Produto</th>
        <th style="width:45px" class="right">Qtd</th>
        <th style="width:85px" class="right">Valor Un.</th>
        <th style="width:90px" class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
      ${items.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:12px;color:#999;">Nenhum item</td></tr>' : ""}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${fmtCurrency(subtotal)}</span></div>
    <div class="row total"><span>Total</span><span>${fmtCurrency(total)}</span></div>
  </div>

  <!-- Observations -->
  ${showNotes && order.notes ? `<div class="observation-box"><div class="title">Observações</div><div class="text">${order.notes}</div></div>` : ""}

  <!-- Signature Area -->
  <div class="signature-area">
    <div class="label">Assinatura Digital da Empresa</div>
    <div class="line"></div>
    <div class="sub-label">${store.company_name || "Cesta para Todos"}</div>
  </div>

  <!-- QR Code + Footer Info -->
  <div class="footer-bottom">
    ${showQrCode ? `<div class="qr-section"><img src="${qrUrl}" alt="QR Code" /><div class="qr-label">Escaneie para verificar</div></div>` : ""}
    <div class="footer-info">
      <div style="font-size:10px;font-weight:600;color:#102016;">${store.company_name || "Cesta para Todos"}</div>
      ${customer?.name ? `<div style="font-size:9px;color:#526157;">Cliente: ${customer.name}</div>` : ""}
      ${store.cnpj ? `<div style="font-size:8px;color:#8c9c91;">CNPJ: ${fmtCpfCnpj(store.cnpj)}</div>` : ""}
    </div>
  </div>

  <!-- Footer -->
  <div class="print-footer">
    <div class="thank-you">Cesta para Todos &mdash; Obrigado pela preferência!</div>
    <div>Emitido em ${fmtDateTime(order.created_at || new Date().toISOString())}</div>
    <div class="page-number">Página 1/1</div>
  </div>

</div>

<!-- Actions (screen only) -->
<div class="no-print" style="text-align:center;padding:16px 0;margin-top:16px;border-top:1px solid #ddd;">
  <button onclick="window.print()" style="padding:10px 30px;font-size:13px;font-weight:700;background:#006B2E;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:8px;">Imprimir</button>
  <button onclick="window.close()" style="padding:10px 30px;font-size:13px;font-weight:600;background:#f0f0f0;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Fechar</button>
</div>

</body>
</html>`
}
