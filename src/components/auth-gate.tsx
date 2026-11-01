"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useEffect, useSyncExternalStore } from "react";

const TAB_FLAG = "ai-news-tab-session";

// 이 탭이 처음 열릴 때 한 번만 읽는다. sessionStorage는 탭을 닫으면 사라지고 새로고침에는 남는다.
let tabHadSession: boolean | undefined;

function readTabHadSession() {
  if (tabHadSession === undefined) {
    try {
      tabHadSession = sessionStorage.getItem(TAB_FLAG) === "1";
      sessionStorage.setItem(TAB_FLAG, "1");
    } catch {
      // sessionStorage를 못 쓰면 로그인 유지 쪽으로 동작한다.
      tabHadSession = true;
    }
  }
  return tabHadSession;
}

const subscribe = () => () => {};

// 로그인하지 않은 사용자에게는 본문 대신 닫을 수 없는 로그인 창만 보여준다.
// 탭(브라우저)을 닫았다가 다시 열면 로그인이 풀리도록, 표식 없이 열린 탭에서
// 이미 로그인된 상태면 로그아웃시킨다.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const hadSession = useSyncExternalStore(
    subscribe,
    readTabHadSession,
    () => true,
  );
  const stale = isLoaded && isSignedIn && !hadSession;

  useEffect(() => {
    if (!stale) return;
    // 이후 이 탭에서 다시 로그인한 경우에는 로그아웃시키지 않는다.
    tabHadSession = true;
    void signOut();
  }, [stale, signOut]);

  if (!isLoaded || stale) return null;

  if (!isSignedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
        <SignIn routing="hash" />
      </div>
    );
  }

  return <>{children}</>;
}
