import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// 단일 사용자 앱: 사용자별 분리 없이 테이블 2개만 사용한다.
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    // 원문 기사 작성자. RSS에 없으면 null
    author: text("author"),
    url: text("url").notNull().unique(),
    titleEn: text("title_en").notNull(),
    titleKo: text("title_ko"),
    summaryKo: text("summary_ko"),
    // 카테고리 삭제 시 null → "미분류"
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    // Notion 저장 후 페이지 ID. 값이 있으면 이미 저장된 기사(중복 저장 방지)
    notionPageId: text("notion_page_id"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("articles_published_at_idx").on(t.publishedAt.desc()),
    index("articles_category_idx").on(t.categoryId),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one }) => ({
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
}));

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
