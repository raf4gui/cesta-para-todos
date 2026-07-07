import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  total: number
  page: number
  pageSize: number
  buildUrl: (page: number) => string
}

export function Pagination({ total, page, pageSize, buildUrl }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const pages: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <span className="text-sm text-[#526157]">{total} registro{total !== 1 ? "s" : ""}</span>
      <nav className="flex items-center gap-1" aria-label="Paginação">
        {page > 1 ? (
          <Link href={buildUrl(page - 1)} className="flex items-center gap-1 rounded-lg border border-[#dfe7dd] px-2.5 py-1.5 text-sm text-[#526157] hover:bg-gray-50 hover:text-[#102016] transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border border-transparent px-2.5 py-1.5 text-sm text-[#c8d6c4] cursor-not-allowed">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </span>
        )}

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-sm text-[#8c9c91]">...</span>
          ) : (
            <Link
              key={p}
              href={buildUrl(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                p === page
                  ? "bg-[#006B2E] text-white"
                  : "text-[#526157] hover:bg-gray-50 border border-[#dfe7dd]"
              }`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Link>
          )
        )}

        {page < totalPages ? (
          <Link href={buildUrl(page + 1)} className="flex items-center gap-1 rounded-lg border border-[#dfe7dd] px-2.5 py-1.5 text-sm text-[#526157] hover:bg-gray-50 hover:text-[#102016] transition-colors">
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border border-transparent px-2.5 py-1.5 text-sm text-[#c8d6c4] cursor-not-allowed">
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </nav>
    </div>
  )
}
