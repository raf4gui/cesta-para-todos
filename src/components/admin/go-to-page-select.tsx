"use client"

interface Props {
  totalPages: number
  currentPage: number
  baseQueryString: string
}

export function GoToPageSelect({ totalPages, currentPage, baseQueryString }: Props) {
  return (
    <form method="GET" className="flex items-center justify-end gap-2 text-sm">
      <span className="text-[#526157]">Ir para página:</span>
      <select
        defaultValue={currentPage}
        onChange={(e) => {
          const v = e.target.value
          const url = `/admin/clientes?${baseQueryString}${v !== "1" ? `&page=${v}` : ""}`
          window.location.href = url
        }}
        className="h-8 rounded-md border border-[#dfe7dd] px-2 text-sm"
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <option key={p} value={p}>
            Página {p}
          </option>
        ))}
      </select>
    </form>
  )
}
