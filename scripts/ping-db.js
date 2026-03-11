import pg from "pg";
const { Client } = pg;

console.log("▶ ping-db starting...");

async function main() {
  const url = process.env.DATABASE_URL;
  console.log("DATABASE_URL loaded?", Boolean(url));

  if (!url) {
    console.error("❌ Missing DATABASE_URL. Run with: node --env-file=.env scripts/ping-db.js");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });

  try {
    console.log("⏳ Connecting...");
    await client.connect();

    console.log("⏳ Running query...");
    const res = await client.query("SELECT NOW() as now");

    console.log("✅ Connected to Postgres");
    console.log("Time:", res.rows[0].now);
  } catch (err) {
    console.error("❌ DB connection failed:");
    console.error(err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
    console.log("▶ ping-db done.");
  }
}

main();