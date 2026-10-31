"use client";

import { SignIn, useAuth } from "@clerk/nextjs";

// 로그인하지 않은 사용자에게는 본문 대신 닫을 수 없는 로그인 창만 보여준다.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
        <SignIn routing="hash" />
      </div>
    );
  }

  return <>{children}</>;
}
