"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeleteNewsButtonProps = {
  articleId: number;
  title: string;
};

export function DeleteNewsButton({ articleId, title }: DeleteNewsButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/${articleId}`, { method: "DELETE" });
      // 이미 지워진 기사(404)도 화면에서 빠지도록 목록을 새로 고친다.
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "삭제하지 못했어요.");
      }
      // 서버에서 목록을 다시 받아 카드를 빼고, 다음 페이지 기사로 빈자리를 채운다.
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했어요.");
    } finally {
      setDeleting(false);
    }
  }

  const busy = deleting || refreshing;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={`'${title}' 삭제`}
        title="삭제"
        className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-950 dark:hover:text-red-400"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="size-4"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
      {error && (
        <p
          role="alert"
          className="absolute right-0 top-full z-10 mt-1 w-max max-w-48 rounded-md bg-white px-2 py-1 text-xs text-red-600 shadow-sm dark:bg-slate-900 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
