import { and, avg, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
	content,
	shortFilmMeta,
	ratings,
	contentGenres,
	genres,
} from "@/server/db/schema";

export type ContentListItem = {
	id: string;
	slug: string;
	title: string;
	type: string;
	status: string;
	youtubeId: string;
	channelId: string;
	publishedAt: Date | null;
	createdAt: Date;
	director: string | null;
	runtimeSeconds: number | null;
	releaseYear: number | null;
	avgRating: number | null;
	ratingsCount: number;
	genres: string[];
};

export async function getContentList(): Promise<ContentListItem[]> {
	// Fetch base content rows
	const rows = await db
		.select({
			id: content.id,
			slug: content.slug,
			title: content.title,
			type: content.type,
			status: content.status,
			youtubeId: content.youtubeId,
			channelId: content.channelId,
			publishedAt: content.publishedAt,
			createdAt: content.createdAt,
			director: shortFilmMeta.director,
			runtimeSeconds: shortFilmMeta.runtimeSeconds,
			releaseYear: shortFilmMeta.releaseYear,
			avgRating: avg(ratings.score),
			ratingsCount: count(ratings.id),
		})
		.from(content)
		.leftJoin(shortFilmMeta, eq(shortFilmMeta.contentId, content.id))
		.leftJoin(ratings, eq(ratings.contentId, content.id))
		.groupBy(
			content.id,
			shortFilmMeta.contentId,
			shortFilmMeta.director,
			shortFilmMeta.runtimeSeconds,
			shortFilmMeta.releaseYear,
		)
		.orderBy(desc(content.createdAt));

	if (!rows.length) return [];

	// Fetch genres for each content
	const contentIds = rows.map((r) => r.id);
	const genreRows = await db
		.select({
			contentId: contentGenres.contentId,
			name: genres.name,
		})
		.from(contentGenres)
		.innerJoin(genres, eq(genres.id, contentGenres.genreId))
		.where(sql`${contentGenres.contentId} = ANY(${sql.raw(`ARRAY['${contentIds.join("','")}']::uuid[]`)})`);

	const genreMap = new Map<string, string[]>();
	for (const g of genreRows) {
		const list = genreMap.get(g.contentId) ?? [];
		list.push(g.name);
		genreMap.set(g.contentId, list);
	}

	return rows.map((r) => ({
		...r,
		avgRating: r.avgRating ? Math.round(Number(r.avgRating) * 10) / 10 : null,
		ratingsCount: Number(r.ratingsCount),
		genres: genreMap.get(r.id) ?? [],
	}));
}

export async function getFeaturedContent(
	limit = 6,
): Promise<ContentListItem[]> {
	const all = await getContentList();
	return all.slice(0, limit);
}

// ─── Single film by slug ───────────────────────────────────────────────────────

export type ContentDetail = ContentListItem & {
	synopsis: string | null;
	festival: string | null;
	userRating: number | null;
};

export async function getContentBySlug(
	slug: string,
	userId?: string,
): Promise<ContentDetail | null> {
	const rows = await db
		.select({
			id: content.id,
			slug: content.slug,
			title: content.title,
			type: content.type,
			status: content.status,
			youtubeId: content.youtubeId,
			channelId: content.channelId,
			publishedAt: content.publishedAt,
			createdAt: content.createdAt,
			director: shortFilmMeta.director,
			runtimeSeconds: shortFilmMeta.runtimeSeconds,
			releaseYear: shortFilmMeta.releaseYear,
			synopsis: shortFilmMeta.synopsis,
			festival: shortFilmMeta.festival,
			avgRating: avg(ratings.score),
			ratingsCount: count(ratings.id),
		})
		.from(content)
		.leftJoin(shortFilmMeta, eq(shortFilmMeta.contentId, content.id))
		.leftJoin(ratings, eq(ratings.contentId, content.id))
		.where(eq(content.slug, slug))
		.groupBy(
			content.id,
			shortFilmMeta.contentId,
			shortFilmMeta.director,
			shortFilmMeta.runtimeSeconds,
			shortFilmMeta.releaseYear,
			shortFilmMeta.synopsis,
			shortFilmMeta.festival,
		)
		.limit(1);

	if (!rows.length) return null;
	const row = rows[0];

	// Fetch genres
	const genreRows = await db
		.select({ name: genres.name })
		.from(contentGenres)
		.innerJoin(genres, eq(genres.id, contentGenres.genreId))
		.where(eq(contentGenres.contentId, row.id));

	// Fetch current user's rating if logged in
	let userRating: number | null = null;
	if (userId) {
		const userRatingRows = await db
			.select({ score: ratings.score })
			.from(ratings)
			.where(and(eq(ratings.contentId, row.id), eq(ratings.userId, userId)))
			.limit(1);
		userRating = userRatingRows[0]?.score
			? Number(userRatingRows[0].score)
			: null;
	}

	return {
		...row,
		avgRating: row.avgRating ? Math.round(Number(row.avgRating) * 10) / 10 : null,
		ratingsCount: Number(row.ratingsCount),
		genres: genreRows.map((g) => g.name),
		synopsis: row.synopsis ?? null,
		festival: row.festival ?? null,
		userRating,
	};
}
