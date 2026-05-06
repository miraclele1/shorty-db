import type { Metadata } from "next";

// Hardcoded content for Phase 4 vertical slice.
// Real data will come from the database in Phase 5+.
const MOCK_FILM = {
	title: "La Jetée",
	slug: "la-jetee",
	director: "Chris Marker",
	year: 1962,
	runtime: 28,
	synopsis:
		"A story told in still images: a man haunted by a childhood memory is used in a post-nuclear-war experiment that sends him back and forward through time.",
	youtubeId: "dC1yHLp9bWA",
	genres: ["Sci-Fi", "Drama"],
	rating: 8.7,
	ratingsCount: 142,
};

export const metadata: Metadata = {
	title: `${MOCK_FILM.title} — ShortyDB`,
	description: MOCK_FILM.synopsis,
};

export default function FilmPage() {
	const film = MOCK_FILM;

	return (
		<main className="max-w-3xl mx-auto px-4 py-10">
			{/* Thumbnail */}
			<div className="aspect-video w-full bg-neutral-900 rounded-lg overflow-hidden mb-6">
				<img
					src={`https://img.youtube.com/vi/${film.youtubeId}/maxresdefault.jpg`}
					alt={film.title}
					className="w-full h-full object-cover"
				/>
			</div>

			{/* Header */}
			<div className="mb-4">
				<div className="flex items-start justify-between gap-4">
					<h1 className="text-3xl font-bold">{film.title}</h1>
					<div className="text-right shrink-0">
						<div className="text-2xl font-bold text-yellow-400">{film.rating}</div>
						<div className="text-sm text-neutral-400">{film.ratingsCount} ratings</div>
					</div>
				</div>
				<div className="mt-1 text-neutral-400 text-sm">
					Directed by {film.director} · {film.year} · {film.runtime} min
				</div>
			</div>

			{/* Genres */}
			<div className="flex gap-2 mb-6">
				{film.genres.map((genre) => (
					<span
						key={genre}
						className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300"
					>
						{genre}
					</span>
				))}
			</div>

			{/* Synopsis */}
			<p className="text-neutral-300 leading-relaxed mb-8">{film.synopsis}</p>

			{/* Watch on YouTube */}
			<a
				href={`https://www.youtube.com/watch?v=${film.youtubeId}`}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
			>
				Watch on YouTube
			</a>
		</main>
	);
}
