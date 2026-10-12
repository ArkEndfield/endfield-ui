/*
 * 一篇文档：面包屑和页头、正文（构建时从 Markdown 转好的 HTML，原样放进来）、
 * 够宽时右边一列页内目录，底下是上一篇 / 下一篇。
 */
import {
  Accordion,
  AccordionItem,
  ArrowLeft,
  ArrowRight,
  BackToTop,
  Breadcrumb,
  BreadcrumbItem,
  PageHeader,
  Toc,
  TocItem,
} from "@endfield-ui/react";
import { useEffect, useRef } from "react";
import { ExternalIcon } from "./icons.tsx";
import { pageHref, sourceHref } from "./site.ts";
import type { DocPage as DocPageData, PageLink, SiteData } from "./types.ts";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function Sibling({
  data,
  link,
  direction,
}: {
  data: SiteData;
  link: PageLink | undefined;
  direction: "prev" | "next";
}) {
  if (!link) return <span className="hidden sm:block" />;
  const next = direction === "next";
  return (
    <a
      href={pageHref(data, link.route)}
      rel={direction}
      className={`group flex min-w-0 items-center gap-3 border border-line px-4 py-3 transition-colors duration-(--duration-fast) hover:bg-ink/5 ${focusRing} ${next ? "justify-end text-right" : ""}`}
    >
      {!next && <ArrowLeft size={20} className="shrink-0 text-ink-secondary" />}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-tech text-xs text-ink-secondary">
          {next ? "下一篇" : "上一篇"}
        </span>
        <span className="font-medium wrap-anywhere">{link.title}</span>
      </span>
      {next && <ArrowRight size={20} className="shrink-0 text-ink-secondary" />}
    </a>
  );
}

export function DocPage({
  data,
  page,
  html,
}: {
  data: SiteData;
  page: DocPageData;
  html: string;
}) {
  const article = useRef<HTMLElement>(null);

  // 代码块右上角的"复制"：钮是构建时画进正文里的，这里只管点了之后的事
  useEffect(() => {
    const root = article.current;
    if (!root) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const onClick = (event: MouseEvent) => {
      const button = (
        event.target as Element | null
      )?.closest<HTMLButtonElement>("[data-copy]");
      const code = button?.parentElement?.querySelector("pre")?.textContent;
      if (!button || code == null) return;
      void navigator.clipboard.writeText(code).then(() => {
        button.textContent = "已复制";
        button.dataset.copied = "";
        const timer = setTimeout(() => {
          timers.delete(timer);
          button.textContent = "复制";
          delete button.dataset.copied;
        }, 1600);
        timers.add(timer);
      });
    };
    root.addEventListener("click", onClick);
    return () => {
      root.removeEventListener("click", onClick);
      for (const timer of timers) clearTimeout(timer);
    };
  }, []);

  const hasToc = page.toc.length > 1;

  return (
    <div className="flex items-start gap-10">
      <div className="min-w-0 flex-1">
        <PageHeader
          divider
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbItem href={data.base}>首页</BreadcrumbItem>
              <BreadcrumbItem href={`${data.base}#${page.group.key}`}>
                {page.group.title}
              </BreadcrumbItem>
              <BreadcrumbItem current>{page.title}</BreadcrumbItem>
            </Breadcrumb>
          }
          meta={`// ${page.group.latin}　${page.group.title}`}
          title={page.title}
          description={page.description || undefined}
        />

        {/* 窄了右边那一列放不下：目录收成一行，点开再看 */}
        {hasToc && (
          <Accordion size="sm" className="mt-6 xl:hidden">
            <AccordionItem value="toc" title="本页目录">
              <ul className="flex flex-col gap-2 pb-1 text-sm">
                {page.toc.map((entry) => (
                  <li
                    key={entry.id}
                    className={entry.level === 2 ? "pl-4" : undefined}
                  >
                    <a
                      href={`#${entry.id}`}
                      className={`text-ink-secondary hover:text-ink ${focusRing}`}
                    >
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ul>
            </AccordionItem>
          </Accordion>
        )}

        <article
          ref={article}
          id="doc-content"
          className="doc mt-8 max-w-3xl"
          // 水合时沿用服务器吐出来的那一份，见 entry-client.tsx
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <footer className="mt-16 flex max-w-3xl flex-col gap-6">
          <p className="font-tech text-xs text-ink-secondary">
            <a
              href={sourceHref(data, page.source)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 hover:text-ink ${focusRing}`}
            >
              在 GitHub 上看这一页的源文件
              <ExternalIcon size={12} />
            </a>
          </p>
          <nav
            aria-label="上一篇和下一篇"
            className="grid gap-3 sm:grid-cols-2"
          >
            <Sibling data={data} link={page.prev} direction="prev" />
            <Sibling data={data} link={page.next} direction="next" />
          </nav>
        </footer>
      </div>

      {hasToc && (
        <Toc
          title="// 本页"
          offset={24}
          className="sticky top-10 hidden max-h-[calc(100dvh-5rem)] w-52 shrink-0 overflow-y-auto overscroll-contain print:hidden xl:block"
        >
          {page.toc.map((entry) => (
            <TocItem key={entry.id} href={`#${entry.id}`} level={entry.level}>
              {entry.text}
            </TocItem>
          ))}
        </Toc>
      )}

      <BackToTop className="print:hidden" />
    </div>
  );
}
