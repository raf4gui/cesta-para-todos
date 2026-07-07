<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UUID validation rule

Every optional UUID field (`brand_id`, `basket_id`, `chosen_brand_id`, etc.) MUST use the `optionalUuid()` helper from `@/lib/zod-helpers` — never inline `z.string().uuid().optional().nullable()` or `z.string().uuid().optional().or(z.literal(""))`. The helper preprocesses `""`, `"null"`, `undefined`, `null` → `null` before validation, preventing both Zod parse errors and DB insert failures.

Required UUID fields use plain `z.string().uuid("msg")`. Do NOT use `optionalUuid()` for required fields.

# Migration application rule

This project uses a **remote Supabase** instance (`supabase.co`). Local migration files are NOT automatically applied. After creating/modifying a migration file, you MUST apply it to the remote database using:

```
npx supabase db query --linked -f supabase/migrations/<filename>.sql
```

Then refresh the PostgREST schema cache:

```
npx supabase db query --linked "NOTIFY pgrst, 'reload schema';"
```

Without the schema cache refresh, Supabase's REST API (PostgREST) returns `"Could not find the table 'public.<table>' in the schema cache"` even though the table exists in PostgreSQL.
