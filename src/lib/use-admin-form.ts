"use client"

import { useForm, type Path, type FieldValues } from "react-hook-form"
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

  const safeDefaults = useMemo(() => {
    const merged = { ...rawDefaults, ...cleanNulls(initialData) }
    return merged as unknown as T
  }, [rawDefaults, initialData])

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
    resolver: zodResolver(schema as any) as any,
    defaultValues: safeDefaults as any,
  })

  const submit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      if (e) e.preventDefault()
      if (submitting) return

      setSubmitting(true)
      try {
        const data = getValues()

        if (isEditing && onUpdate) {
          const result = (schema as unknown as z.ZodObject<any>).partial().safeParse(data)
          if (!result.success) {
            for (const issue of result.error.issues) {
              const path = issue.path[0] as Path<T>
              setError(path, { message: issue.message })
            }
            return
          }

          clearErrors()
          await onUpdate(initialData?.id ?? "singleton", result.data as Partial<T>)
        } else if (!isEditing && onCreate) {
          const result = (schema as unknown as z.ZodObject<any>).safeParse(data)
          if (!result.success) {
            for (const issue of result.error.issues) {
              const path = issue.path[0] as Path<T>
              setError(path, { message: issue.message })
            }
            return
          }

          clearErrors()
          await onCreate(result.data as T)
        }
      } finally {
        setSubmitting(false)
      }
    },
    [isEditing, submitting, getValues, schema, setError, clearErrors, onUpdate, onCreate, initialData],
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
  }
}
