"use client";

import { useState } from "react";

type SaveNewsButtonProps = {
  articleId: number;
  saved: boolean;
};

export function SaveNewsButton({ articleId, saved: initialSaved }: SaveNewsButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/${articleId}/notion`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "저장하지 못했어요.");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <button
        type="button"
        disabled
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:border-slate-700 dark:text-emerald-400"
      >
        저장됨 ✓
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={saving}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {saving ? "저장 중…" : "뉴스 저장"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
