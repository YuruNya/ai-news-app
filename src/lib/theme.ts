export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "ai-news-theme";

// 첫 렌더 전에 실행해 저장된 테마(없으면 시스템 설정)를 <html>에 반영한다.
// 하이드레이션 전에 적용해야 라이트↔다크 깜빡임이 생기지 않는다.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})();`;
