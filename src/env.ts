import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Runtime-validated environment variables.
 *
 * Add new env vars here AND in .env.example. Do not access process.env
 * directly anywhere else in the codebase — always import from `@/env`.
 */
export const env = createEnv({
	server: {
		// Database
		DATABASE_URL: z.string().min(1),
		DATABASE_URL_UNPOOLED: z.string().min(1),

		// Auth
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.string().min(1),

		// OAuth
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),

		// Email
		RESEND_API_KEY: z.string().min(1),
		EMAIL_FROM: z.string().min(1),

		// External APIs
		YOUTUBE_API_KEY: z.string().min(1),
	},
	client: {
		NEXT_PUBLIC_APP_URL: z.string().min(1),
	},
	experimental__runtimeEnv: {
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
	},
	skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
	emptyStringAsUndefined: true,
});
