import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/env";

/**
 * Drizzle client instance.
 *
 * Uses the pooled DATABASE_URL for application queries.
 * Migrations run via drizzle-kit and use DATABASE_URL_UNPOOLED (see drizzle.config.ts).
 */
const pool = new Pool({
	connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool);
