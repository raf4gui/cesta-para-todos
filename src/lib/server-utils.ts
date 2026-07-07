import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export function getClient() {
  return supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export function revalidateAdmin(...paths: string[]) {
  for (const path of paths) {
    revalidatePath(path)
  }
}
