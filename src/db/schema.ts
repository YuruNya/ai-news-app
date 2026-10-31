import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// 공용 데이터: 기사당 번역·요약 1회
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  url: text("url").notNull().unique(),
  titleEn: text("title_en").notNull(),
  titleKo: text("title_ko"),
  summaryKo: text("summary_ko"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 사용자별 데이터: 모든 쿼리에 userId 조건 필수
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const articleCategories = pgTable(
  "article_categories",
  {
    userId: text("user_id").notNull(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    // 카테고리 삭제 시 null → "미분류"
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
  },
  (t) => [unique().on(t.userId, t.articleId)],
);

export const notionSaves = pgTable(
  "notion_saves",
  {
    userId: text("user_id").notNull(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    notionPageId: text("notion_page_id").notNull(),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.userId, t.articleId)],
);
