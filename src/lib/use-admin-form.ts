"use client"

import { useForm, type Path, type FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCallback, useMemo } from "react"

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

function getDirtyValues<T extends Record<string, unknown>>(
  dirtyFields: Record<string, unknown>,
  allValues: T,
): Partial<T> {
  const dirty: Partial<T> = {}
  for (const key of Object.keys(dirtyFields)) {
    if (dirtyFields[key] === true) {
      ;(dirty as Record<string, unknown>)[key] = allValues[key]
    }
  }
  return dirty
}

export function useAdminForm<T extends FieldValues>({
  schema,
  defaultValues: rawDefaults,
  initialData,
  onUpdate,
  onCreate,
}: AdminFormOptions<T>) {
  const isEditing = !!initialData?.id || (!onCreate && !!onUpdate)

  // Merge defaults with cleaned initialData — null becomes empty string
  const safeDefaults = useMemo(() => {
    const merged = { ...rawDefaults, ...cleanNulls(initialData) }
    return merged as unknown as T
  }, [rawDefaults, initialData])

  const {
    formState: { dirtyFields, isSubmitting, errors },
    setError,
    clearErrors,
    getValues,
    handleSubmit: rhfHandleSubmit,
    reset,
    register,
    control,
    watch,
    setValue,
    trigger,
  } = useForm<T>({
    // No resolver on edit mode — we validate only dirty fields manually on submit
    resolver: isEditing ? undefined : zodResolver(schema as any) as any,
    defaultValues: safeDefaults as any,
  })

  const submit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      if (e) e.preventDefault()
      if (isSubmitting) return

      const data = getValues()

      if (isEditing && onUpdate) {
        // Edit mode: validate and send only dirty fields
        const changed = getDirtyValues(dirtyFields as Record<string, unknown>, data as unknown as Record<string, unknown>)

        if (Object.keys(changed).length === 0) return

        // Validate only changed fields against partial schema
        const result = (schema as unknown as z.ZodObject<any>).partial().safeParse(changed)
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
        // Create mode: validate everything
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
    },
    [isEditing, isSubmitting, getValues, dirtyFields, schema, setError, clearErrors, onUpdate, onCreate, initialData],
  )

  // Wrap setValue to always mark fields as dirty (so programmatic changes like image upload, tipo select are tracked)
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
    isSubmitting,
    isEditing,
    dirtyFields: dirtyFields as Record<string, unknown>,
    submit,
  }
}
