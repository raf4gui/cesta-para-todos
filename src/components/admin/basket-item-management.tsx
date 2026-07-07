"use client"
import { useEffect, useState } from "react";
import { useFieldArray, Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { listAllProducts, listAllBrands } from "@/app/admin/cestas/actions";
import type { BasketFormValues } from "@/components/admin/basket-form";

interface ProductOption {
  id: string;
  name: string;
  brand_id?: string;
  brand_name?: string;
}

interface BrandOption {
  id: string;
  name: string;
}

export function BasketItemManagement({
  control,
  setValue,
  watch,
}: {
  control: Control<BasketFormValues>;
  setValue: UseFormSetValue<BasketFormValues>;
  watch: UseFormWatch<BasketFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);

  useEffect(() => {
    async function fetchData() {
      const prods = await listAllProducts();
      setProducts(prods);
      const brs = await listAllBrands();
      setBrands(brs);
    }
    fetchData();
  }, []);

  const handleAddItem = () => {
    append({ product_id: "", quantity: 1, is_customizable: false, allowed_brand_ids: [] });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Itens da Cesta</h3>
      {fields.map((field, index) => {
        const selectedProductId = watch(`items.${index}.product_id`) ?? "";
        const product = products.find((p) => p.id === selectedProductId);
        const isCustomizable = watch(`items.${index}.is_customizable`);
        const availableBrands = product?.brand_id ? [brands.find((b) => b.id === product.brand_id)].filter(Boolean) : brands;
        return (
          <div key={field.id} className="border p-4 rounded-md space-y-2">
            <div className="flex items-center space-x-2">
              <Select
                value={selectedProductId}
                onValueChange={(v) => {
                  if (v) setValue(`items.${index}.product_id`, v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.brand_name ? `(${p.brand_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={watch(`items.${index}.quantity`)}
                onChange={(e) => setValue(`items.${index}.quantity`, parseInt(e.target.value, 10) || 1)}
                className="w-20"
              />
              <Switch
                checked={isCustomizable}
                onCheckedChange={(v) => setValue(`items.${index}.is_customizable`, v)}
              />
              <span className="text-sm">Personalizável</span>
              <Button variant="destructive" size="icon" onClick={() => remove(index)}>
                X
              </Button>
            </div>
            {isCustomizable && (
              <div className="mt-2 space-y-1">
                <label className="block text-sm font-medium text-muted-foreground">Marcas Permitidas</label>
                {availableBrands.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhuma marca cadastrada ou ativa.</p>
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1 border p-3 rounded-lg bg-muted/10">
                    {availableBrands.map((b) => {
                      if (!b) return null;
                      const currentBrands = watch(`items.${index}.allowed_brand_ids`) ?? [];
                      const isChecked = currentBrands.includes(b.id);
                      return (
                        <label key={b.id} className="flex items-center space-x-2 text-sm cursor-pointer p-1.5 hover:bg-muted/40 rounded-md transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setValue(`items.${index}.allowed_brand_ids`, [...currentBrands, b.id]);
                              } else {
                                setValue(`items.${index}.allowed_brand_ids`, currentBrands.filter((id: string) => id !== b.id));
                              }
                            }}
                            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className="font-medium text-foreground">{b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <Button type="button" onClick={handleAddItem} className="bg-[#006B2E] text-white hover:bg-[#005324]">
        Adicionar Item
      </Button>
    </div>
  );
}
