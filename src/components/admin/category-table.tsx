"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateCategory, deleteCategory } from "@/app/admin/categorias/actions";
import { formatDate } from "@/lib/services/base";
import { Pencil, Trash2, AlertTriangle, X } from "lucide-react";
import { RealtimeRefresh } from "@/components/admin/realtime-refresh";
import { useState } from "react";

interface CategoryRow {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  ativo: boolean;
  created_at: string;
  products?: { count: number } | any[];
}

export default function CategoryTable({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; productCount: number } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleToggle = async (id: string, ativo: boolean) => {
    try {
      await updateCategory(id, { ativo });
      router.refresh();
    } catch (e: any) {
      setActionError(e.message || "Erro ao alterar categoria");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteCategory(confirmDelete.id);
      setConfirmDelete(null);
      router.refresh();
    } catch (e: any) {
      setActionError(e.message || "Erro ao excluir categoria");
    }
  };

  if (categories.length === 0) {
    return (
      <>
        <RealtimeRefresh tables={["categories"]} />
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-12 text-center">
          <p className="text-[#8c9c91]">Nenhuma categoria encontrada.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <RealtimeRefresh tables={["categories"]} />
      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-2 p-1 rounded hover:bg-red-100"><X className="h-3 w-3" /></button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#fcfdfa] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#526157]">Nome</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Descrição</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Produtos</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Status</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Criação</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f0]">
            {categories.map((cat) => {
              const productCount = Array.isArray(cat.products) ? cat.products.length : (cat.products?.count ?? 0);
              return (
                <tr key={cat.id} className="hover:bg-[#fcfdfa]">
                  <td className="px-4 py-3 font-medium text-[#102016]">{cat.name}</td>
                  <td className="px-4 py-3 text-[#8c9c91] max-w-[200px] truncate">{cat.description || "-"}</td>
                  <td className="px-4 py-3 text-[#526157]">{productCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={cat.ativo ? "default" : "secondary"} className={cat.ativo ? "bg-green-100 text-green-700" : ""}>
                      {cat.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#8c9c91]">{formatDate(cat.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Link href={`/admin/categorias/${cat.id}`}>
                        <Button size="sm" variant="outline"><Pencil className="h-3 w-3" /></Button>
                      </Link>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => setConfirmDelete({ id: cat.id, name: cat.name, productCount })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-md mx-4 rounded-xl border border-[#dfe7dd] bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#102016]">Excluir categoria</h3>
                <p className="text-sm text-[#526157]">Esta ação não pode ser desfeita.</p>
              </div>
              <button onClick={() => setConfirmDelete(null)} className="ml-auto p-1 rounded hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-[#102016] mb-1 font-medium">Tem certeza que deseja excluir &ldquo;{confirmDelete.name}&rdquo;?</p>
            {confirmDelete.productCount > 0 && (
              <p className="text-sm text-amber-600 mb-6">
                {confirmDelete.productCount} produto(s) perderão a referência a esta categoria.
              </p>
            )}
            {confirmDelete.productCount === 0 && (
              <p className="text-sm text-[#8c9c91] mb-6">Nenhum produto está vinculado a esta categoria.</p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete}>Excluir</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
