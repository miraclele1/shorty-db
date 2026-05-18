import { relations, sql } from "drizzle-orm";
import {
	check,
	decimal,
	pgTable,
	primaryKey,
	smallint,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { content } from "./content";

// ─── ratings ──────────────────────────────────────────────────────────────────

export const ratings = pgTable(
	"ratings",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		contentId: uuid("content_id")
			.notNull()
			.references(() => content.id, { onDelete: "cascade" }),
		userId: text("user_id").notNull(),
		score: decimal("score", { precision: 3, scale: 1 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		uniqueIndex("ratings_content_user_idx").on(t.contentId, t.userId),
		check("score_range", sql`${t.score} >= 0 AND ${t.score} <= 10`),
	],
);

export const ratingsRelations = relations(ratings, ({ one }) => ({
	content: one(content, {
		fields: [ratings.contentId],
		references: [content.id],
	}),
}));

// ─── reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable("reviews", {
	id: uuid("id").primaryKey().defaultRandom(),
	contentId: uuid("content_id")
		.notNull()
		.references(() => content.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	body: text("body").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
	content: one(content, {
		fields: [reviews.contentId],
		references: [content.id],
	}),
	votes: many(reviewVotes),
}));

// ─── review_votes ─────────────────────────────────────────────────────────────

export const reviewVotes = pgTable(
	"review_votes",
	{
		reviewId: uuid("review_id")
			.notNull()
			.references(() => reviews.id, { onDelete: "cascade" }),
		userId: text("user_id").notNull(),
		vote: smallint("vote").notNull(),
	},
	(t) => [
		primaryKey({ columns: [t.reviewId, t.userId] }),
		check("vote_values", sql`${t.vote} = 1 OR ${t.vote} = -1`),
	],
);

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
	review: one(reviews, {
		fields: [reviewVotes.reviewId],
		references: [reviews.id],
	}),
}));
