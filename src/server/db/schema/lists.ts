import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { content, genres } from "./content";

// ─── lists ────────────────────────────────────────────────────────────────────

export const lists = pgTable("lists", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	isPublic: boolean("is_public").notNull().default(false),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const listsRelations = relations(lists, ({ many }) => ({
	items: many(listItems),
}));

// ─── list_items ───────────────────────────────────────────────────────────────

export const listItems = pgTable(
	"list_items",
	{
		listId: uuid("list_id")
			.notNull()
			.references(() => lists.id, { onDelete: "cascade" }),
		contentId: uuid("content_id")
			.notNull()
			.references(() => content.id, { onDelete: "cascade" }),
		position: integer("position").notNull().default(0),
		addedAt: timestamp("added_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [primaryKey({ columns: [t.listId, t.contentId] })],
);

export const listItemsRelations = relations(listItems, ({ one }) => ({
	list: one(lists, {
		fields: [listItems.listId],
		references: [lists.id],
	}),
	content: one(content, {
		fields: [listItems.contentId],
		references: [content.id],
	}),
}));

// ─── watchlist ────────────────────────────────────────────────────────────────

export const watchlist = pgTable(
	"watchlist",
	{
		userId: text("user_id").notNull(),
		contentId: uuid("content_id")
			.notNull()
			.references(() => content.id, { onDelete: "cascade" }),
		addedAt: timestamp("added_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		watchedAt: timestamp("watched_at", { withTimezone: true }),
	},
	(t) => [primaryKey({ columns: [t.userId, t.contentId] })],
);

export const watchlistRelations = relations(watchlist, ({ one }) => ({
	content: one(content, {
		fields: [watchlist.contentId],
		references: [content.id],
	}),
}));

// ─── content_genres ───────────────────────────────────────────────────────────

export const contentGenres = pgTable(
	"content_genres",
	{
		contentId: uuid("content_id")
			.notNull()
			.references(() => content.id, { onDelete: "cascade" }),
		genreId: uuid("genre_id")
			.notNull()
			.references(() => genres.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.contentId, t.genreId] })],
);

export const contentGenresRelations = relations(contentGenres, ({ one }) => ({
	content: one(content, {
		fields: [contentGenres.contentId],
		references: [content.id],
	}),
	genre: one(genres, {
		fields: [contentGenres.genreId],
		references: [genres.id],
	}),
}));
