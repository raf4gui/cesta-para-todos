"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRealtimeRefresh } from "@/lib/realtime-context"
import type { TableName } from "@/lib/realtime-context"

interface Props {
  tables: TableName[]
}

export function RealtimeRefresh({ tables }: Props) {
  const router = useRouter()
  const version = useRealtimeRefresh(...tables)

  useEffect(() => {
    if (version > 0) router.refresh()
  }, [version, router])

  return null
}
