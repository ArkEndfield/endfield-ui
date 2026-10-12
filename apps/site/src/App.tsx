import { DocPage } from "./DocPage.tsx";
import { Home } from "./Home.tsx";
import { Shell } from "./Shell.tsx";
import type { SiteData } from "./types.ts";

/** 一页：外壳里放首页，或者一篇文档。`html` 是那篇文档转好的正文 */
export function App({ data, html }: { data: SiteData; html: string }) {
  const { page } = data;
  return (
    <Shell data={data}>
      {page.kind === "home" ? (
        <Home data={data} page={page} />
      ) : (
        <DocPage data={data} page={page} html={html} />
      )}
    </Shell>
  );
}
