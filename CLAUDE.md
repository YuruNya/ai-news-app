# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 상태

`PRD.md`(한국어)가 제품 명세다. 현재는 `create-next-app`으로 만든 기본 템플릿(Next.js 16 App Router, TypeScript, Tailwind CSS 4, ESLint, `src/` 디렉터리, alias `@/*`)만 있고, PRD의 기능은 아직 구현되지 않았다. PRD §11의 구현 순서를 따른다. Clerk, Drizzle/Neon, rss-parser, Anthropic SDK, Notion MCP 의존성은 아직 설치되지 않았다.

## UI 가이드

화면이나 컴포넌트를 만들거나 수정하기 전에 `ui.md`를 읽는다. 색상·타이포그래피 토큰, 대시보드 레이아웃, 카테고리 바, 뉴스 카드 등 Tailwind 스타일 규칙이 정리되어 있으며, UI 코드는 이 문서를 따른다.

## 명령어

```
npm run dev     # 개발 서버 (Turbopack)
npm run build   # 프로덕션 빌드
npm run lint    # ESLint
```

테스트 러너는 설정되어 있지 않다.

## 개발 워크플로

새 기능은 `/news-workflow [브랜치-이름]` 명령(`.claude/commands/news-workflow.md`)으로 개발한다. main 확인 → 브랜치 생성 → 스택·컨벤션 안내 → 개발 → `완료` 또는 `done` 입력 → 변경 파일 확인과 커밋 메시지 제안 → 사용자 확인 후 커밋 → main에 `--no-ff` 병합 → 작업 요약 순서로 진행한다. 브랜치 이름을 생략하면 기능을 물어본 뒤 영어 소문자-하이픈 형식으로 제안한다.

## Next.js 주의

`AGENTS.md`에 따라, 이 Next.js 버전(16.x)은 기존 지식과 다른 점(API, 규칙, 파일 구조)이 있다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 관련 가이드를 읽고 deprecation 안내를 따른다. 예를 들어 인증 보호 라우트를 만들 때 `middleware` 규칙이 바뀌었을 수 있으니 확인한다.

## 아키텍처 (PRD 요약)

AI 뉴스 수집기: TechCrunch AI와 The Verge AI의 RSS를 수집하고, Claude API로 한국어 제목 번역·요약·카테고리 분류를 해서 카드로 보여주며, 선택한 기사를 Notion에 저장한다.

구현 시 여러 파일에 걸쳐 지켜야 할 핵심 제약:

- **단일 사용자, 테이블 2개:** 혼자 쓰는 앱이라 사용자별 분리가 없다. `articles`(원문 URL unique, 한국어 제목·요약, `category_id`, `notion_page_id`)와 `categories`(name unique)만 있고 `userId` 조건은 쓰지 않는다. 기사당 번역·요약은 1회만 수행한다. `category_id`가 null이면 미분류, `notion_page_id`가 있으면 이미 Notion에 저장된 기사다.
- **인증:** Clerk. 모든 페이지와 API가 인증 필수이고 비로그인 사용자는 로그인 화면으로 리다이렉트한다.
- **가져오기 흐름 (`POST /api/news/fetch`):** 피드당 최신 N건(기본 20) → URL 기준 중복 제거 → 새 기사만 Claude로 번역·요약 → 카테고리 목록(이름+설명) 중에서 분류, 해당 없으면 "기타".
- **카테고리 삭제:** 해당 기사의 `category_id`가 null("미분류")이 된다. "재분류" 버튼(`POST /api/news/reclassify`)으로 기존 기사에 변경을 반영한다.
- **Notion 저장:** 공식 `@notionhq/notion-mcp-server`(MCP)와 내부 통합 토큰으로 `NOTION_DATABASE_ID`의 고정 DB 1개에 페이지를 만든다. 저장된 기사는 중복 저장을 막는다. 서버에서 MCP stdio 프로세스를 실행해야 하므로 배포 대상(로컬 vs Vercel)이 미결 사항이다(PRD §13).
- **비밀값:** 환경변수(`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`)는 서버에서만 쓰고 `NEXT_PUBLIC_` 외에는 클라이언트에 노출하지 않는다.
- **화면:** `/`(카드 목록, 가져오기 버튼, 카테고리 필터 칩), `/categories`(카테고리 CRUD), Clerk 로그인/회원가입. 모바일 반응형.
