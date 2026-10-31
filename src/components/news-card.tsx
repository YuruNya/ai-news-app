import type { Article } from "@/db/schema";

type NewsCardProps = {
  article: Pick<
    Article,
    | "source"
    | "url"
    | "titleEn"
    | "titleKo"
    | "summaryKo"
    | "notionPageId"
    | "publishedAt"
    | "fetchedAt"
  > & { categoryName: string | null };
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Seoul",
});

function formatDate(date: Date) {
  // "2026. 11. 01." → "2026.11.01"
  return dateFormatter.format(date).replace(/\.\s/g, ".").replace(/\.$/, "");
}

export function NewsCard({ article }: NewsCardProps) {
  const date = article.publishedAt ?? article.fetchedAt;

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">{article.source}</span>
        <span aria-hidden>·</span>
        <time dateTime={date.toISOString()}>{formatDate(date)}</time>
      </div>

      <h2 className="text-base font-semibold leading-snug">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:hover:text-indigo-400"
        >
          {article.titleKo ?? article.titleEn}
        </a>
      </h2>

      {article.summaryKo && (
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {article.summaryKo}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-4">
        {article.categoryName ? (
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {article.categoryName}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            미분류
          </span>
        )}
        {article.notionPageId && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            저장됨 ✓
          </span>
        )}
      </div>
    </article>
  );
}
