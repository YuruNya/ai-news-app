"use client";

import { createContext, use, useState, useTransition } from "react";
import { NewsCardSkeletonGrid } from "@/components/news-card-skeleton";

type NewsFetchingValue = {
  /** 가져오기 요청 중이거나, 끝난 뒤 목록을 새로 그리는 중 */
  fetching: boolean;
  setLoading: (loading: boolean) => void;
  startRefresh: (callback: () => void) => void;
};

const NewsFetchingContext = createContext<NewsFetchingValue | null>(null);

// 헤더의 가져오기 버튼과 본문의 카드 목록이 진행 상태를 함께 쓰도록 감싼다.
export function NewsFetchingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  return (
    <NewsFetchingContext
      value={{ fetching: loading || refreshing, setLoading, startRefresh }}
    >
      {children}
    </NewsFetchingContext>
  );
}

export function useNewsFetching() {
  const value = use(NewsFetchingContext);
  if (!value) {
    throw new Error("NewsFetchingProvider 안에서만 쓸 수 있어요.");
  }
  return value;
}

// 가져오는 동안에는 카드 목록 대신 스켈레톤을 보여준다.
export function NewsListArea({ children }: { children: React.ReactNode }) {
  const { fetching } = useNewsFetching();
  return fetching ? <NewsCardSkeletonGrid /> : <>{children}</>;
}
