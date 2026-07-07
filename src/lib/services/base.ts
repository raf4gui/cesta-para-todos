export interface ListParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
}

export interface ListResult<T> {
  data: T[]
  total: number
  pageSize: number
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("pt-BR")
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("pt-BR")
}

export function parseSortParam(sort: string, defaultSort: string): { column: string; ascending: boolean } {
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    created_at_desc: { column: "created_at", ascending: false },
    created_at_asc: { column: "created_at", ascending: true },
    name_asc: { column: "name", ascending: true },
    name_desc: { column: "name", ascending: false },
  }
  return sortMap[sort] ?? sortMap[defaultSort] ?? { column: "created_at", ascending: false }
}

export type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}
