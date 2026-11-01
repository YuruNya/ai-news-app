import { redirect } from "next/navigation";

// 루트는 대시보드로 보낸다. 비로그인 사용자는 AuthGate가 로그인 창을 띄우고,
// 로그인하면 주소가 /dashboard인 채로 본문이 열린다.
export default function Home() {
  redirect("/dashboard");
}
