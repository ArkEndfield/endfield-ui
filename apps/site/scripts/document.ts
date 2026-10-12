/* 每一页的 HTML 外壳：<head>、渲染好的页面、内嵌的数据。构建和开发服务器共用 */
import type { SiteData } from "../src/types.ts";
import { repoUrl } from "./content.ts";

export const siteName = "endfield-ui 设计规范";
export const siteDescription =
  "《明日方舟：终末地》风格的设计指导文档：色彩、字体、形状、布局、动效，标志性的母题，以及每个控件的规格。非官方。";

/** 站点对外的地址，写进 canonical 和分享卡片里 */
export const siteOrigin =
  process.env.SITE_ORIGIN ?? "https://icaruszezen.github.io";

export function siteLinks(): SiteData["links"] {
  return {
    storybook: process.env.SITE_STORYBOOK ?? `${siteOrigin}/endfield-ui/`,
    github: repoUrl,
    npm: "https://www.npmjs.com/package/@endfield-ui/react",
    notice: `${repoUrl}/blob/main/NOTICE.md`,
  };
}

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/*
 * 样式到之前就把主题写到 <html> 上，页面不会先亮一下再变暗。
 * 取值顺序和组件库的 useTheme 一致：记着的选择 → 没记过就跟系统。
 */
const themeScript = `(function(){var d=document.documentElement,m=false;try{var t=localStorage.getItem("ef-theme");m=t==="dark"||((t===null||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches)}catch(e){}d.dataset.theme=m?"dark":"light"})()`;

/* 站点的小图标：一个墨色方块加一条信号黄的竖条，原创的几何形 */
const icon = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#191919"/><rect x="7" y="8" width="4" height="16" fill="#fffa00"/></svg>',
)}`;

export type DocumentAssets = {
  /** 样式表的地址 */
  styles: string[];
  /** 模块脚本的地址，按顺序载入 */
  scripts: string[];
};

export function documentHtml({
  data,
  body,
  assets,
}: {
  data: SiteData;
  /** 渲染好的页面，放进 #root */
  body: string;
  assets: DocumentAssets;
}) {
  const { page } = data;
  const title = page.kind === "home" ? siteName : `${page.title} · ${siteName}`;
  const description =
    page.kind === "home"
      ? siteDescription
      : page.summary || page.description || siteDescription;
  const url = `${siteOrigin}${data.base}${page.route}`;
  // 内嵌的 JSON 里不能出现 </script>
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="canonical" href="${escape(url)}">
<meta property="og:type" content="${page.kind === "home" ? "website" : "article"}">
<meta property="og:site_name" content="${escape(siteName)}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${escape(url)}">
<meta property="og:locale" content="zh_CN">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${icon}">
<script>${themeScript}</script>
${assets.styles.map((href) => `<link rel="stylesheet" href="${escape(href)}">`).join("\n")}
${assets.scripts.map((src) => `<script type="module" src="${escape(src)}"></script>`).join("\n")}
</head>
<body>
<div id="root">${body}</div>
<script id="site-data" type="application/json">${payload}</script>
</body>
</html>
`;
}
