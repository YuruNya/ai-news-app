# AI 뉴스 수집기

해외 AI 뉴스를 RSS로 모으고, Claude API로 한국어 번역·요약·카테고리 분류를 해서 카드로 보여주는 웹 앱입니다. 마음에 드는 기사는 버튼 한 번으로 Notion 데이터베이스에 저장할 수 있습니다.

혼자 쓰는 단일 사용자 앱이라 사용자별 데이터 분리는 없고, 로그인은 접근을 제한하는 용도로만 씁니다.

## 주요 기능

- **뉴스 가져오기:** TechCrunch AI와 The Verge AI의 RSS를 수집하고, URL 기준으로 중복을 걸러 새 기사만 저장합니다.
- **번역·요약·분류:** 새 기사의 제목과 요약을 한국어로 만들고 카테고리를 정합니다. 기사당 한 번만 처리해 API 비용을 아낍니다.
- **카테고리 필터:** 대시보드에서 카테고리별로 기사를 보고, 미분류 기사도 따로 볼 수 있습니다.
- **Notion 저장:** 카드의 '뉴스 저장' 버튼으로 지정한 Notion DB에 페이지를 만듭니다. 저장한 기사는 '저장됨 ✓'으로 바뀌고 중복 저장되지 않습니다.
- **로그인 보호:** 모든 페이지와 API에 Clerk 로그인이 필요합니다. 탭이나 브라우저를 닫았다가 다시 열면 다시 로그인해야 합니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript |
| 스타일 | Tailwind CSS 4 |
| 인증 | Clerk |
| 데이터베이스 | Neon (PostgreSQL), Drizzle ORM |
| 번역·요약·분류 | Claude API (`@anthropic-ai/sdk`) |
| Notion 저장 | `@notionhq/notion-mcp-server`, `@modelcontextprotocol/sdk` |
| RSS 파싱 | rss-parser |

## 시작하기

### 1. 준비물

- Node.js와 npm
- [Clerk](https://dashboard.clerk.com) 애플리케이션
- [Neon](https://neon.tech) PostgreSQL 데이터베이스
- [Anthropic API 키](https://console.anthropic.com/settings/keys)
- [Notion 내부 통합](https://www.notion.so/profile/integrations)과 저장할 데이터베이스

### 2. 설치

```bash
git clone https://github.com/YuruNya/ai-news-app.git
cd ai-news-app
npm install
```

### 3. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 만듭니다. 이 파일은 git에 올라가지 않습니다.

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=

# Neon PostgreSQL
DATABASE_URL=

# Anthropic Claude API
ANTHROPIC_API_KEY=
# 선택: 사용할 모델. 기본값은 claude-haiku-5-5
# ANTHROPIC_MODEL=

# Notion
NOTION_TOKEN=
NOTION_DATABASE_ID=
```

### 4. Notion 데이터베이스 준비

아래 속성을 이름과 유형까지 똑같이 만든 뒤, 데이터베이스의 연결(Connections)에 내부 통합을 추가합니다.

| 속성 | 유형 |
|---|---|
| 제목 | 제목(title) |
| URL | URL |
| 요약 | 텍스트 |
| 카테고리 | 선택(select) |
| 발행일 | 날짜 |

### 5. 데이터베이스 마이그레이션

```bash
npm run db:migrate
```

기본 카테고리(모델/제품, 투자/기업, 규제/정책, 연구, 기타)는 처음 뉴스를 가져올 때 자동으로 만들어집니다.

### 6. 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에 접속해 로그인하면 `/dashboard`로 이동합니다. 오른쪽 위 '뉴스 가져오기'를 누르면 기사가 수집됩니다.

## 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 실행 |
| `npm run db:generate` | 스키마 변경으로 마이그레이션 생성 |
| `npm run db:migrate` | 마이그레이션 적용 |
| `npm run db:push` | 스키마를 DB에 바로 반영 |
| `npm run db:studio` | Drizzle Studio 실행 |

## 프로젝트 구조

```
src/
├── app/
│   ├── api/news/fetch/          # POST: 뉴스 수집
│   ├── api/news/[id]/notion/    # POST: 기사를 Notion에 저장
│   ├── dashboard/               # 뉴스 카드 대시보드
│   └── page.tsx                 # /dashboard로 리다이렉트
├── components/                  # 카드, 카테고리 바, 버튼, 로그인 게이트
├── db/                          # Drizzle 스키마, 연결, 기본 카테고리
├── lib/
│   ├── claude/                  # 번역·요약·분류
│   ├── notion/                  # Notion MCP 저장
│   └── rss/                     # 피드 목록과 수집
└── proxy.ts                     # Clerk 미들웨어, 비로그인 API 차단
```

제품 명세는 `PRD.md`, UI 규칙은 `ui.md`에 있습니다.

## 사용한 플러그인

- Frontend Design : UI 디자인 품질 향상
- commit-commands : 깃 워크플로 자동화

## 아직 구현되지 않은 기능

- `/categories` 카테고리 관리 화면 (추가·수정·삭제)
- 재분류 기능 (`POST /api/news/reclassify`)

## 배포 참고

Notion 저장은 서버에서 MCP 서버를 자식 프로세스(stdio)로 실행하는 방식입니다. 로컬 실행을 기준으로 만들었으며, Vercel 같은 서버리스 환경에서 동작하는지는 확인되지 않았습니다.
