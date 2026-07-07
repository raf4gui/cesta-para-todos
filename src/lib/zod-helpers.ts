import { z } from "zod"

const preprocessOptionalUuid = (v: unknown) => {
  if (v === "" || v === "null" || v === undefined || v === null) return null
  return v
}

const preprocessRequiredUuid = (v: unknown) => {
  if (v === "" || v === "null") return undefined
  return v
}

export function optionalUuid() {
  return z.preprocess(preprocessOptionalUuid, z.string().uuid().nullable().optional())
}

export function requiredUuid(msg?: string) {
  return z.preprocess(preprocessRequiredUuid, z.string().uuid(msg))
}

export function cleanOptionalUuid(v: unknown): string | null {
  if (v === "" || v === "null" || v === undefined || v === null) return null
  if (typeof v === "string") return v
  return null
}

export function normalizePhone(phone: string): string {
  const cleaned = (phone || "").replace(/\D/g, "")
  if (!cleaned) throw new Error("Telefone inválido após limpeza.")
  return cleaned
}

export function normalizePhoneSafe(phone: string): string {
  return (phone || "").replace(/\D/g, "")
}
