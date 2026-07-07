import { SettingsForm } from "@/components/admin/settings-form"
import { ResetSystemButton } from "@/components/admin/reset-system-button"
import { getStoreSettings } from "@/app/admin/configuracoes/actions"

export const dynamic = "force-dynamic"

export default async function ConfiguracoesGeraisPage() {
  const settings = await getStoreSettings()

  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Configurações Gerais</h1>
        <p className="text-sm text-[#526157] mt-0.5">Dados comerciais usados pela loja pública.</p>
      </div>
      <SettingsForm initialData={settings as any} />
      <ResetSystemButton />
    </section>
  )
}
