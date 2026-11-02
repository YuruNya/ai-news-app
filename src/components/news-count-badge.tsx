type NewsCountBadgeProps = {
  // 필터·검색과 상관없이 DB에 수집된 전체 기사 수
  count: number;
};

export function NewsCountBadge({ count }: NewsCountBadgeProps) {
  return (
    <p className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
      총&nbsp;
      <span className="font-semibold tabular-nums">
        {count.toLocaleString("ko-KR")}
      </span>
      개의 뉴스
    </p>
  );
}
