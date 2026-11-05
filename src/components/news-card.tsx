import type { Article } from "@/db/schema";
import { DeleteNewsButton } from "@/components/delete-news-button";
import { SaveNewsButton } from "@/components/save-news-button";

type NewsCardProps = {
  article: Pick<
    Article,
    | "id"
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
  const title = article.titleKo ?? article.titleEn;
  // 번역 제목이 있을 때만 원제를 보조 줄로 보여준다.
  const showOriginal =
    Boolean(article.titleKo) && article.titleKo !== article.titleEn;

  return (
    <article className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 motion-safe:hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/60 dark:hover:shadow-indigo-400/5">
      {/* hover 때 왼쪽에서 채워지는 상단 강조선 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 rounded-t-xl bg-indigo-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-within:scale-x-100 dark:bg-indigo-400"
      />

      <div className="mb-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {article.source}
        </span>
        <span aria-hidden className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
        <time dateTime={date.toISOString()} className="tabular-nums">
          {formatDate(date)}
        </time>
        {/* 마우스 환경에서는 hover·포커스 때만 보이고, 터치 환경에서는 항상 보인다 */}
        <div className="relative z-10 -my-1.5 -mr-2 ml-auto transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
          <DeleteNewsButton articleId={article.id} title={title} />
        </div>
      </div>

      <h2 className="text-[17px] font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-50">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          // after로 카드 전체를 클릭 영역으로 넓힌다. 버튼은 z-10으로 위에 둔다.
          className="decoration-indigo-500/60 decoration-2 underline-offset-4 transition-colors after:absolute after:inset-0 after:rounded-xl group-hover:text-indigo-700 group-hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-indigo-500 dark:group-hover:text-indigo-300"
        >
          {title}
        </a>
      </h2>

      {showOriginal && (
        <p
          lang="en"
          className="mt-1.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400"
        >
          {article.titleEn}
        </p>
      )}

      {article.summaryKo && (
        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {article.summaryKo}
        </p>
      )}

      <div className="relative z-10 mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        {article.categoryName ? (
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {article.categoryName}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            미분류
          </span>
        )}
        <SaveNewsButton
          articleId={article.id}
          saved={Boolean(article.notionPageId)}
        />
      </div>
    </article>
  );
}
