// One-off RLS audit: confirms every table in the `public` schema has RLS
// enabled and lists any policies. Run with:
//   pnpm exec tsx scripts/check-rls.ts
import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });

async function main() {
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    const pool = new Pool({ connectionString });

    const tables = await pool.query(
        `select tablename, rowsecurity
           from pg_tables
          where schemaname = 'public'
          order by tablename`,
    );
    console.table(tables.rows);

    const policies = await pool.query(
        `select tablename, policyname, cmd, roles::text
           from pg_policies
          where schemaname = 'public'
          order by tablename, policyname`,
    );
    console.table(policies.rows);

    const missing = tables.rows.filter((r) => !r.rowsecurity);
    if (missing.length > 0) {
        console.error(
            "Tables WITHOUT row level security:",
            missing.map((r) => r.tablename).join(", "),
        );
        process.exitCode = 1;
    } else {
        console.log("All public-schema tables have RLS enabled.");
    }

    await pool.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
