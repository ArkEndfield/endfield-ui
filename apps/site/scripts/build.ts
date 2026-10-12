/*
 * 构建文档站：pnpm build:site
 *
 * 1. 读文档并核对（链接、锚点、图、令牌表）——有一条不过就停；
 * 2. 打包浏览器里用的脚本和样式；
 * 3. 把每一页渲染成一份完整的 index.html（正文都在 HTML 里，不开脚本也能读）；
 * 4. 拷图解、写搜索索引。
 *
 * 产物在 apps/site/dist，可以直接当静态站点发布。
 */
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import type { SiteData } from "../src/types.ts";
import { base } from "./base.ts";
import { checkDocs } from "./check.ts";
import {
  documentHtml,
  siteDescription,
  siteLinks,
  siteName,
} from "./document.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist");
// 服务端渲染用的那一份只在构建时用一下，不进产物
const serverDir = join(root, "node_modules", ".site-server");

const started = Date.now();

const { content, errors } = await checkDocs(base);
if (errors.length) {
  console.error(`文档核对没过，${errors.length} 处，站点没有构建：\n`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

await build({ root, logLevel: "warn" });
await build({
  root,
  logLevel: "warn",
  // 渲染用的那一份把依赖都打进去：组件库是按源码引进来的，它的依赖从这个应用的目录里找不到
  ssr: { noExternal: true },
  build: {
    ssr: "src/entry-server.tsx",
    outDir: serverDir,
    emptyOutDir: true,
    manifest: false,
    rolldownOptions: { input: "src/entry-server.tsx" },
  },
});

type Manifest = Record<string, { file: string; css?: string[] }>;
const manifest = JSON.parse(
  readFileSync(join(outDir, ".vite", "manifest.json"), "utf8"),
) as Manifest;
const entry = manifest["src/entry-client.tsx"];
if (!entry) throw new Error("打包结果里没有找到 src/entry-client.tsx");
const assets = {
  styles: (entry.css ?? []).map((file) => base + file),
  scripts: [base + entry.file],
};
// 清单只是构建时用来找文件名的
rmSync(join(outDir, ".vite"), { recursive: true, force: true });

const { render } = (await import(
  pathToFileURL(join(serverDir, "entry-server.js")).href
)) as { render: (data: SiteData, html: string) => string };

const links = siteLinks();
const write = (route: string, data: SiteData, html: string) => {
  const file = join(outDir, route, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, documentHtml({ data, body: render(data, html), assets }));
};

write(
  "",
  {
    base,
    nav: content.nav,
    links,
    page: {
      kind: "home",
      route: "",
      title: siteName,
      description: siteDescription,
      stats: { docs: content.pages.length, figures: content.figures.size },
    },
  },
  "",
);
for (const page of content.pages) {
  write(
    page.meta.route,
    { base, nav: content.nav, links, page: page.meta },
    page.html,
  );
}

for (const [from, to] of content.figures) {
  const file = join(outDir, "figures", to);
  mkdirSync(dirname(file), { recursive: true });
  cpSync(from, file);
}

writeFileSync(
  join(outDir, "search.json"),
  JSON.stringify(content.pages.map((page) => page.search)),
);

rmSync(serverDir, { recursive: true, force: true });

console.log(
  `文档站构建好了：${content.pages.length + 1} 页、${content.figures.size} 张图解，用时 ${((Date.now() - started) / 1000).toFixed(1)} 秒 → apps/site/dist（挂在 ${base} 下）`,
);
