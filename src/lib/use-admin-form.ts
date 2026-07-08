"use client"

import { useForm, type FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCallback, useMemo, useState } from "react"

type AdminFormOptions<T extends FieldValues> = {
  schema: z.ZodType<T>
  defaultValues: T
  initialData?: Partial<T> & { id?: string }
  onUpdate?: (id: string, data: Partial<T>) => Promise<void>
  onCreate?: (data: T) => Promise<void>
}

function cleanNulls<T extends Record<string, unknown>>(obj: T | undefined | null): Partial<T> {
  if (!obj) return {}
  const result = { ...obj }
  for (const key of Object.keys(result)) {
    if (result[key] === null) {
      ;(result as Record<string, unknown>)[key] = ""
    }
  }
  return result
}

export function useAdminForm<T extends FieldValues>({
  schema,
  defaultValues: rawDefaults,
  initialData,
  onUpdate,
  onCreate,
}: AdminFormOptions<T>) {
  const isEditing = !!initialData?.id || (!onCreate && !!onUpdate)
  const [submitting, setSubmitting] = useState(false)
  const [validationSummary, setValidationSummary] = useState<string | null>(null)

  const safeDefaults = useMemo(() => {
    const merged = { ...rawDefaults, ...cleanNulls(initialData) }
    return merged as unknown as T
  }, [rawDefaults, initialData])

  const resolver = useMemo(() => {
    const s = isEditing ? (schema as any).partial() : schema
    return zodResolver(s as any) as any
  }, [schema, isEditing])

  const {
    formState: { errors },
    setError,
    clearErrors,
    getValues,
    reset,
    register,
    control,
    watch,
    setValue,
    trigger,
  } = useForm<T>({
    resolver,
    defaultValues: safeDefaults as any,
  })

  const submit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      if (e) e.preventDefault()
      if (submitting) return

      setSubmitting(true)
      setValidationSummary(null)
      clearErrors()

      try {
        const data = getValues()

        if (isEditing && onUpdate) {
          await onUpdate(initialData?.id ?? "singleton", data as Partial<T>)
        } else if (!isEditing && onCreate) {
          const isValid = await trigger()
          if (!isValid) return
          await onCreate(getValues() as T)
        }
      } catch (error: any) {
        console.error("Erro no salvamento do formulário:", error)
        setValidationSummary(error?.message || "Erro inesperado ao salvar. Tente novamente.")
      } finally {
        setSubmitting(false)
      }
    },
    [isEditing, submitting, trigger, getValues, onUpdate, onCreate, initialData],
  )

  const dirtySetValue = useCallback(
    (name: any, value: any, options?: any) => {
      setValue(name, value, { shouldDirty: true, ...options })
    },
    [setValue],
  )

  return {
    register,
    control,
    watch,
    setValue: dirtySetValue,
    reset,
    trigger,
    errors,
    isSubmitting: submitting,
    isEditing,
    submit,
    validationSummary,
    setValidationSummary,
  }
}
