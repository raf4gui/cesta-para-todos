import { Suspense } from "react";
import BrandTable from "@/components/admin/brand-table";
import BrandFilters from "@/components/admin/brand-filters";
import { listBrands } from "@/app/admin/marcas/actions";
import { Loading } from "@/app/admin/marcas/loading";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MarcasPage({ searchParams }: { searchParams?: Promise<{ page?: string; search?: string; sort?: string; active?: string }> }) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = params?.search ?? "";
  const sort = params?.sort ?? "name_asc";
  const active = params?.active ?? "";

  const { data: brands, total } = await listBrands({ page, search, sort, active });

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Marcas</h1>
          <p className="text-sm text-[#526157]">{total} marcas</p>
        </div>
        <Link href="/admin/marcas/nova">
          <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">
            <Plus className="h-4 w-4 mr-2" />
            Nova Marca
          </Button>
        </Link>
      </div>

      <BrandFilters initialSearch={search} initialSort={sort} initialActive={active} />

      <Suspense fallback={<Loading />}>
        <BrandTable brands={brands} />
      </Suspense>
    </section>
  );
}
