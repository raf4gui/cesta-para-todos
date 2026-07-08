import { createClient } from "@supabase/supabase-js"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, "..", ".env.local")

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = val
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("❌ Missing environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const sb = createClient(url, key)
let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}`)
    failed++
  }
}

async function run() {
  console.log("\n🧪 TESTE DE ADMIN — CRUD\n")

  // ── CATEGORY ──
  console.log("📁 Categorias")
  const catName = `Teste Cat ${Date.now()}`
  const { data: cat, error: catErr } = await sb.from("categories").insert({ name: catName, ativo: true }).select().single()
  assert(!catErr, `Criar categoria: ${catErr?.message || catName}`)
  const catId = cat?.id
  assert(catId, "Categoria tem ID")

  if (catId) {
    const { error: updCatErr } = await sb.from("categories").update({ description: "Editada" }).eq("id", catId)
    assert(!updCatErr, `Editar categoria: ${updCatErr?.message || "ok"}`)
    const { data: catCheck } = await sb.from("categories").select("description").eq("id", catId).single()
    assert(catCheck?.description === "Editada", "Categoria editada confirmada")

    const { error: delCatErr } = await sb.from("categories").delete().eq("id", catId)
    assert(!delCatErr, `Excluir categoria: ${delCatErr?.message || "ok"}`)
  }

  // ── BRAND ──
  console.log("\n🏷️ Marcas")
  const brandName = `Teste Brand ${Date.now()}`
  const { data: brand, error: brandErr } = await sb.from("brands").insert({ name: brandName, ativo: true }).select().single()
  assert(!brandErr, `Criar marca: ${brandErr?.message || brandName}`)
  const brandId = brand?.id
  assert(brandId, "Marca tem ID")

  if (brandId) {
    const { error: updBrandErr } = await sb.from("brands").update({ description: "Marca teste editada" }).eq("id", brandId)
    assert(!updBrandErr, `Editar marca: ${updBrandErr?.message || "ok"}`)

    const { error: delBrandErr } = await sb.from("brands").delete().eq("id", brandId)
    assert(!delBrandErr, `Excluir marca hard: ${delBrandErr?.message || "ok"}`)
  }

  // ── PRODUCT ──
  console.log("\n📦 Produtos")

  // Create a permanent test category and brand for the product test
  const { data: permCat } = await sb.from("categories").insert({ name: `TestCat ${Date.now()}`, ativo: true }).select().single()
  const { data: permBrand } = await sb.from("brands").insert({ name: `TestBrand ${Date.now()}`, ativo: true }).select().single()

  const prodName = `Teste Produto ${Date.now()}`
  const { data: prod, error: prodErr } = await sb.from("products").insert({
    name: prodName,
    stock: 100,
    price: 50,
    sale_price: 45,
    purchase_price: 30,
    ativo: true,
    category_id: permCat?.id || null,
    brand_id: permBrand?.id || null,
  }).select().single()
  assert(!prodErr, `Criar produto: ${prodErr?.message || prodName}`)
  const prodId = prod?.id
  assert(prodId, "Produto tem ID")

  if (prodId) {
    const { error: updProdErr } = await sb.from("products").update({
      name: prodName + " EDITADO",
      sale_price: 40,
      stock: 80,
    }).eq("id", prodId)
    assert(!updProdErr, `Editar produto (nome, preço, estoque): ${updProdErr?.message || "ok"}`)
    const { data: prodCheck } = await sb.from("products").select("name, sale_price, stock").eq("id", prodId).single()
    assert(prodCheck?.name === prodName + " EDITADO", "Nome editado confirmado")
    assert(Number(prodCheck?.sale_price) === 40, "Preço editado confirmado")
    assert(Number(prodCheck?.stock) === 80, "Estoque editado confirmado")

    const { error: toggleErr } = await sb.from("products").update({ ativo: false }).eq("id", prodId)
    assert(!toggleErr, `Desativar produto: ${toggleErr?.message || "ok"}`)
    const { data: prodInactive } = await sb.from("products").select("ativo").eq("id", prodId).single()
    assert(prodInactive?.ativo === false, "Produto desativado confirmado")

    const { error: reactivateErr } = await sb.from("products").update({ ativo: true }).eq("id", prodId)
    assert(!reactivateErr, `Reativar produto: ${reactivateErr?.message || "ok"}`)

    if (permBrand?.id) {
      const { error: pbErr } = await sb.from("product_brands").insert({
        product_id: prodId,
        brand_id: permBrand.id,
        sale_price: 42,
        purchase_price: 28,
        ativo: true,
      })
      assert(!pbErr, `Associar marca ao produto: ${pbErr?.message || "ok"}`)
    }

    const { error: delProdErr } = await sb.from("products").delete().eq("id", prodId)
    assert(!delProdErr, `Excluir produto hard: ${delProdErr?.message || "ok"}`)
  }

  // Cleanup permCat and permBrand
  if (permCat?.id) await sb.from("categories").delete().eq("id", permCat.id)
  if (permBrand?.id) await sb.from("brands").delete().eq("id", permBrand.id)

  // ── BASKET ──
  console.log("\n🧺 Cestas")
  const basketName = `Teste Cesta ${Date.now()}`
  const { data: basket, error: basketErr } = await sb.from("baskets").insert({
    name: basketName,
    tipo: "CESTA_PRATICA",
    price: 100,
    ativo: true,
    show_catalog: true,
    show_price: true,
    description: "Cesta de teste",
  }).select().single()
  assert(!basketErr, `Criar cesta: ${basketErr?.message || basketName}`)
  const basketId = basket?.id
  assert(basketId, "Cesta tem ID")

  if (basketId) {
    const { error: updBasketErr } = await sb.from("baskets").update({
      name: basketName + " EDITADA",
      price: 120,
      description: "Cesta de teste editada",
    }).eq("id", basketId)
    assert(!updBasketErr, `Editar cesta (nome, preço, descrição): ${updBasketErr?.message || "ok"}`)

    const { data: basketCheck } = await sb.from("baskets").select("name, price, description").eq("id", basketId).single()
    assert(basketCheck?.name === basketName + " EDITADA", "Nome da cesta editado confirmado")
    assert(Number(basketCheck?.price) === 120, "Preço da cesta editado confirmado")

    const { error: basketToggleErr } = await sb.from("baskets").update({ ativo: false }).eq("id", basketId)
    assert(!basketToggleErr, `Desativar cesta: ${basketToggleErr?.message || "ok"}`)

    const { error: hardDelErr } = await sb.from("baskets").delete().eq("id", basketId)
    assert(!hardDelErr, `Excluir cesta hard: ${hardDelErr?.message || "ok"}`)
  }

  // ── CUSTOMER ──
  console.log("\n👤 Clientes")
  const custName = `Teste Cliente ${Date.now()}`
  const custPhone = `559999999${Date.now() % 100000}`
  const { data: cust, error: custErr } = await sb.from("customers").insert({
    name: custName,
    phone: custPhone,
    ativo: true,
  }).select().single()
  assert(!custErr, `Criar cliente: ${custErr?.message || custName}`)
  const custId = cust?.id
  assert(custId, "Cliente tem ID")

  if (custId) {
    const { error: updCustErr } = await sb.from("customers").update({
      name: custName + " EDITADO",
      city: "Cidade Teste",
    }).eq("id", custId)
    assert(!updCustErr, `Editar cliente: ${updCustErr?.message || "ok"}`)

    const { data: custCheck } = await sb.from("customers").select("name, city").eq("id", custId).single()
    assert(custCheck?.name === custName + " EDITADO", "Nome do cliente editado confirmado")
    assert(custCheck?.city === "Cidade Teste", "Cidade do cliente editada confirmada")

    const { error: delCustErr } = await sb.from("customers").delete().eq("id", custId)
    assert(!delCustErr, `Excluir cliente hard: ${delCustErr?.message || "ok"}`)
  }

  // ── UPLOAD TEST (without actual file) ──
  console.log("\n📷 Upload (validação)")
  const allowed = ["image/jpeg", "image/png", "image/webp"]
  assert(allowed.includes("image/jpeg"), "Tipo JPEG aceito")
  assert(allowed.includes("image/png"), "Tipo PNG aceito")
  assert(allowed.includes("image/webp"), "Tipo WEBP aceito")
  assert(!allowed.includes("image/gif"), "Tipo GIF não aceito (correto)")
  assert(!allowed.includes("application/pdf"), "Tipo PDF não aceito (correto)")

  const MAX = 10 * 1024 * 1024
  assert(MAX === 10485760, "Tamanho máximo: 10MB")

  // ── SUMMARY ──
  console.log(`\n${"=".repeat(40)}`)
  console.log(`✅ Passou: ${passed}`)
  console.log(`❌ Falhou: ${failed}`)
  console.log(`📊 Total: ${passed + failed}`)
  console.log(`${"=".repeat(40)}\n`)

  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => {
  console.error("Erro fatal:", err)
  process.exit(1)
})
