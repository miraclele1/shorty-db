import { relations } from "drizzle-orm";
import {
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { contentGenres } from "./lists";
import { ratings, reviews } from "./social";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const contentTypeEnum = pgEnum("content_type", [
	"short_film",
	"music_video",
	"trailer",
	"stream",
]);

export const contentStatusEnum = pgEnum("content_status", [
	"pending",
	"approved",
	"rejected",
]);

// ─── content ──────────────────────────────────────────────────────────────────

export const content = pgTable(
	"content",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		type: contentTypeEnum("type").notNull(),
		slug: text("slug").notNull(),
		title: text("title").notNull(),
		youtubeId: text("youtube_id").notNull(),
		channelId: text("channel_id").notNull(),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		addedBy: uuid("added_by").notNull(),
		status: contentStatusEnum("status").notNull().default("pending"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		uniqueIndex("content_slug_idx").on(t.slug),
		uniqueIndex("content_youtube_id_idx").on(t.youtubeId),
	],
);

export const contentRelations = relations(content, ({ one, many }) => ({
	shortFilmMeta: one(shortFilmMeta, {
		fields: [content.id],
		references: [shortFilmMeta.contentId],
	}),
	ratings: many(ratings),
	reviews: many(reviews),
	contentGenres: many(contentGenres),
}));

// ─── short_film_meta ──────────────────────────────────────────────────────────

export const shortFilmMeta = pgTable("short_film_meta", {
	contentId: uuid("content_id")
		.primaryKey()
		.references(() => content.id, { onDelete: "cascade" }),
	director: text("director"),
	runtimeSeconds: integer("runtime_seconds"),
	releaseYear: integer("release_year"),
	synopsis: text("synopsis"),
	festival: text("festival"),
});

export const shortFilmMetaRelations = relations(shortFilmMeta, ({ one }) => ({
	content: one(content, {
		fields: [shortFilmMeta.contentId],
		references: [content.id],
	}),
}));

// ─── genres ───────────────────────────────────────────────────────────────────

export const genres = pgTable("genres", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: text("slug").notNull().unique(),
	name: text("name").notNull().unique(),
});

export const genresRelations = relations(genres, ({ many }) => ({
	contentGenres: many(contentGenres),
}));
