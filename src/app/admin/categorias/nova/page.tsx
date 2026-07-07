import CategoryForm from "@/components/admin/category-form";

export default function NovaCategoriaPage() {
  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Categoria</h1>
        <p className="text-sm text-muted-foreground">Cadastre categorias usadas em produtos, cestas, fardos e kits.</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <CategoryForm />
      </div>
    </section>
  );
}
