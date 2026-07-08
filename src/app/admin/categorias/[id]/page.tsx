import { notFound } from "next/navigation";
import CategoryForm from "@/components/admin/category-form";
import { getCategory } from "@/app/admin/categorias/actions";

export default async function EditarCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let category;

  try {
    category = await getCategory(id);
  } catch {
    notFound();
  }

  if (!category) notFound();

  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Categoria</h1>
        <p className="text-sm text-muted-foreground">Atualize nome e status da categoria.</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <CategoryForm initialData={category} />
      </div>
    </section>
  );
}
