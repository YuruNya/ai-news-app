import Link from "next/link";
import type { Category } from "@/db/schema";

type CategoryBarProps = {
  categories: Pick<Category, "id" | "name">[];
  // "all" | "uncategorized" | 카테고리 id
  selected: string;
  // 카테고리를 바꿔도 유지할 검색어
  keyword: string;
};

const chipBase =
  "rounded-full px-3.5 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
const chipActive =
  "bg-indigo-600 font-medium text-white dark:bg-indigo-500";
const chipIdle =
  "border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400";

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`${chipBase} ${active ? chipActive : chipIdle} inline-block`}
      >
        {children}
      </Link>
    </li>
  );
}

export function CategoryBar({
  categories,
  selected,
  keyword,
}: CategoryBarProps) {
  const hrefFor = (category?: string) => {
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (keyword) qs.set("q", keyword);
    const s = qs.toString();
    return s ? `/dashboard?${s}` : "/dashboard";
  };

  return (
    <nav
      aria-label="카테고리"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:min-w-0 sm:flex-1 sm:overflow-visible sm:px-0"
    >
      <ul className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
        <Chip href={hrefFor()} active={selected === "all"}>
          전체
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            href={hrefFor(String(c.id))}
            active={selected === String(c.id)}
          >
            {c.name}
          </Chip>
        ))}
        <Chip
          href={hrefFor("uncategorized")}
          active={selected === "uncategorized"}
        >
          미분류
        </Chip>
      </ul>
    </nav>
  );
}
