import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function missingVars(): string[] {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

function throwMissing(message: string): never {
  throw new Error(`Supabase: ${message}. Configure as variáveis de ambiente no Vercel (Settings → Environment Variables).`);
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as ReturnType<typeof createClient>, {
      get() {
        throwMissing(
          `ambiente não configurado (${missingVars().filter(v => v !== "SUPABASE_SERVICE_ROLE_KEY").join(", ")})`
        );
      },
    });

export function supabaseAdmin(key?: string) {
  const k = key || serviceRoleKey;
  if (!k || !supabaseUrl) {
    const m = missingVars();
    if (!k && !m.includes("SUPABASE_SERVICE_ROLE_KEY")) m.push("SUPABASE_SERVICE_ROLE_KEY");
    throwMissing(m.join(", "));
  }
  return createClient(supabaseUrl, k);
}
