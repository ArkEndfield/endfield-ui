/* 页面里几处都要用的：拼站内和源文件的地址 */
import type { SiteData } from "./types.ts";

/** 站内的一页：`foundations/color/` → `/endfield-ui/design/foundations/color/` */
export const pageHref = (data: SiteData, route: string) =>
  `${data.base}${route}`;

/** 这一页的源文件在 GitHub 上的地址 */
export const sourceHref = (data: SiteData, source: string) =>
  `${data.links.github}/blob/main/${source}`;
