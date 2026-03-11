import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL in environment");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default {
  query: (text, params) => pool.query(text, params),
};