# UI 가이드 — AI 뉴스 수집기

Tailwind CSS 4 기반의 UI 스타일 가이드다. 깔끔하고 읽기 편한 것을 최우선으로 한다. 새 화면이나 컴포넌트를 만들 때 이 문서의 토큰과 패턴을 따른다.

## 1. 디자인 원칙

- **읽기 우선:** 장식보다 텍스트 가독성. 여백을 넉넉히 두고 색은 절제한다.
- **한 가지 강조색:** 인디고 계열 하나만 강조에 쓴다. 나머지는 중립 회색(slate)이다.
- **일관된 둥근 모서리와 얕은 그림자:** 카드와 칩은 둥글게, 그림자는 최소한으로 한다.
- **모바일 우선 반응형:** 기본 스타일은 모바일, `sm:` `lg:`로 확장한다.
- **다크 모드:** `prefers-color-scheme`을 따른다. 모든 색은 라이트/다크 쌍으로 정의한다.

## 2. 디자인 토큰

### 색상

| 용도 | 라이트 | 다크 |
|---|---|---|
| 페이지 배경 | `bg-slate-50` | `dark:bg-slate-950` |
| 카드/표면 | `bg-white` | `dark:bg-slate-900` |
| 테두리 | `border-slate-200` | `dark:border-slate-800` |
| 본문 텍스트 | `text-slate-900` | `dark:text-slate-100` |
| 보조 텍스트 | `text-slate-500` | `dark:text-slate-400` |
| 강조(Primary) | `bg-indigo-600 text-white` | `dark:bg-indigo-500` |
| 강조 hover | `hover:bg-indigo-700` | `dark:hover:bg-indigo-400` |
| 위험(삭제) | `text-red-600` | `dark:text-red-400` |

### 타이포그래피

폰트는 `layout.tsx`의 Geist(`font-sans`)를 쓴다. 한글 가독성을 위해 본문 `leading-relaxed`를 기본으로 한다.

| 요소 | 클래스 |
|---|---|
| 앱 이름(헤더) | `text-lg font-bold tracking-tight` |
| 페이지 제목 | `text-2xl font-bold tracking-tight` |
| 카드 제목 | `text-base font-semibold leading-snug` |
| 카드 요약 | `text-sm leading-relaxed text-slate-600 dark:text-slate-300` |
| 메타 정보(출처·날짜) | `text-xs text-slate-500 dark:text-slate-400` |

### 간격·모양

- 페이지 가로 패딩: `px-4 sm:px-6`, 콘텐츠 최대 폭: `max-w-6xl mx-auto`
- 섹션 간격: `space-y-6`
- 카드: `rounded-xl border p-5 shadow-sm`
- 칩/버튼: `rounded-full` (칩), `rounded-lg` (일반 버튼)

## 3. 레이아웃 — 메인 대시보드 (`/`)

```
┌──────────────────────────────────────────────┐
│ 헤더: AI 뉴스 수집기        [가져오기] [사용자] │
├──────────────────────────────────────────────┤
│ 카테고리:  (전체) (모델) (정책) (기타) (+ 추가) │  ← 카드 목록 위
├──────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐            │
│ │ 뉴스   │ │ 뉴스   │ │ 뉴스   │            │
│ │ 카드   │ │ 카드   │ │ 카드   │            │
│ └────────┘ └────────┘ └────────┘            │
└──────────────────────────────────────────────┘
```

- 위에서 아래로: **헤더 → 카테고리 바 + 검색 바 → 뉴스 카드 그리드**.
- 검색 바는 `sm:` 이상에서 카테고리 바와 같은 줄의 오른쪽 끝에 두고, 모바일에서는 카테고리 바 아래 전체 폭으로 둔다.
- 카드 그리드: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`

```tsx
<div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
  <Header />
  <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
    <CategoryBar />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{/* NewsCard × N */}</div>
  </main>
</div>
```

## 4. 컴포넌트

### 4.1 헤더

앱 이름은 **AI 뉴스 수집기**. 오른쪽에 가져오기 버튼과 Clerk `UserButton`을 둔다. 스크롤 시 상단에 고정한다.

```tsx
<header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
  <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
    <h1 className="text-lg font-bold tracking-tight">AI 뉴스 수집기</h1>
    <div className="flex items-center gap-3">
      <button className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400">
        뉴스 가져오기
      </button>
      {/* <UserButton /> */}
    </div>
  </div>
