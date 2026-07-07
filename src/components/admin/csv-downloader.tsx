"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface CSVDownloaderProps {
  data: Array<{ name?: string; stock?: number; category?: string | null }>
  filename: string
}

export function CSVDownloader({ data, filename }: CSVDownloaderProps) {
  const handleDownload = () => {
    if (data.length === 0) return

    // Extract headers
    const headers = ["Nome", "Estoque", "Categoria"]
    const rows = data.map((item) => [
      item.name,
      item.stock,
      item.category || "Sem categoria"
    ])

    // Generate CSV content with BOM for Excel compatibility
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.map((val) => `"${val}"`).join(";"))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button size="sm" variant="outline" className="h-8 border-[#dfe7dd] text-[#526157]" onClick={handleDownload}>
      <Download className="h-3.5 w-3.5 mr-2" />
      Exportar CSV
    </Button>
  )
}
