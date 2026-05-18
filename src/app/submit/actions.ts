"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import {
	content,
	shortFilmMeta,
	genres,
	contentGenres,
} from "@/server/db/schema";
import { env } from "@/env";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
	const match = url
		.trim()
		.match(
			/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
		);
	return match?.[1] ?? null;
}

function parseDuration(iso: string): number {
	const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return 0;
	return (
		Number.parseInt(match[1] ?? "0") * 3600 +
		Number.parseInt(match[2] ?? "0") * 60 +
		Number.parseInt(match[3] ?? "0")
	);
}

function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

// ─── fetchYouTubeMetadata ─────────────────────────────────────────────────────

export type YouTubeMeta = {
	youtubeId: string;
	title: string;
	channelId: string;
	channelTitle: string;
	publishedAt: string;
	durationSeconds: number;
	thumbnailUrl: string;
};

type FetchResult = YouTubeMeta | { error: string };

export async function fetchYouTubeMetadata(url: string): Promise<FetchResult> {
	const youtubeId = extractYouTubeId(url);
	if (!youtubeId)
		return {
			error: "Geçersiz YouTube URL'i. Örnek: https://youtube.com/watch?v=...",
		};

	const res = await fetch(
		`https://www.googleapis.com/youtube/v3/videos?id=${youtubeId}&part=snippet,contentDetails&key=${env.YOUTUBE_API_KEY}`,
		{ next: { revalidate: 0 } },
	);

	if (!res.ok) return { error: "YouTube API isteği başarısız oldu." };

	const data = await res.json();
	if (!data.items?.length)
		return { error: "Video bulunamadı. URL'i kontrol edin." };

	const item = data.items[0];
	const thumbs = item.snippet.thumbnails;

	return {
		youtubeId,
		title: item.snippet.title,
		channelId: item.snippet.channelId,
		channelTitle: item.snippet.channelTitle,
		publishedAt: item.snippet.publishedAt,
		durationSeconds: parseDuration(item.contentDetails.duration),
		thumbnailUrl:
			thumbs?.maxres?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? "",
	};
}

// ─── submitFilm ───────────────────────────────────────────────────────────────

export type SubmitData = YouTubeMeta & {
	type: "short_film" | "music_video" | "trailer" | "stream";
	director: string;
	synopsis: string;
	festival: string;
	selectedGenres: string[];
};

type SubmitResult = { slug: string } | { error: string };

export async function submitFilm(data: SubmitData): Promise<SubmitResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user)
		return { error: "Film göndermek için giriş yapmanız gerekiyor." };

	// Check for duplicate youtube_id
	const existing = await db
		.select({ id: content.id })
		.from(content)
		.where(eq(content.youtubeId, data.youtubeId));
	if (existing.length) return { error: "Bu film zaten veritabanında mevcut." };

	// Generate unique slug
	const baseSlug = slugify(data.title) || data.youtubeId;
	const slugConflict = await db
		.select({ id: content.id })
		.from(content)
		.where(eq(content.slug, baseSlug));
	const slug = slugConflict.length
		? `${baseSlug}-${data.youtubeId.slice(0, 4)}`
		: baseSlug;

	// Insert content row
	const [newContent] = await db
		.insert(content)
		.values({
			type: data.type,
			slug,
			title: data.title,
			youtubeId: data.youtubeId,
			channelId: data.channelId,
			publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
			addedBy: session.user.id,
			status: "pending",
		})
		.returning();

	// Insert short_film_meta for short films
	if (data.type === "short_film") {
		const releaseYear = data.publishedAt
			? new Date(data.publishedAt).getFullYear()
			: null;
		await db.insert(shortFilmMeta).values({
			contentId: newContent.id,
			director: data.director || null,
			runtimeSeconds: data.durationSeconds || null,
			releaseYear,
			synopsis: data.synopsis || null,
			festival: data.festival || null,
		});
	}

	// Upsert genres and link to content
	for (const genreName of data.selectedGenres) {
		const genreSlug = slugify(genreName);
		const [genre] = await db
			.insert(genres)
			.values({ slug: genreSlug, name: genreName })
			.onConflictDoUpdate({ target: genres.slug, set: { name: genreName } })
			.returning();
		await db
			.insert(contentGenres)
			.values({ contentId: newContent.id, genreId: genre.id })
			.onConflictDoNothing();
	}

	return { slug };
}
