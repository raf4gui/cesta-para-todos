import { FiscalSettingsForm } from "@/components/admin/fiscal-settings-form"
import { getNfeConfig } from "./actions"

export const dynamic = "force-dynamic"

export default async function ConfiguracoesFiscaisPage() {
  const config = await getNfeConfig()

  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Configurações Fiscais</h1>
        <p className="text-sm text-[#526157] mt-0.5">Informações para emissão de documentos fiscais.</p>
      </div>
      <FiscalSettingsForm initialData={config} />
    </section>
  )
}
