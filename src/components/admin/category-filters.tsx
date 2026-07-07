"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CategoryFiltersProps {
  initialSearch: string;
  initialSort: string;
  initialActive: string;
}

export default function CategoryFilters({ initialSearch, initialSort, initialActive }: CategoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (value) params.set(key, value);
      else params.delete(key);
      params.set("page", "1");
      startTransition(() => router.push(`/admin/categorias?${params.toString()}`));
    },
    [router, searchParams],
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Input
        placeholder="Buscar categoria..."
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          updateParams("search", event.target.value);
        }}
        className="max-w-xs"
        disabled={isPending}
      />

      <Select value={initialActive} onValueChange={(value) => updateParams("active", value === "all" ? "" : (value || ""))}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Ativo</SelectItem>
          <SelectItem value="false">Inativo</SelectItem>
        </SelectContent>
      </Select>

      <Select value={initialSort} onValueChange={(value) => updateParams("sort", value || "")}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at_desc">Mais recentes</SelectItem>
          <SelectItem value="created_at_asc">Mais antigas</SelectItem>
          <SelectItem value="name_asc">Nome A-Z</SelectItem>
          <SelectItem value="name_desc">Nome Z-A</SelectItem>
        </SelectContent>
      </Select>

      {isPending && <span className="text-sm text-muted-foreground animate-pulse">Filtrando...</span>}
    </div>
  );
}
