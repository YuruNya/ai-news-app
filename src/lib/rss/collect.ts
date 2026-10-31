import Parser from "rss-parser";
import { db } from "@/db";
import { articles, type NewArticle } from "@/db/schema";
import { FEEDS, type Feed } from "./feeds";

const WINDOW_MS = 24 * 60 * 60 * 1000;
// 피드가 비정상적으로 큰 경우를 대비한 상한
const MAX_ITEMS_PER_FEED = 50;

const parser = new Parser({ timeout: 10_000 });

export type CollectResult = {
  /** 24시간 이내로 파싱된 기사 수 */
  fetched: number;
  /** 새로 저장된 기사 수 */
  inserted: number;
  /** 이미 저장되어 건너뛴 기사 수 */
  skipped: number;
  /** 파싱에 실패한 소스 이름 */
  failedSources: string[];
};

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

async function parseFeed(feed: Feed, since: Date): Promise<NewArticle[]> {
  const parsed = await parser.parseURL(feed.url);
  const result: NewArticle[] = [];

  for (const item of parsed.items.slice(0, MAX_ITEMS_PER_FEED)) {
    const dateStr = item.isoDate ?? item.pubDate;
    const publishedAt = dateStr ? new Date(dateStr) : null;
    // 발행 시각이 없거나 24시간보다 오래된 기사는 제외
    if (!publishedAt || Number.isNaN(publishedAt.getTime())) continue;
    if (publishedAt < since) continue;

    const url = item.link ? normalizeUrl(item.link) : null;
    const title = item.title?.trim();
    if (!url || !title) continue;

    result.push({
      source: feed.source,
      author: item.creator?.trim() || null,
      url,
      titleEn: title,
      publishedAt,
    });
  }
  return result;
}

export async function collectArticles(): Promise<CollectResult> {
  const since = new Date(Date.now() - WINDOW_MS);
  const settled = await Promise.allSettled(
    FEEDS.map((feed) => parseFeed(feed, since)),
  );

  const failedSources: string[] = [];
  const byUrl = new Map<string, NewArticle>();
  settled.forEach((r, i) => {
    if (r.status === "rejected") {
      failedSources.push(FEEDS[i].source);
      console.error(`[rss] ${FEEDS[i].source} 파싱 실패:`, r.reason);
      return;
    }
    for (const a of r.value) byUrl.set(a.url, a);
  });

  const rows = [...byUrl.values()];
  let inserted = 0;
  if (rows.length > 0) {
    const created = await db
      .insert(articles)
      .values(rows)
      .onConflictDoNothing({ target: articles.url })
      .returning({ id: articles.id });
    inserted = created.length;
  }

  return {
    fetched: rows.length,
    inserted,
    skipped: rows.length - inserted,
    failedSources,
  };
}
