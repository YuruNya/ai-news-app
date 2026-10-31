ALTER TABLE "articles" ADD COLUMN "author" text;--> statement-breakpoint
CREATE INDEX "article_categories_user_category_idx" ON "article_categories" USING btree ("user_id","category_id");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "categories_user_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_name_unique" UNIQUE("user_id","name");