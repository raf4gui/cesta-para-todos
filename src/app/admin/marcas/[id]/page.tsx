import BrandForm from "@/components/admin/brand-form";
import { getBrand } from "@/app/admin/marcas/actions";
import { notFound } from "next/navigation";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let brand;
  try {
    brand = await getBrand(id);
  } catch {
    notFound();
  }

  if (!brand) notFound();

  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Editar Marca</h1>
      <BrandForm initialData={{ id: brand.id, name: brand.name, description: brand.description, logo: brand.logo, ativo: brand.ativo }} />
    </section>
  );
}
