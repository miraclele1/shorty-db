"use client";

import { useState, useTransition } from "react";
import { submitRating } from "./actions";

interface RatingWidgetProps {
	contentId: string;
	slug: string;
	userRating: number | null;
	isLoggedIn: boolean;
}

export function RatingWidget({
	contentId,
	slug,
	userRating,
	isLoggedIn,
}: RatingWidgetProps) {
	const [hovered, setHovered] = useState<number | null>(null);
	const [current, setCurrent] = useState<number | null>(userRating);
	const [error, setError] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleRate = (score: number) => {
		if (!isLoggedIn) {
			setError("Puan vermek için giriş yapmalısın.");
			return;
		}
		setError("");
		startTransition(async () => {
			const result = await submitRating(contentId, slug, score);
			if ("error" in result) {
				setError(result.error);
			} else {
				setCurrent(score);
			}
		});
	};

	const active = hovered ?? current;

	if (!isLoggedIn) {
		return (
			<div className="rounded-xl border border-white/8 bg-white/3 p-5">
				<p className="mb-3 text-sm font-medium text-neutral-300">Puanla</p>
				<p className="text-sm text-neutral-500">
					Puan vermek için{" "}
					<a href="/login" className="text-yellow-400 hover:underline">
						giriş yap
					</a>
					.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-white/8 bg-white/3 p-5">
			<p className="mb-3 text-sm font-medium text-neutral-300">
				{current ? `Puanın: ${current}/10` : "Bu filmi puan ver"}
			</p>

			<div
				className="flex gap-1.5"
				onMouseLeave={() => setHovered(null)}
			>
				{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
					<button
						key={n}
						type="button"
						disabled={isPending}
						onClick={() => handleRate(n)}
						onMouseEnter={() => setHovered(n)}
						className={`h-8 w-8 rounded text-sm font-semibold transition-all disabled:opacity-50 ${
							active !== null && n <= active
								? "bg-yellow-400 text-black"
								: "bg-white/8 text-neutral-400 hover:bg-white/15 hover:text-white"
						}`}
					>
						{n}
					</button>
				))}
			</div>

			{error && <p className="mt-2 text-xs text-red-400">{error}</p>}
			{current && !error && (
				<p className="mt-2 text-xs text-neutral-500">
					Tekrar tıklayarak puanını değiştirebilirsin.
				</p>
			)}
		</div>
	);
}
