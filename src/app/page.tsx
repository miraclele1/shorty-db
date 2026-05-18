import Link from "next/link";
import type { Metadata } from "next";
import { getFeaturedContent } from "@/server/db/queries/content";
import type { ContentListItem } from "@/server/db/queries/content";

export const metadata: Metadata = {
  title: "ShortyDB — Discover Short Films",
  description:
    "Discover, rate, and review short films on YouTube. Letterboxd for shorts.",
};

const GENRES = [
  "Sci-Fi", "Drama", "Horror", "Comedy", "Animation",
  "Documentary", "Thriller", "Romance",
];

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
    </svg>
  );
}

function FilmCard({ film }: { film: ContentListItem }) {
  const year = film.releaseYear ?? (film.publishedAt ? new Date(film.publishedAt).getFullYear() : null);
  const runtime = film.runtimeSeconds ? Math.round(film.runtimeSeconds / 60) : null;

  return (
    <Link
      href={`/films/${film.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/3 transition-all hover:border-white/15 hover:bg-white/6"
    >
      <div className="relative aspect-video overflow-hidden bg-neutral-900">
        <img
          src={`https://img.youtube.com/vi/${film.youtubeId}/mqdefault.jpg`}
          alt={film.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {runtime && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {runtime} min
          </span>
        )}
        {film.status === "pending" && (
          <span className="absolute left-2 top-2 rounded bg-yellow-500/80 px-1.5 py-0.5 text-xs font-medium text-black backdrop-blur-sm">
            İncelemede
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug text-white transition-colors group-hover:text-yellow-400 line-clamp-2">
            {film.title}
          </h3>
          {film.avgRating ? (
            <div className="flex shrink-0 items-center gap-1 text-yellow-400">
              <StarIcon />
              <span className="text-sm font-bold">{film.avgRating}</span>
            </div>
          ) : (
            <span className="shrink-0 text-xs text-neutral-600">Puan yok</span>
          )}
        </div>

        <p className="text-xs text-neutral-400">
          {film.director ? `${film.director} · ` : ""}{year ?? ""}
        </p>

        {film.genres.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {film.genres.map((g) => (
              <span key={g} className="rounded px-1.5 py-0.5 text-xs font-medium bg-white/8 text-neutral-300">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const films = await getFeaturedContent(6);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20">
      {/* Hero */}
      <section className="flex flex-col items-center py-20 text-center">
        <div className="mb-4 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-400">
          MVP · Open Beta
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Short films deserve
          <br />
          <span className="text-yellow-400">better discovery.</span>
        </h1>
        <p className="mb-8 max-w-xl text-lg text-neutral-400">
          Curated database of short films, music videos, and festival shorts on
          YouTube. Rate, review, and build your watchlist.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/films" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90">
            Browse Films
          </Link>
          <Link href="/submit" className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/8">
            Submit a Film
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-16 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/8 bg-white/8">
        {[
          { label: "Short Films", value: films.length > 0 ? `${films.length}+` : "—" },
          { label: "Community Ratings", value: "—" },
          { label: "Curated Lists", value: "—" },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-950 px-6 py-5 text-center">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="mt-0.5 text-sm text-neutral-400">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Films */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {films.length > 0 ? "Son Eklenenler" : "Featured Films"}
          </h2>
          <Link href="/films" className="text-sm text-neutral-400 transition-colors hover:text-white">
            Tümünü Gör →
          </Link>
        </div>

        {films.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {films.map((film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/8 bg-white/3 py-16 text-center">
            <p className="text-neutral-400">Henüz film eklenmedi.</p>
            <Link href="/submit" className="mt-4 inline-block text-sm text-yellow-400 hover:underline">
              İlk filmi sen ekle →
            </Link>
          </div>
        )}
      </section>

      {/* Browse by Genre */}
      <section className="mb-16">
        <h2 className="mb-6 text-xl font-bold text-white">Browse by Genre</h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Link
              key={genre}
              href={`/films?genre=${genre.toLowerCase()}`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-300 transition-all hover:border-white/25 hover:bg-white/10 hover:text-white"
            >
              {genre}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-10 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Know a great short film?</h2>
        <p className="mb-6 text-neutral-400">
          Paste a YouTube link and we'll pull all the metadata automatically.
        </p>
        <Link href="/submit" className="inline-block rounded-lg bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90">
          Submit a Film
        </Link>
      </section>
    </main>
  );
}
