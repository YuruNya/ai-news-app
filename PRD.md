# PRD: AI 뉴스 수집기

## 1. 개요
해외 AI 뉴스를 RSS로 수집하고, Claude API가 한국어로 번역·요약·카테고리 분류하여 카드 형태로 보여주는 웹 앱. 마음에 드는 뉴스는 Notion에 저장할 수 있다.

## 2. 목표
- 해외 AI 뉴스를 한국어로 빠르게 훑어볼 수 있게 한다.
- 관심 주제별(카테고리)로 뉴스를 골라 볼 수 있게 한다.
- 선택한 뉴스를 Notion에 클릭 한 번으로 보관한다.

## 3. 뉴스 소스
| 소스 | RSS URL |
|---|---|
| TechCrunch AI | https://techcrunch.com/category/artificial-intelligence/feed/ |
| The Verge AI | https://www.theverge.com/rss/ai-artificial-intelligence/index.xml |

## 4. 기술 스택
| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js (App Router) |
| 로그인 | Clerk |
| 데이터베이스 | Neon (PostgreSQL) + Drizzle ORM |
| 번역·요약·분류 | Claude API |
| Notion 저장 | 공식 Notion MCP 서버 (`@notionhq/notion-mcp-server`) + 내부 통합 토큰 |
| RSS 파싱 | rss-parser |

## 5. 핵심 결정 사항
- 로그인 필수: 앱 실행 시 비로그인 사용자는 로그인 화면으로 이동.
- 데이터 범위: 기사·번역·요약은 **공용**(1회만 생성해 비용 절약), 카테고리와 Notion 저장 상태는 **사용자별**.
- 분류 방식: 사용자가 정의한 카테고리 목록 중에서 Claude가 선택. 해당 없으면 "기타".
- Notion 저장 위치: 환경변수로 지정한 **고정 DB 1개**.

## 6. 기능 요구사항

### 6.1 인증
- Clerk로 회원가입/로그인. 모든 페이지와 API는 인증 필요.
- 모든 사용자별 쿼리는 `userId` 조건을 포함.

### 6.2 뉴스 가져오기
- 상단 "뉴스 가져오기" 버튼 클릭 시 두 RSS 피드를 수집.
- URL 기준 중복 제거: 이미 DB에 있는 기사는 건너뜀.
- 새 기사만 Claude로 제목 번역 + 한국어 요약 생성 후 저장.
- 피드당 최신 N건(기본 20건)으로 제한.
- 진행 중 로딩 상태, 실패 시 오류 메시지 표시.

### 6.3 자동 카테고리 분류
- 가져온 기사는 사용자의 카테고리 목록(이름+설명)을 기준으로 자동 분류.
- 기본 시드 카테고리: 모델/제품, 투자/기업, 규제/정책, 연구, 기타.

### 6.4 뉴스 카드 목록
- 카드 구성: 한국어 제목, 한국어 요약, 출처, 발행일, 카테고리 뱃지, 원문 링크, "Notion 저장" 버튼.
- 최신순 정렬.
- 상단 카테고리 필터 칩으로 해당 카테고리 뉴스만 보기 (전체 보기 포함).

### 6.5 카테고리 관리
- 카테고리 추가, 이름/설명 수정, 삭제.
- 삭제 시 해당 매핑은 "미분류" 처리.
- 추가/수정 후 "재분류" 버튼으로 기존 기사에 변경 반영.

### 6.6 Notion 저장
- 카드의 "Notion 저장" 클릭 시 Notion MCP로 지정 DB에 페이지 생성.
- 저장 속성: 제목, 요약, 카테고리, 원문 링크, 출처, 발행일.
- 저장 완료 시 버튼이 "저장됨"으로 바뀌며 중복 저장 방지.
- 실패 시 오류 표시 후 재시도 가능.

## 7. 화면
- `/` 뉴스 카드 목록 (가져오기 버튼, 카테고리 필터)
- `/categories` 카테고리 관리
- Clerk 로그인/회원가입 페이지

## 8. 데이터 모델 (초안)
- `articles`: id, source, url(unique), title_en, title_ko, summary_ko, published_at, fetched_at
- `categories`: id, user_id, name, description, created_at
- `article_categories`: user_id, article_id, category_id (user+article 유니크)
- `notion_saves`: user_id, article_id, notion_page_id, saved_at (user+article 유니크)

## 9. API (초안)
- `POST /api/news/fetch`: RSS 수집·번역·요약·분류
- `GET /api/news?category=`: 뉴스 목록 조회
- `POST /api/news/reclassify`: 재분류
- `GET/POST /api/categories`, `PATCH/DELETE /api/categories/[id]`
- `POST /api/news/[id]/notion`: Notion 저장

## 10. 비기능 요구사항
- 비용: 기사당 번역·요약 1회만 수행하고 공용 저장.
- 보안: API 키와 토큰은 서버 환경변수로만 사용, 클라이언트 노출 금지.
- 환경변수: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`
- 반응형 UI (모바일에서도 카드 열람 가능).

## 11. 구현 순서
1. Next.js 초기화 + Clerk 연동 및 보호 라우트
2. Neon + Drizzle 스키마/마이그레이션
3. RSS 수집 + Claude 번역·요약·분류 API
4. 카드 목록 UI + 카테고리 필터
5. 카테고리 CRUD + 재분류
6. Notion MCP 저장
7. 로딩/에러 상태 정리

## 12. 검증 기준
- 비로그인 접근 시 로그인 화면으로 리다이렉트.
- "뉴스 가져오기" 후 기사·요약·카테고리가 생성되고, 재클릭 시 중복 생성 없음.
- 카테고리 필터 및 추가/수정/삭제 동작.
- Notion 저장 후 지정 DB에 페이지가 생성되고 버튼 상태가 변경.
- 서로 다른 계정 간 카테고리·저장 상태가 분리됨.

## 13. 미결 사항
- 배포 대상(로컬 전용 vs Vercel): Notion MCP stdio 서버 실행 가능 여부에 영향.
- Notion DB의 속성 구성(제목/요약/카테고리/링크/날짜) 확정.
- 사용할 Claude 모델(비용 대비 Haiku/Sonnet급) 확정.
