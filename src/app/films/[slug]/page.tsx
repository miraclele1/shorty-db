import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { getContentBySlug } from "@/server/db/queries/content";
import { RatingWidget } from "./rating-widget";

interface FilmPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: FilmPageProps): Promise<Metadata> {
	const { slug } = await params;
	const film = await getContentBySlug(slug);
	if (!film) return { title: "Film Bulunamadı" };
	return {
		title: film.title,
		description: film.synopsis ?? `${film.title} — ShortyDB`,
	};
}

export default async function FilmPage({ params }: FilmPageProps) {
	const { slug } = await params;

	// Get session to check login state and fetch user's existing rating
	const session = await auth.api.getSession({ headers: await headers() });
	const film = await getContentBySlug(slug, session?.user?.id);

	if (!film) notFound();

	const year = film.releaseYear ?? (film.publishedAt ? new Date(film.publishedAt).getFullYear() : null);
	const runtime = film.runtimeSeconds ? Math.round(film.runtimeSeconds / 60) : null;

	return (
		<main className="mx-auto max-w-3xl px-4 py-10">
			{/* Thumbnail */}
			<div className="aspect-video w-full bg-neutral-900 rounded-xl overflow-hidden mb-8">
				<img
					src={`https://img.youtube.com/vi/${film.youtubeId}/maxresdefault.jpg`}
					alt={film.title}
					className="w-full h-full object-cover"
				/>
			</div>

			<div className="grid gap-8 lg:grid-cols-[1fr_260px]">
				{/* Left: main info */}
				<div>
					{/* Status badge */}
					{film.status === "pending" && (
						<span className="mb-3 inline-block rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
							İncelemede — moderasyon bekliyor
						</span>
					)}

					{/* Title & rating */}
					<div className="flex items-start justify-between gap-4 mb-2">
						<h1 className="text-3xl font-bold text-white">{film.title}</h1>
						{film.avgRating ? (
							<div className="shrink-0 text-right">
								<div className="text-3xl font-bold text-yellow-400">{film.avgRating}</div>
								<div className="text-xs text-neutral-500">{film.ratingsCount} rating</div>
							</div>
						) : (
							<div className="shrink-0 text-right">
								<div className="text-sm text-neutral-600">Henüz puan yok</div>
							</div>
						)}
					</div>

					{/* Meta */}
					<p className="text-sm text-neutral-400 mb-4">
						{film.director && `Yön. ${film.director}`}
						{film.director && (year || runtime) && " · "}
						{year}
						{runtime && ` · ${runtime} dk`}
					</p>

					{/* Genres */}
					{film.genres.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-6">
							{film.genres.map((g) => (
								<span key={g} className="rounded px-2 py-0.5 text-xs font-medium bg-white/8 text-neutral-300">
									{g}
								</span>
							))}
						</div>
					)}

					{/* Synopsis */}
					{film.synopsis && (
						<p className="text-neutral-300 leading-relaxed mb-6">{film.synopsis}</p>
					)}

					{/* Festival */}
					{film.festival && (
						<p className="text-sm text-neutral-500 mb-6">
							🏆 {film.festival}
						</p>
					)}

					{/* Watch button */}
					<a
						href={`https://www.youtube.com/watch?v=${film.youtubeId}`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
					>
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
						</svg>
						YouTube'da İzle
					</a>
				</div>

				{/* Right: rating widget */}
				<div className="space-y-4">
					<RatingWidget
						contentId={film.id}
						slug={film.slug}
						userRating={film.userRating}
						isLoggedIn={!!session?.user}
					/>
				</div>
			</div>
		</main>
	);
}
