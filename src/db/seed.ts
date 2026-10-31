import { db } from "./index";
import { categories } from "./schema";

export const DEFAULT_CATEGORIES = [
  { name: "모델/제품", description: "새로운 AI 모델, 제품, 기능 출시" },
  { name: "투자/기업", description: "투자 유치, 인수합병, 기업 동향" },
  { name: "규제/정책", description: "AI 관련 법, 규제, 정부 정책" },
  { name: "연구", description: "논문, 연구 성과, 기술 연구" },
  { name: "기타", description: "위 카테고리에 해당하지 않는 기사" },
] as const;

// 기본 카테고리를 생성한다. 여러 번 호출해도 중복 생성되지 않는다.
export async function ensureDefaultCategories() {
  await db
    .insert(categories)
    .values([...DEFAULT_CATEGORIES])
    .onConflictDoNothing({ target: categories.name });
}
