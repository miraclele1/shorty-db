"use client";

import { useState } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
	fetchYouTubeMetadata,
	submitFilm,
	type YouTubeMeta,
} from "./actions";

const GENRES = [
	"Sci-Fi",
	"Drama",
	"Horror",
	"Comedy",
	"Animation",
	"Documentary",
	"Thriller",
	"Romance",
	"Action",
	"Fantasy",
	"Mystery",
	"Noir",
];

const CONTENT_TYPES = [
	{ value: "short_film", label: "Short Film" },
	{ value: "music_video", label: "Music Video" },
	{ value: "trailer", label: "Trailer" },
	{ value: "stream", label: "Stream" },
] as const;

function formatDuration(seconds: number): string {
	if (!seconds) return "—";
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function SubmitPage() {
	const [url, setUrl] = useState("");
	const [isFetching, setIsFetching] = useState(false);
	const [fetchError, setFetchError] = useState("");
	const [meta, setMeta] = useState<YouTubeMeta | null>(null);

	const [type, setType] =
		useState<"short_film" | "music_video" | "trailer" | "stream">(
			"short_film",
		);
	const [director, setDirector] = useState("");
	const [synopsis, setSynopsis] = useState("");
	const [festival, setFestival] = useState("");
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const [submittedSlug, setSubmittedSlug] = useState<string | null>(null);

	const handleFetch = async () => {
		if (!url.trim()) return;
		setFetchError("");
		setMeta(null);
		setIsFetching(true);
		try {
			const result = await fetchYouTubeMetadata(url);
			if ("error" in result) {
				setFetchError(result.error);
			} else {
				setMeta(result);
				setDirector("");
				setSynopsis("");
				setFestival("");
				setSelectedGenres([]);
			}
		} finally {
			setIsFetching(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!meta) return;
		setSubmitError("");
		setIsSubmitting(true);
		try {
			const result = await submitFilm({
				...meta,
				type,
				director,
				synopsis,
				festival,
				selectedGenres,
			});
			if ("error" in result) {
				setSubmitError(result.error);
			} else {
				setSubmittedSlug(result.slug);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const toggleGenre = (g: string) => {
		setSelectedGenres((prev) =>
			prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
		);
	};

	const reset = () => {
		setUrl("");
		setMeta(null);
		setFetchError("");
		setSubmitError("");
		setSubmittedSlug(null);
		setDirector("");
		setSynopsis("");
		setFestival("");
		setSelectedGenres([]);
		setType("short_film");
	};

	// ── Success screen ─────────────────────────────────────────────────────────
	if (submittedSlug) {
		return (
			<main className="mx-auto max-w-lg px-4 py-24 text-center">
				<div className="mb-6 text-6xl">🎬</div>
				<h1 className="mb-2 text-2xl font-bold text-white">
					Film gönderildi!
				</h1>
				<p className="mb-8 text-neutral-400">
					İnceleme sürecinde. Onaylandıktan sonra listede görünecek.
				</p>
				<div className="flex justify-center gap-3">
					<Link
						href={`/films/${submittedSlug}`}
						className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90"
					>
						Filme Git
					</Link>
					<button
						type="button"
						onClick={reset}
						className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/8"
					>
						Başka Film Ekle
					</button>
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-2xl px-4 pb-20 pt-10">
			{/* Page header */}
			<div className="mb-10">
				<h1 className="text-3xl font-bold text-white">Film Gönder</h1>
				<p className="mt-2 text-neutral-400">
					Bir YouTube linki yapıştır, metadata otomatik gelsin.
				</p>
			</div>

			{/* ── Step 1: URL input ─────────────────────────────────────────── */}
			<div className="mb-8">
				<label className="mb-2 block text-sm font-medium text-neutral-300">
					YouTube URL
				</label>
				<div className="flex gap-2">
					<input
						type="url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleFetch()}
						placeholder="https://youtube.com/watch?v=..."
						className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-neutral-600 outline-none ring-0 transition focus:border-white/25 focus:bg-white/8"
					/>
					<button
						type="button"
						onClick={handleFetch}
						disabled={isFetching || !url.trim()}
						className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
					>
						{isFetching ? "Çekiliyor…" : "Metadata Getir"}
					</button>
				</div>
				{fetchError && (
					<p className="mt-2 text-sm text-red-400">{fetchError}</p>
				)}
			</div>

			{/* ── Step 2: Preview + form ────────────────────────────────────── */}
			{meta && (
				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Video preview card */}
					<div className="flex gap-4 rounded-xl border border-white/8 bg-white/3 p-4">
						<img
							src={meta.thumbnailUrl || `https://img.youtube.com/vi/${meta.youtubeId}/mqdefault.jpg`}
							alt={meta.title}
							className="h-24 w-40 shrink-0 rounded-lg object-cover"
						/>
						<div className="flex flex-col gap-1 min-w-0">
							<p className="font-semibold text-white leading-snug line-clamp-2">
								{meta.title}
							</p>
							<p className="text-sm text-neutral-400">{meta.channelTitle}</p>
							<p className="text-xs text-neutral-500">
								{new Date(meta.publishedAt).getFullYear()} ·{" "}
								{formatDuration(meta.durationSeconds)}
							</p>
						</div>
					</div>

					{/* Content type */}
					<div>
						<label className="mb-3 block text-sm font-medium text-neutral-300">
							İçerik Türü
						</label>
						<div className="flex flex-wrap gap-2">
							{CONTENT_TYPES.map((ct) => (
								<button
									key={ct.value}
									type="button"
									onClick={() => setType(ct.value)}
									className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
										type === ct.value
											? "bg-white text-black"
											: "border border-white/10 text-neutral-400 hover:border-white/25 hover:text-white"
									}`}
								>
									{ct.label}
								</button>
							))}
						</div>
					</div>

					{/* Genres */}
					<div>
						<label className="mb-3 block text-sm font-medium text-neutral-300">
							Türler{" "}
							<span className="text-neutral-500 font-normal">(birden fazla seçebilirsin)</span>
						</label>
						<div className="flex flex-wrap gap-2">
							{GENRES.map((g) => (
								<button
									key={g}
									type="button"
									onClick={() => toggleGenre(g)}
									className={`rounded-full px-3 py-1 text-sm transition-all ${
										selectedGenres.includes(g)
											? "bg-yellow-400 text-black font-medium"
											: "border border-white/10 text-neutral-400 hover:border-white/25 hover:text-white"
									}`}
								>
									{g}
								</button>
							))}
						</div>
					</div>

					{/* Director */}
					{type === "short_film" && (
						<div className="grid gap-6 sm:grid-cols-2">
							<div>
								<label className="mb-2 block text-sm font-medium text-neutral-300">
									Yönetmen
								</label>
								<input
									type="text"
									value={director}
									onChange={(e) => setDirector(e.target.value)}
									placeholder="Chris Marker"
									className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-neutral-600 outline-none transition focus:border-white/25 focus:bg-white/8"
								/>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium text-neutral-300">
									Festival{" "}
									<span className="text-neutral-500 font-normal">(opsiyonel)</span>
								</label>
								<input
									type="text"
									value={festival}
									onChange={(e) => setFestival(e.target.value)}
									placeholder="Cannes, Sundance…"
									className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-neutral-600 outline-none transition focus:border-white/25 focus:bg-white/8"
								/>
							</div>
						</div>
					)}

					{/* Synopsis */}
					{type === "short_film" && (
						<div>
							<label className="mb-2 block text-sm font-medium text-neutral-300">
								Özet{" "}
								<span className="text-neutral-500 font-normal">(opsiyonel)</span>
							</label>
							<textarea
								value={synopsis}
								onChange={(e) => setSynopsis(e.target.value)}
								rows={3}
								placeholder="Filmin konusu hakkında kısa bir açıklama…"
								className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-neutral-600 outline-none transition focus:border-white/25 focus:bg-white/8 resize-none"
							/>
						</div>
					)}

					{/* Submit */}
					{submitError && (
						<p className="text-sm text-red-400">{submitError}</p>
					)}

					<div className="flex items-center gap-4 pt-2">
						<button
							type="submit"
							disabled={isSubmitting}
							className="rounded-lg bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
						>
							{isSubmitting ? "Gönderiliyor…" : "Filmi Gönder"}
						</button>
						<p className="text-xs text-neutral-500">
							Gönderilen filmler moderasyon sonrası yayınlanır.
						</p>
					</div>
				</form>
			)}
		</main>
	);
}
