"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCallback, useState, useTransition } from "react";

interface BrandFiltersProps {
  initialSearch: string;
  initialSort: string;
  initialActive: string;
}

export default function BrandFilters({ initialSearch, initialSort, initialActive }: BrandFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      startTransition(() => {
        router.push(`/admin/marcas?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <Input
        placeholder="Buscar marca..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          updateParams("search", e.target.value);
        }}
        className="max-w-xs"
        disabled={isPending}
      />

      <Select
        value={initialActive}
        onValueChange={(v) => updateParams("active", v === "all" ? "" : v ?? "")}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Ativo</SelectItem>
          <SelectItem value="false">Inativo</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={initialSort}
        onValueChange={(v) => updateParams("sort", v ?? "")}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at_desc">Mais recentes</SelectItem>
          <SelectItem value="created_at_asc">Mais antigas</SelectItem>
          <SelectItem value="name_asc">Nome A–Z</SelectItem>
          <SelectItem value="name_desc">Nome Z–A</SelectItem>
        </SelectContent>
      </Select>

      {isPending && <span className="text-sm text-muted-foreground animate-pulse">Filtrando...</span>}
    </div>
  );
}
