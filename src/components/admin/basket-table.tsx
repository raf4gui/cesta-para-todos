"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateBasket, duplicateBasket, excludeBasket, toggleBasketStatus } from "@/app/admin/cestas/actions";
import { formatCurrency, formatDate } from "@/lib/services/base";
import { Pencil, Copy, EyeOff, Eye, Trash2, AlertTriangle, X } from "lucide-react";
import { RealtimeRefresh } from "@/components/admin/realtime-refresh";
import { useState } from "react";

interface BasketRow {
  id: string; name: string; description?: string; price: number
  internal_price?: number | null; show_price: boolean; show_catalog: boolean
  ativo: boolean; tipo: string; created_at: string
}

const TIPO_LABELS: Record<string, string> = {
  CESTA_PRATICA: "Cesta Prática", CESTA_COMPLETA: "Cesta Completa",
  CESTAO_FAMILIA: "Cestão Família", CESTA_PERSONALIZADA: "Personalizada",
  KIT: "Kit", FARDO: "Fardo",
}

export default function BasketTable({ baskets }: { baskets: BasketRow[] }) {
  const router = useRouter();
  const [confirmExclude, setConfirmExclude] = useState<{ id: string; name: string } | null>(null);
  const [excludeError, setExcludeError] = useState("");
  const [excluding, setExcluding] = useState(false);

  const handleToggle = async (id: string, ativo: boolean) => {
    try {
      await toggleBasketStatus(id, ativo);
      router.refresh();
    } catch (e) { console.error(e) }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await updateBasket(id, { ativo: false });
      router.refresh();
    } catch (e: any) {
      setExcludeError(e.message || "Erro ao desativar cesta");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateBasket(id);
      router.refresh();
    } catch (e) { console.error(e) }
  };

  const handleExclude = async () => {
    if (!confirmExclude) return;
    setExcluding(true);
    setExcludeError("");
    try {
      await excludeBasket(confirmExclude.id);
      setConfirmExclude(null);
      router.refresh();
    } catch (e: any) {
      setExcludeError(e.message || "Erro ao excluir");
    } finally {
      setExcluding(false);
    }
  };

  if (baskets.length === 0) {
    return (
      <>
        <RealtimeRefresh tables={["baskets"]} />
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-12 text-center">
          <p className="text-[#8c9c91]">Nenhuma cesta encontrada.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <RealtimeRefresh tables={["baskets"]} />
      <div className="overflow-x-auto rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#fcfdfa] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#526157]">Nome</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Tipo</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Preço</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Custo</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Catálogo</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Status</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Criação</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f0]">
            {baskets.map((basket) => (
              <tr key={basket.id} className="hover:bg-[#fcfdfa]">
                <td className="px-4 py-3 font-medium text-[#102016]">{basket.name}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{TIPO_LABELS[basket.tipo] || basket.tipo}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(basket.price)}</td>
                <td className="px-4 py-3 text-right font-mono text-[#8c9c91]">{basket.internal_price ? formatCurrency(basket.internal_price) : "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {basket.show_catalog ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Catálogo</Badge> : null}
                    {basket.show_price ? <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Preço</Badge> : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={basket.ativo ? "default" : "secondary"} className={basket.ativo ? "bg-green-100 text-green-700" : ""}>
                    {basket.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[#8c9c91]">{formatDate(basket.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link href={`/admin/cestas/${basket.id}`}>
                      <Button size="sm" variant="outline" title="Editar"><Pencil className="h-3 w-3" /></Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => handleDuplicate(basket.id)} title="Duplicar"><Copy className="h-3 w-3" /></Button>
                    {basket.ativo ? (
                      <Button size="sm" variant="outline" onClick={() => handleDeactivate(basket.id)} title="Desativar"><EyeOff className="h-3 w-3 text-amber-600" /></Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleToggle(basket.id, true)} title="Reativar"><Eye className="h-3 w-3 text-green-600" /></Button>
                    )}
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setConfirmExclude({ id: basket.id, name: basket.name }); setExcludeError("") }} title="Excluir">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exclude confirmation modal */}
      {confirmExclude && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmExclude(null)}>
          <div className="w-full max-w-md mx-4 rounded-xl border border-[#dfe7dd] bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#102016]">Excluir cesta</h3>
                <p className="text-sm text-[#526157]">Esta ação não pode ser desfeita.</p>
              </div>
              <button onClick={() => setConfirmExclude(null)} className="ml-auto p-1 rounded hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-[#102016] mb-1 font-medium">Tem certeza que deseja excluir este registro?</p>
            <p className="text-sm text-[#8c9c91] mb-6">&ldquo;{confirmExclude.name}&rdquo; será removido permanentemente.</p>

            {excludeError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 whitespace-pre-line">{excludeError}</div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmExclude(null)} disabled={excluding}>Cancelar</Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleExclude} disabled={excluding}>
                {excluding ? "Excluindo..." : "Excluir definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
