"use server";

import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { ratings } from "@/server/db/schema";

export async function submitRating(
	contentId: string,
	slug: string,
	score: number,
): Promise<{ success: true } | { error: string }> {
	if (score < 1 || score > 10) return { error: "Puan 1-10 arasında olmalı." };

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { error: "Puan vermek için giriş yapmalısın." };

	await db
		.insert(ratings)
		.values({
			contentId,
			userId: session.user.id,
			score: score.toFixed(1),
		})
		.onConflictDoUpdate({
			target: [ratings.contentId, ratings.userId],
			set: { score: score.toFixed(1) },
		});

	revalidatePath(`/films/${slug}`);
	return { success: true };
}
