/*
 * 搜索：打开弹窗时才去取索引（构建时生成的 search.json，一页一条、按小节切开），
 * 在浏览器里按"包含这几个词"找。中文不分词——打进去的词原样去正文里找，
 * 所以"信号黄""surface-raised"这样的词都找得到；几个词之间用空格隔开，要同时出现。
 */
import { Dialog, Input, List, ListRow } from "@endfield-ui/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SearchIcon } from "./icons.tsx";
import { pageHref } from "./site.ts";
import type { SearchPage, SiteData } from "./types.ts";

type Hit = {
  key: string;
  href: string;
  /** 页名，和小节名（页首那一段没有小节名） */
  title: string;
  heading: string;
  group: string;
  snippet: [before: string, match: string, after: string];
  score: number;
};

const MAX_HITS = 30;

export function findHits(
  pages: SearchPage[],
  query: string,
  data: SiteData,
): Hit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const hits: Hit[] = [];

  for (const page of pages) {
    const title = page.title.toLowerCase();
    page.sections.forEach((section, index) => {
      const heading = section.heading.toLowerCase();
      const body = section.text.toLowerCase();
      // 页名只算在这一页的头一节上：不然搜页名会把它的每一节都列出来
      const scope =
        index === 0 ? `${title}\n${heading}\n${body}` : `${heading}\n${body}`;
      if (!terms.every((term) => scope.includes(term))) return;

      let score = 0;
      for (const term of terms) {
        if (index === 0 && title.includes(term)) score += 80;
        if (heading.includes(term)) score += 60;
        const at = body.indexOf(term);
        if (at >= 0) score += 10 + Math.max(0, 10 - at / 200);
      }

      // 摘要：正文里头一个词出现的地方，前后各留一点
      const first = terms
        .map((term) => ({ term, at: body.indexOf(term) }))
        .find((found) => found.at >= 0);
      const text = section.text;
      let snippet: Hit["snippet"];
      if (first) {
        const start = Math.max(0, first.at - 24);
        const end = Math.min(text.length, first.at + first.term.length + 64);
        snippet = [
          (start > 0 ? "…" : "") + text.slice(start, first.at),
          text.slice(first.at, first.at + first.term.length),
          text.slice(first.at + first.term.length, end) +
            (end < text.length ? "…" : ""),
        ];
      } else {
        snippet = ["", "", text.slice(0, 88) + (text.length > 88 ? "…" : "")];
      }

      hits.push({
        key: `${page.route}#${section.id}`,
        href: pageHref(data, page.route) + (section.id ? `#${section.id}` : ""),
        title: page.title,
        heading: section.heading,
        group: page.group,
        snippet,
        score,
      });
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, MAX_HITS);
}

export function SearchDialog({
  data,
  open,
  onOpenChange,
}: {
  data: SiteData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<SearchPage[] | null>(null);
  const [failed, setFailed] = useState(false);

  // 头一次打开才取索引；取到了就留着
  useEffect(() => {
    if (!open || pages || failed) return;
    let live = true;
    void fetch(`${data.base}search.json`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<SearchPage[]>;
      })
      .then((loaded) => {
        if (live) setPages(loaded);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [open, pages, failed, data.base]);

  // 同一页里的结果点了不会重新载入：地址里的锚点一变就把弹窗关上
  useEffect(() => {
    if (!open) return;
    const close = () => onOpenChange(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, [open, onOpenChange]);

  // 关上的时候把打过的字清掉：下一次打开是从头找
  const change = (next: boolean) => {
    if (!next) setQuery("");
    onOpenChange(next);
  };

  const hits = useMemo(
    () => (pages ? findHits(pages, query, data) : []),
    [pages, query, data],
  );
  const asked = query.trim() !== "";

  let status: ReactNode;
  if (failed) status = "搜索索引没有取到。刷新页面再试一次。";
  else if (!pages) status = "正在取索引…";
  else if (!asked)
    status = "打几个字开始找。几个词之间用空格隔开，要同时出现。";
  else if (!hits.length)
    status = `没有找到“${query.trim()}”。换一个词，或者少打几个字。`;
  else
    status =
      hits.length === MAX_HITS
        ? `前 ${MAX_HITS} 条结果`
        : `${hits.length} 条结果`;

  return (
    <Dialog open={open} onOpenChange={change} title="搜索文档" size="md">
      <div className="flex flex-col gap-3">
        <Input
          type="search"
          aria-label="搜索文档"
          placeholder="信号黄、切角、surface-raised…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            // 回车直接去头一条
            const top = hits[0];
            if (event.key === "Enter" && top) window.location.assign(top.href);
          }}
          start={<SearchIcon size={16} />}
        />
        <p role="status" className="font-tech text-xs text-ink-secondary">
          {status}
        </p>
        {hits.length > 0 && (
          <List
            aria-label="搜索结果"
            className="max-h-[50dvh] overflow-y-auto overscroll-contain"
          >
            {hits.map((hit) => (
              <ListRow
                key={hit.key}
                href={hit.href}
                description={
                  <>
                    {hit.snippet[0]}
                    {hit.snippet[1] && (
                      <mark className="bg-surface-inverse px-0.5 text-ink-inverse">
                        {hit.snippet[1]}
                      </mark>
                    )}
                    {hit.snippet[2]}
                  </>
                }
                end={
                  <span className="text-xs text-ink-secondary">
                    {hit.group}
                  </span>
                }
              >
                {hit.title}
                {hit.heading && (
                  <span className="text-ink-secondary">{` / ${hit.heading}`}</span>
                )}
              </ListRow>
            ))}
          </List>
        )}
      </div>
    </Dialog>
  );
}
