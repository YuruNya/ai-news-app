import Parser from "rss-parser";
import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { ensureDefaultCategories } from "@/db/seed";
import { articles, categories, type NewArticle } from "@/db/schema";
import { enrichArticle } from "@/lib/claude/enrich-article";
import { FEEDS, type Feed } from "./feeds";

// 최근 2주 안에 발행된 기사만 가져온다.
const WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
// 페이지를 지원하는 피드에서 읽을 최대 페이지 수 (TechCrunch는 페이지당 20건, 2주에 약 7페이지)
const MAX_FEED_PAGES = 10;
// Claude 동시 호출 수
const CONCURRENCY = 5;
// 한 번에 처리할 최대 기사 수 (타임아웃 방지)
const MAX_ENRICH_PER_RUN = 40;
const SNIPPET_MAX_CHARS = 1500;
const FALLBACK_CATEGORY = "기타";

const parser = new Parser({ timeout: 10_000 });

export type CollectResult = {
  /** 2주 이내로 파싱된 기사 수 */
  fetched: number;
  /** 새로 저장된 기사 수 */
  inserted: number;
  /** 이미 저장되어 건너뛴 기사 수 */
  skipped: number;
  /** 번역·요약·분류를 마친 기사 수 */
  processed: number;
  /** 번역·요약·분류에 실패한 기사 수 (다음 가져오기 때 다시 시도) */
  failed: number;
  /** 이번에 처리하지 못해 다음 가져오기를 기다리는 기사 수 (실패한 기사 포함) */
  remaining: number;
  /** 파싱에 실패한 소스 이름 */
  failedSources: string[];
};

type ParsedItem = { article: NewArticle; snippet: string };

// 추적용 쿼리(utm_*)와 해시를 제거해 같은 기사가 중복 저장되지 않게 한다.
function normalizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function toSnippet(raw: string | undefined): string {
  return (raw ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SNIPPET_MAX_CHARS);
}

async function parseFeed(feed: Feed, since: Date): Promise<ParsedItem[]> {
  const result: ParsedItem[] = [];
  const lastPage = feed.paginated ? MAX_FEED_PAGES : 1;

  for (let page = 1; page <= lastPage; page++) {
    let items: Parser.Item[];
    try {
      const url = page === 1 ? feed.url : `${feed.url}?paged=${page}`;
      items = (await parser.parseURL(url)).items;
    } catch (error) {
      // 첫 페이지 실패만 피드 실패로 보고, 이후 페이지는 읽은 만큼만 쓴다.
      if (page === 1) throw error;
      console.error(`[rss] ${feed.source} ${page}페이지 파싱 실패:`, error);
      break;
    }

    let reachedOldItem = false;
    for (const item of items) {
      const dateStr = item.isoDate ?? item.pubDate;
      const publishedAt = dateStr ? new Date(dateStr) : null;
      // 발행 시각이 없거나 2주보다 오래된 기사는 제외
      if (!publishedAt || Number.isNaN(publishedAt.getTime())) continue;
      if (publishedAt < since) {
        reachedOldItem = true;
        continue;
      }

      const url = item.link ? normalizeUrl(item.link) : null;
      const title = item.title?.trim();
      if (!url || !title) continue;

      result.push({
        article: {
          source: feed.source,
          author: item.creator?.trim() || null,
          url,
          titleEn: title,
          publishedAt,
        },
        snippet: toSnippet(item.contentSnippet ?? item.content),
      });
    }
    if (reachedOldItem || items.length === 0) break;
  }
  return result;
}

// 동시 실행 수를 제한하며 모든 작업을 처리한다.
async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        await worker(items[next++]);
      }
    }),
  );
}

// 아직 번역되지 않은 기사(새 기사 + 이전에 실패한 기사)를 Claude로 처리한다.
async function enrichPending(snippets: Map<string, string>) {
  const pendingTotal = await db.$count(articles, isNull(articles.titleKo));
  if (pendingTotal === 0) return { processed: 0, failed: 0, remaining: 0 };

  // 한 번에 다 처리하지 못할 수 있으니 최신 기사부터 처리한다.
  const pending = await db
    .select({
      id: articles.id,
      url: articles.url,
      titleEn: articles.titleEn,
    })
    .from(articles)
    .where(isNull(articles.titleKo))
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(MAX_ENRICH_PER_RUN);

  const cats = await db.select().from(categories);
  const idByName = new Map(cats.map((c) => [c.name, c.id]));

  let processed = 0;
  let failed = 0;
  await runPool(pending, CONCURRENCY, async (row) => {
    try {
      const r = await enrichArticle(
        { titleEn: row.titleEn, snippet: snippets.get(row.url) },
        cats,
      );
      await db
        .update(articles)
        .set({
          titleKo: r.titleKo.trim(),
          summaryKo: r.summaryKo.trim(),
          categoryId:
            idByName.get(r.category) ?? idByName.get(FALLBACK_CATEGORY) ?? null,
        })
        .where(eq(articles.id, row.id));
      processed++;
    } catch (error) {
      failed++;
      console.error(`[claude] 기사 처리 실패 (id=${row.id}):`, error);
    }
  });
  return { processed, failed, remaining: pendingTotal - processed };
}

export async function collectArticles(): Promise<CollectResult> {
  await ensureDefaultCategories();

  const since = new Date(Date.now() - WINDOW_MS);
  const settled = await Promise.allSettled(
    FEEDS.map((feed) => parseFeed(feed, since)),
  );

  const failedSources: string[] = [];
  const byUrl = new Map<string, ParsedItem>();
  settled.forEach((r, i) => {
    if (r.status === "rejected") {
      failedSources.push(FEEDS[i].source);
      console.error(`[rss] ${FEEDS[i].source} 파싱 실패:`, r.reason);
      return;
    }
    for (const item of r.value) byUrl.set(item.article.url, item);
  });

  const items = [...byUrl.values()];
  let inserted = 0;
  if (items.length > 0) {
    const created = await db
      .insert(articles)
      .values(items.map((i) => i.article))
      .onConflictDoNothing({ target: articles.url })
      .returning({ id: articles.id });
    inserted = created.length;
  }

  const snippets = new Map(items.map((i) => [i.article.url, i.snippet]));
  const { processed, failed, remaining } = await enrichPending(snippets);

  return {
    fetched: items.length,
    inserted,
    skipped: items.length - inserted,
    processed,
    failed,
    remaining,
    failedSources,
  };
}
