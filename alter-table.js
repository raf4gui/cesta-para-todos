const { Client } = require("pg");

const client = new Client({
  connectionString:
    "postgresql://postgres.lnntzdncmdpjiescgwwj:%21v%21jZ5CT87hJFbu@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
  connectionTimeoutMillis: 15000,
});

async function main() {
  await client.connect();
  console.log("Connected via pooler");

  await client.query(
    "ALTER TABLE basket_items ADD COLUMN IF NOT EXISTS available_sizes JSONB NOT NULL DEFAULT '[]'::jsonb"
  );
  console.log("Column available_sizes: OK");

  await client.query(
    "ALTER TABLE basket_items ADD COLUMN IF NOT EXISTS available_quantities JSONB NOT NULL DEFAULT '[]'::jsonb"
  );
  console.log("Column available_quantities: OK");

  await client.query("NOTIFY pgrst, 'reload schema'");
  console.log("Schema cache refreshed");

  await client.end();
  console.log("Done");
}
main().catch((e) => {
  console.error("Error:", e.message, e.code);
  process.exit(1);
});
