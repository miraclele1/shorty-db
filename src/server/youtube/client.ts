import { env } from "@/env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type YouTubeVideoData = {
	id: string;
	title: string;
	description: string;
	channelId: string;
	channelTitle: string;
	publishedAt: string; // ISO 8601 datetime
	duration: string; // ISO 8601 duration, e.g. "PT5M30S"
	durationSeconds: number;
	thumbnails: {
		default: string;
		medium: string;
		high: string;
		maxres?: string;
	};
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class YouTubeVideoNotFoundError extends Error {
	constructor(videoId: string) {
		super(`YouTube video not found: ${videoId}`);
		this.name = "YouTubeVideoNotFoundError";
	}
}

export class YouTubeVideoUnavailableError extends Error {
	constructor(videoId: string) {
		super(`YouTube video is private or unavailable: ${videoId}`);
		this.name = "YouTubeVideoUnavailableError";
	}
}

export class YouTubeQuotaExceededError extends Error {
	constructor() {
		super("YouTube API quota exceeded");
		this.name = "YouTubeQuotaExceededError";
	}
}

export class YouTubeAPIError extends Error {
	constructor(
		message: string,
		public readonly status: number,
	) {
		super(`YouTube API error (${status}): ${message}`);
		this.name = "YouTubeAPIError";
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extracts an 11-character video ID from any common YouTube URL format. */
export function extractVideoId(url: string): string | null {
	const patterns = [
		/youtu\.be\/([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
	];
	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match?.[1]) return match[1];
	}
	return null;
}

/** Converts an ISO 8601 duration string (e.g. "PT1H5M30S") to seconds. */
function parseDuration(iso: string): number {
	const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return 0;
	const hours = parseInt(match[1] ?? "0", 10);
	const minutes = parseInt(match[2] ?? "0", 10);
	const seconds = parseInt(match[3] ?? "0", 10);
	return hours * 3600 + minutes * 60 + seconds;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Fetches video metadata from YouTube Data API v3.
 *
 * Throws typed errors for quota exceeded, not found, and private/unavailable
 * videos — callers should handle these explicitly.
 */
export async function getVideoById(videoId: string): Promise<YouTubeVideoData> {
	const url = new URL("https://www.googleapis.com/youtube/v3/videos");
	url.searchParams.set("part", "snippet,contentDetails");
	url.searchParams.set("id", videoId);
	url.searchParams.set("key", env.YOUTUBE_API_KEY);

	const res = await fetch(url.toString());

	if (!res.ok) {
		const body = await res.json().catch(() => ({})) as {
			error?: { message?: string; errors?: { reason?: string }[] };
		};

		if (res.status === 403) {
			const reason = body.error?.errors?.[0]?.reason;
			if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
				throw new YouTubeQuotaExceededError();
			}
		}

		throw new YouTubeAPIError(
			body.error?.message ?? res.statusText,
			res.status,
		);
	}

	const data = await res.json() as {
		items?: {
			id: string;
			snippet?: {
				title: string;
				description: string;
				channelId: string;
				channelTitle: string;
				publishedAt: string;
				thumbnails?: Record<string, { url: string }>;
			};
			contentDetails?: {
				duration: string;
			};
		}[];
	};

	if (!data.items || data.items.length === 0) {
		throw new YouTubeVideoNotFoundError(videoId);
	}

	const item = data.items[0];
	const snippet = item.snippet;
	const contentDetails = item.contentDetails;

	if (!snippet || !contentDetails) {
		throw new YouTubeVideoUnavailableError(videoId);
	}

	const t = snippet.thumbnails ?? {};

	return {
		id: item.id,
		title: snippet.title,
		description: snippet.description,
		channelId: snippet.channelId,
		channelTitle: snippet.channelTitle,
		publishedAt: snippet.publishedAt,
		duration: contentDetails.duration,
		durationSeconds: parseDuration(contentDetails.duration),
		thumbnails: {
			default: t.default?.url ?? "",
			medium: t.medium?.url ?? "",
			high: t.high?.url ?? "",
			...(t.maxres ? { maxres: t.maxres.url } : {}),
		},
	};
}
