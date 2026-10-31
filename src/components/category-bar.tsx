import Link from "next/link";
import type { Category } from "@/db/schema";

type CategoryBarProps = {
  categories: Pick<Category, "id" | "name">[];
  // "all" | "uncategorized" | 카테고리 id
  selected: string;
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

export function CategoryBar({ categories, selected }: CategoryBarProps) {
  return (
    <nav
      aria-label="카테고리"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0"
    >
      <ul className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
        <Chip href="/dashboard" active={selected === "all"}>
          전체
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            href={`/dashboard?category=${c.id}`}
            active={selected === String(c.id)}
          >
            {c.name}
          </Chip>
        ))}
        <Chip
          href="/dashboard?category=uncategorized"
          active={selected === "uncategorized"}
        >
          미분류
        </Chip>
      </ul>
    </nav>
  );
}
