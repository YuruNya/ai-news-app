// 뉴스 카드와 같은 구성(출처·날짜 → 제목 → 요약 → 배지·버튼)의 로딩 자리표시자.
const bar = "rounded bg-slate-200 dark:bg-slate-800";

export function NewsCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex animate-pulse flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className={`mb-3 h-3 w-32 ${bar}`} />
      <div className="space-y-2">
        <div className={`h-[17px] w-full ${bar}`} />
        <div className={`h-[17px] w-2/3 ${bar}`} />
      </div>
      <div className={`mt-2 h-3 w-1/2 ${bar}`} />
      <div className="mt-4 space-y-2">
        <div className={`h-3 w-full ${bar}`} />
        <div className={`h-3 w-full ${bar}`} />
        <div className={`h-3 w-4/5 ${bar}`} />
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-7 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

// 카드 그리드 자리에 스켈레톤 카드 6개를 채운다.
export function NewsCardSkeletonGrid() {
  return (
    <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <span className="sr-only">뉴스를 불러오는 중…</span>
      {Array.from({ length: 6 }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}
