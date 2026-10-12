/* 构建时（和开发服务器上）把一页渲染成 HTML 字符串 */
import { renderToString } from "react-dom/server";
import { App } from "./App.tsx";
import type { SiteData } from "./types.ts";

export function render(data: SiteData, html: string) {
  return renderToString(<App data={data} html={html} />);
}
