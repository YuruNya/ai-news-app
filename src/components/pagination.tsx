import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  // 페이지 번호를 받아 이동할 경로를 만든다 (카테고리 필터 유지용)
  hrefFor: (page: number) => string;
};

const itemBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
const itemActive = "bg-indigo-600 font-medium text-white dark:bg-indigo-500";
const itemIdle =
  "border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400";
const itemDisabled =
  "border border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600";

// 현재 페이지 앞뒤 2개씩, 처음과 끝은 항상 표시. 사이가 비면 null(…)
function pageList(page: number, totalPages: number): (number | null)[] {
  const pages = new Set<number>([1, totalPages]);
  for (let p = page - 2; p <= page + 2; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(null);
    result.push(p);
  });
  return result;
}

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="페이지" className="flex justify-center pt-2">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1)}
              aria-label="이전 페이지"
              className={`${itemBase} ${itemIdle}`}
            >
              이전
            </Link>
          ) : (
            <span aria-disabled className={`${itemBase} ${itemDisabled}`}>
              이전
            </span>
          )}
        </li>
        {pageList(page, totalPages).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-slate-400">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-current={p === page ? "page" : undefined}
                className={`${itemBase} ${p === page ? itemActive : itemIdle}`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < totalPages ? (
            <Link
              href={hrefFor(page + 1)}
              aria-label="다음 페이지"
              className={`${itemBase} ${itemIdle}`}
            >
              다음
            </Link>
          ) : (
            <span aria-disabled className={`${itemBase} ${itemDisabled}`}>
              다음
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
