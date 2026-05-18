import Link from "next/link";
import type { Metadata } from "next";
import { getContentList } from "@/server/db/queries/content";
import type { ContentListItem } from "@/server/db/queries/content";

export const metadata: Metadata = {
  title: "Films",
  description: "Browse all short films in the ShortyDB database.",
};

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
    </svg>
  );
}

function FilmRow({ film, rank }: { film: ContentListItem; rank: number }) {
  const year = film.releaseYear ?? (film.publishedAt ? new Date(film.publishedAt).getFullYear() : null);
  const runtime = film.runtimeSeconds ? Math.round(film.runtimeSeconds / 60) : null;

  return (
    <Link
      href={`/films/${film.slug}`}
      className="group flex items-center gap-5 -mx-3 rounded-lg px-3 py-4 transition-colors hover:bg-white/3"
    >
      <span className="w-6 shrink-0 text-right text-sm font-medium text-neutral-600">{rank}</span>

      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
        <img
          src={`https://img.youtube.com/vi/${film.youtubeId}/mqdefault.jpg`}
          alt={film.title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        {runtime && (
          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-px text-xs text-white">
            {runtime}m
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <span className="truncate font-semibold text-white transition-colors group-hover:text-yellow-400">
          {film.title}
        </span>
        <span className="text-xs text-neutral-400">
          {film.director ? `${film.director} · ` : ""}{year ?? ""}
          {film.status === "pending" && (
            <span className="ml-2 rounded bg-yellow-500/20 px-1.5 py-px text-xs text-yellow-400">
              İncelemede
            </span>
          )}
        </span>
        {film.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {film.genres.map((g) => (
              <span key={g} className="rounded px-1.5 py-px text-xs bg-white/8 text-neutral-400">{g}</span>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-0.5">
        {film.avgRating ? (
          <>
            <div className="flex items-center gap-1 text-yellow-400">
              <StarIcon />
              <span className="text-sm font-bold">{film.avgRating}</span>
            </div>
            <span className="text-xs text-neutral-500">{film.ratingsCount} ratings</span>
          </>
        ) : (
          <span className="text-xs text-neutral-600">Henüz puan yok</span>
        )}
      </div>
    </Link>
  );
}

export default async function FilmsPage() {
  const films = await getContentList();

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">All Films</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {films.length} film · son eklenene göre
          </p>
        </div>
        <Link href="/submit" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/8">
          + Film Ekle
        </Link>
      </div>

      {films.length > 0 ? (
        <div className="flex flex-col divide-y divide-white/5">
          {films.map((film, i) => (
            <FilmRow key={film.id} film={film} rank={i + 1} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/8 bg-white/3 py-24 text-center">
          <p className="text-neutral-400 mb-4">Henüz hiç film eklenmedi.</p>
          <Link href="/submit" className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90">
            İlk Filmi Ekle
          </Link>
        </div>
      )}
    </main>
  );
}
