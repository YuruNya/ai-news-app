import Form from "next/form";

type SearchBarProps = {
  // 현재 적용된 검색어
  keyword: string;
  // "all" | "uncategorized" | 카테고리 id
  selected: string;
};

// 검색 버튼과 Enter 모두 폼 제출로 처리한다. page를 넘기지 않으므로 검색하면 1페이지로 돌아간다.
export function SearchBar({ keyword, selected }: SearchBarProps) {
  return (
    <Form action="/dashboard" role="search" className="flex gap-2 sm:w-72 sm:shrink-0">
      {selected !== "all" && (
        <input type="hidden" name="category" value={selected} />
      )}
      <input
        // 뒤로 가기 등으로 검색어가 바뀌면 입력값도 URL에 맞춘다.
        key={keyword}
        type="search"
        name="q"
        defaultValue={keyword}
        placeholder="키워드로 뉴스 검색"
        aria-label="뉴스 검색어"
        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        검색
      </button>
    </Form>
  );
}
