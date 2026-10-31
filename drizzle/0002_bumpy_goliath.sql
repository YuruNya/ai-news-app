DROP TABLE IF EXISTS "article_categories" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "notion_saves" CASCADE;--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_user_id_name_unique";--> statement-breakpoint
DROP INDEX "categories_user_idx";--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "notion_page_id" text;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_unique" UNIQUE("name");