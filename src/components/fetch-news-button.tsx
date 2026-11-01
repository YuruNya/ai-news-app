"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CollectResult } from "@/lib/rss/collect";

type Notice = { kind: "ok" | "error"; text: string };

export function FetchNewsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);

  async function handleClick() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/news/fetch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청에 실패했어요.");

      const r = data as CollectResult;
      const failedFeeds =
        r.failedSources.length > 0
          ? ` (${r.failedSources.join(", ")} 실패)`
          : "";
      const failedAi = r.failed > 0 ? ` · 번역 실패 ${r.failed}건` : "";
      const hasError = r.failedSources.length > 0 || r.failed > 0;
      setNotice({
        kind: hasError ? "error" : "ok",
        text:
          (r.inserted > 0
            ? `${r.inserted}건 새로 저장했어요`
            : "새 기사가 없어요") +
          failedFeeds +
          failedAi,
      });
      startTransition(() => router.refresh());
    } catch (e) {
      setNotice({
        kind: "error",
        text: e instanceof Error ? e.message : "뉴스를 가져오지 못했어요.",
      });
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || refreshing;

  return (
    <div className="flex items-center gap-3">
      {notice && (
        <span
          role="status"
          className={`hidden text-xs sm:inline ${
            notice.kind === "ok"
              ? "text-slate-500 dark:text-slate-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {notice.text}
        </span>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        {busy ? "가져오는 중…" : "뉴스 가져오기"}
      </button>
    </div>
  );
}
