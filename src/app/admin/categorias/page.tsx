import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CategoryFilters from "@/components/admin/category-filters";
import CategoryTable from "@/components/admin/category-table";
import { listCategories } from "@/app/admin/categorias/actions";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; search?: string; sort?: string; active?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = params?.search ?? "";
  const sort = params?.sort ?? "name_asc";
  const active = params?.active ?? "";
  const { data: categories, total } = await listCategories({ page, search, sort, active });

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Categorias</h1>
          <p className="text-sm text-[#526157]">{total} categorias</p>
        </div>
        <Link href="/admin/categorias/nova">
          <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </Link>
      </div>

      <CategoryFilters initialSearch={search} initialSort={sort} initialActive={active} />

      <Suspense fallback={<div className="rounded-xl border bg-white p-8 text-sm text-[#8c9c91]">Carregando...</div>}>
        <CategoryTable categories={categories} />
      </Suspense>
    </section>
  );
}
