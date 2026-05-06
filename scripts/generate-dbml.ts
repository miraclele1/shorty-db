import { config } from "dotenv";
config({ path: ".env.local" });

import { pgGenerate } from "drizzle-dbml-generator";
import * as schema from "../src/server/db/schema";

pgGenerate({ schema, out: "./schema.dbml", relational: true });

console.log("✅ schema.dbml generated successfully");