function fmtCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR")
}

function fmtCpf(v: string) {
  if (!v) return "-"
  const digits = v.replace(/\D/g, "")
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  return v
}

export function renderNfePrintHtml(emission: any, order: any) {
  const customer = order.customer || {}
  const items = order.items || []

  const invoiceNumber = String(emission.number || 0).padStart(6, "0")
  const invoiceType = emission.emission_type === "NFCE" ? "NFC-e" : "NF-e"
  const statusLabel =
    emission.status === "AUTHORIZED" ? "Autorizada"
    : emission.status === "PENDENTE" ? "Pendente"
    : emission.status === "CANCELED" ? "Cancelada"
    : emission.status === "DENIED" ? "Denegada"
    : emission.status

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${invoiceType} #${invoiceNumber}</title>
<style>
  @page { margin: 12mm 15mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    line-height: 1.4;
    background: #fff;
  }
  .page { max-width: 180mm; margin: 0 auto; }

  /* ── Header ── */
  .doc-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 12px;
    border-bottom: 3px double #1a1a1a;
    margin-bottom: 18px;
  }
  .doc-header .logo-area {
    width: 70px;
    height: 70px;
    border: 1px solid #ddd;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    color: #999;
    flex-shrink: 0;
  }
  .doc-header .company-info { flex: 1; }
  .doc-header .company-info h1 { font-size: 18px; font-weight: 900; color: #006B2E; letter-spacing: 1px; }
  .doc-header .company-info .cnpj { font-size: 10px; color: #555; margin-top: 2px; }
  .doc-header .invoice-info { text-align: right; }
  .doc-header .invoice-info .type-badge {
    display: inline-block;
    background: #1a1a1a;
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 10px;
    letter-spacing: 1px;
  }
  .doc-header .invoice-info .number {
    font-size: 22px;
    font-weight: 900;
    font-family: 'Courier New', monospace;
    margin-top: 4px;
  }
  .doc-header .invoice-info .series { font-size: 10px; color: #666; }

  /* ── Status ── */
  .status-box {
    text-align: center;
    padding: 6px 0;
    margin-bottom: 14px;
    border: 1px solid #ddd;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .status-box.authorized { border-color: #006B2E; color: #006B2E; background: #f0f7f0; }
  .status-box.pending { border-color: #d4a017; color: #8a6d00; background: #fef9e7; }
  .status-box.canceled { border-color: #c00; color: #c00; background: #fef0f0; }

  /* ── Info Sections ── */
  .info-section {
    border: 1px solid #ccc;
    margin-bottom: 12px;
  }
  .info-section .section-title {
    background: #f0f0f0;
    padding: 4px 8px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #ccc;
  }
  .info-section .section-body {
    padding: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 20px;
  }
  .info-section .section-body .full { grid-column: 1 / -1; }
  .info-section .field .label { font-size: 8px; color: #888; text-transform: uppercase; }
  .info-section .field .value { font-size: 11px; font-weight: 600; }

  /* ── Items Table ── */
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  table.items thead th {
    background: #f0f0f0;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 5px 8px;
    text-align: left;
    border: 1px solid #ccc;
    font-weight: 700;
  }
  table.items thead th.right { text-align: right; }
  table.items tbody td {
    padding: 5px 8px;
    border: 1px solid #ddd;
    font-size: 10px;
  }
  table.items tbody tr:nth-child(even) { background: #fafafa; }
  table.items .mono { font-family: 'Courier New', monospace; text-align: right; }
  table.items .qty { text-align: center; width: 40px; }

  /* ── Totals ── */
  .totals-box {
    border: 1px solid #1a1a1a;
    margin-bottom: 12px;
    text-align: right;
    padding: 8px 12px;
  }
  .totals-box .row { display: flex; justify-content: flex-end; gap: 30px; }
  .totals-box .label { font-size: 11px; color: #555; }
  .totals-box .value { font-size: 16px; font-weight: 900; color: #006B2E; }

  /* ── Notes ── */
  .notes-box {
    border: 1px solid #ddd;
    padding: 8px;
    margin-bottom: 12px;
  }
  .notes-box .title { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #666; }
  .notes-box .text { font-size: 10px; margin-top: 4px; }

  /* ── QR / Barcode Placeholder ── */
  .tech-area {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 12px;
  }
  .tech-area .box {
    width: 100px;
    height: 100px;
    border: 1px dashed #bbb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    color: #aaa;
    text-align: center;
  }

  /* ── Footer ── */
  .doc-footer {
    text-align: center;
    font-size: 9px;
    color: #888;
    border-top: 1px solid #ddd;
    padding-top: 10px;
    margin-top: 10px;
  }
  .doc-footer .line { margin-top: 2px; }

  /* ── Print ── */
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { max-width: none; }
    table.items tbody tr:nth-child(even) { background: #fafafa; }
    .no-print { display: none !important; }
    .info-section { break-inside: avoid; }
    table.items { break-inside: avoid; }
    .totals-box { break-inside: avoid; }
    .tech-area { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="doc-header">
    <div class="logo-area">LOGO</div>
    <div class="company-info">
      <h1>CESTA PARA TODOS</h1>
      <div class="cnpj">CNPJ: ${fmtCpf("")} &mdash; IE: </div>
    </div>
    <div class="invoice-info">
      <div class="type-badge">${invoiceType}</div>
      <div class="number">Nº ${invoiceNumber}</div>
      <div class="series">Série ${emission.serie || 1} &mdash; Em ${fmtDateTime(emission.created_at)}</div>
    </div>
  </div>

  <!-- Status -->
  <div class="status-box ${emission.status === "AUTHORIZED" ? "authorized" : emission.status === "PENDENTE" ? "pending" : "canceled"}">
    ${statusLabel}
  </div>

  <!-- Customer Info -->
  <div class="info-section">
    <div class="section-title">Dados do Cliente</div>
    <div class="section-body">
      <div class="field full"><div class="label">Nome / Razão Social</div><div class="value">${customer?.name || "-"}</div></div>
      <div class="field"><div class="label">CPF / CNPJ</div><div class="value">${fmtCpf(customer?.cpf_cnpj)}</div></div>
      <div class="field"><div class="label">Telefone</div><div class="value">${customer?.phone || "-"}</div></div>
      ${customer?.address ? `<div class="field full"><div class="label">Endereço</div><div class="value">${customer.address}${customer.city ? ` - ${customer.city}` : ""}</div></div>` : ""}
    </div>
  </div>

  <!-- Order Info -->
  <div class="info-section">
    <div class="section-title">Dados do Pedido</div>
    <div class="section-body">
      <div class="field"><div class="label">Pedido</div><div class="value">${order.protocol || "-"}</div></div>
      <div class="field"><div class="label">Data do Pedido</div><div class="value">${fmtDate(order.created_at)}</div></div>
      <div class="field"><div class="label">Entrega</div><div class="value">${order.delivery_type === "ENTREGA" ? "Entrega" : "Retirada"}</div></div>
      <div class="field"><div class="label">Pagamento</div><div class="value">${order.payment_method || "-"}</div></div>
      ${order.delivery_address ? `<div class="field full"><div class="label">Endereço de Entrega</div><div class="value">${order.delivery_address}</div></div>` : ""}
    </div>
  </div>

  <!-- Items -->
  <table class="items">
    <thead>
      <tr>
        <th class="qty">Qtd</th>
        <th>Produto</th>
        <th class="right">Valor Unit.</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${(items || []).map((item: any) => {
        const brandName = item.chosen_brand?.name || item.product?.brand?.name || ""
        const specs = [item.product?.peso, item.product?.volume, item.product?.unidade].filter(Boolean).join(" ")
        const name = [item.name || item.product?.name, brandName, specs].filter(Boolean).join(" - ")
        return `<tr>
          <td class="qty">${item.quantity}</td>
          <td>${name}</td>
          <td class="mono">${fmtCurrency(item.unit_price)}</td>
          <td class="mono">${fmtCurrency(item.total_price)}</td>
        </tr>`
      }).join("")}
      ${(!items || items.length === 0) ? '<tr><td colspan="4" style="text-align:center;padding:12px;color:#999;">Nenhum item</td></tr>' : ""}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-box">
    <div class="row">
      <span class="label">Valor Total</span>
      <span class="value">${fmtCurrency(Number(order.total_value) || 0)}</span>
    </div>
  </div>

  <!-- Notes -->
  ${order.notes ? `<div class="notes-box"><div class="title">Observações</div><div class="text">${order.notes}</div></div>` : ""}

  <!-- QR Code & Barcode (placeholders) -->
  <div class="tech-area">
    <div class="box">QR Code<br/>(estrutura preparada)</div>
    <div class="box">Código de Barras<br/>(estrutura preparada)</div>
  </div>

  <!-- Footer -->
  <div class="doc-footer">
    <div class="line">CESTA PARA TODOS</div>
    ${customer?.name ? `<div class="line">Cliente: ${customer.name}</div>` : ""}
    <div class="line">Documento emitido em ${fmtDateTime(emission.created_at)}</div>
    <div class="line">Consulte a autenticidade no site da SEFAZ</div>
  </div>

  <!-- Actions (screen only) -->
  <div class="no-print" style="text-align:center;padding:16px 0;margin-top:16px;border-top:1px solid #ddd;">
    <button onclick="window.print()" style="padding:10px 30px;font-size:13px;font-weight:700;background:#006B2E;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:8px;">Imprimir</button>
    <button onclick="window.close()" style="padding:10px 30px;font-size:13px;font-weight:600;background:#f0f0f0;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Fechar</button>
  </div>

</div>
</body>
</html>`
}
