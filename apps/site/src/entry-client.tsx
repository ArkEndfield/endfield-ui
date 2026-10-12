/*
 * 浏览器里的入口：把服务器渲染好的那一页水合起来。
 *
 * 页面的数据（目录、这一页的标题和小节）在 HTML 里内嵌的一段 JSON 里。
 * 正文不在那段 JSON 里重复一遍——它已经在页面上了，水合前直接从 DOM 里读回来，
 * 交给 React 的还是同一份 HTML。
 */
import "./site.css";
import { hydrateRoot } from "react-dom/client";
import { App } from "./App.tsx";
import type { SiteData } from "./types.ts";

const root = document.getElementById("root");
const payload = document.getElementById("site-data")?.textContent;

if (root && payload) {
  const data = JSON.parse(payload) as SiteData;
  const html = document.getElementById("doc-content")?.innerHTML ?? "";
  hydrateRoot(root, <App data={data} html={html} />);
}
