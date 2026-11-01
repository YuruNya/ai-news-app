export type Feed = {
  source: string;
  url: string;
  // `?paged=N`으로 이전 기사를 볼 수 있는 피드. The Verge는 최신 10건만 제공한다.
  paginated?: boolean;
};

export const FEEDS: Feed[] = [
  {
    source: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    paginated: true,
  },
  {
    source: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
];
