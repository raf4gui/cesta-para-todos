import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Formato não aceito: ${file.type || "desconhecido"}. Use JPG, JPEG, PNG ou WEBP.` },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 10MB.` },
        { status: 400 },
      )
    }

    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1]
    const fileName = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error: uploadErr } = await sb.storage.from("images").upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadErr) {
      if (uploadErr.message?.toLowerCase().includes("bucket") && uploadErr.message?.toLowerCase().includes("not found")) {
        const { error: createErr } = await sb.storage.createBucket("images", { public: true })
        if (createErr) {
          return NextResponse.json({ error: "Falha ao criar bucket: " + createErr.message }, { status: 500 })
        }
        const { error: retryErr } = await sb.storage.from("images").upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        })
        if (retryErr) {
          return NextResponse.json({ error: "Falha no upload: " + retryErr.message }, { status: 500 })
        }
      } else {
        return NextResponse.json(
          { error: uploadErr.message?.includes("policy") ? "Upload negado. Verifique as permissões do bucket 'images' no Supabase." : "Falha no upload: " + uploadErr.message },
          { status: 500 },
        )
      }
    }

    const { data } = sb.storage.from("images").getPublicUrl(fileName)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno no upload." }, { status: 500 })
  }
}