</header>
```

- 가져오기 진행 중에는 `disabled`로 두고 라벨을 "가져오는 중…"으로 바꾼다.

### 4.2 카테고리 바 (카드 목록 위)

가로로 나열된 칩 목록이며, **맨 끝에 카테고리 추가 버튼**이 온다. 모바일에서는 줄바꿈 대신 가로 스크롤로 한 줄을 유지한다. 데스크톱(`sm:`)에서는 `flex-wrap`으로 줄바꿈한다.

- 첫 칩은 항상 **전체**.
- 선택된 칩만 강조색으로 채운다. 나머지는 테두리만 있는 중립 칩이다.
- "미분류"(`category_id`가 null)도 필터 칩으로 노출한다.
- 추가 버튼은 점선 테두리로 칩과 구분하되 높이와 모양은 같게 맞춘다.

```tsx
<nav aria-label="카테고리" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
  <ul className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
    {/* 선택됨 */}
    <li>
      <button aria-pressed="true" className="rounded-full bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white dark:bg-indigo-500">
        전체
      </button>
    </li>
    {/* 선택 안 됨 */}
    <li>
      <button aria-pressed="false" className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400">
        모델
      </button>
    </li>
    {/* 카테고리 추가 — 항상 마지막 */}
    <li>
      <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-400 dark:hover:text-indigo-400">
        <span aria-hidden>+</span> 카테고리 추가
      </button>
    </li>
  </ul>
</nav>
```

**카테고리 추가 동작:** 버튼을 누르면 이름·설명을 입력하는 작은 모달(또는 칩 자리에 인라인 입력)을 연다. 저장하면 목록 끝(추가 버튼 바로 앞)에 새 칩이 생긴다. 이름은 필수이고 중복이면 입력 아래에 오류 문구를 보여준다. 수정·삭제는 `/categories` 화면에서 한다.

### 4.3 뉴스 카드

구성 순서: 출처·날짜 → 한국어 제목 → 요약 → 카테고리 배지 + 액션. 카드 전체 높이를 맞추기 위해 `flex flex-col`로 두고 하단 액션을 `mt-auto`로 밀어낸다.

```tsx
<article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
  <div className="mb-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
    <span className="font-medium">TechCrunch</span>
    <span aria-hidden>·</span>
    <time dateTime="2026-11-01">2026.11.01</time>
  </div>

  <h2 className="text-base font-semibold leading-snug">
    <a href="원문 URL" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400">
      한국어 번역 제목
    </a>
  </h2>

  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
    한국어 요약 본문
  </p>

  <div className="mt-auto flex items-center justify-between pt-4">
    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
      모델
    </span>
    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
      Notion에 저장
    </button>
  </div>
</article>
```

- 요약은 `line-clamp-4`로 길이를 제한해 카드 높이를 고르게 한다.
- 카테고리가 null이면 배지를 회색(`bg-slate-100 text-slate-600`)의 "미분류"로 표시한다.
- 이미 저장된 기사(`notion_page_id` 있음)는 버튼을 비활성화하고 "저장됨 ✓"로 바꾼다. 색은 `text-emerald-600 dark:text-emerald-400`이다.

### 4.4 상태 화면

| 상태 | 표현 |
|---|---|
| 로딩 | 카드 모양 스켈레톤 `animate-pulse` + `bg-slate-200 dark:bg-slate-800` 블록 |
| 빈 목록 | 가운데 정렬 안내문 "아직 기사가 없어요. 오른쪽 위 '뉴스 가져오기'를 눌러보세요." |
| 필터 결과 없음 | "이 카테고리에는 기사가 없어요." |
| 검색 결과 없음 | "'키워드'에 해당하는 기사가 없어요." |
| 오류 | `rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700` (다크: `dark:border-red-900 dark:bg-red-950 dark:text-red-300`) |

## 5. 상호작용·접근성

- 모든 버튼과 링크에 `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500`를 적용한다.
- 터치 대상은 모바일에서 높이 32px 이상을 유지한다 (`py-1.5` 이상).
- 선택형 칩에는 `aria-pressed`, 카테고리 바에는 `aria-label="카테고리"`를 둔다.
- 전환은 `transition` 한 가지로 통일한다. 과한 애니메이션은 쓰지 않는다.
- 색만으로 상태를 구분하지 않는다 (예: 저장됨은 색과 함께 "✓" 텍스트도 쓴다).

## 6. 구현 메모

- `globals.css`의 `body` 폰트가 Arial로 고정되어 있다. Geist를 쓰려면 `font-family`를 제거하고 `<body>`에 `font-sans`를 적용한다.
- 현재 다크 모드는 CSS 변수 기반이다. 위 `dark:` 클래스는 Tailwind 4 기본값(`prefers-color-scheme`)과 같은 방식으로 동작하므로 추가 설정이 필요 없다.
- 색 클래스를 컴포넌트마다 반복하지 않도록 `Chip`, `NewsCard`, `Button` 같은 작은 컴포넌트로 묶는다.
