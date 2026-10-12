/* 构建脚本和页面共用的数据形状。页面拿到的是每一页 HTML 里内嵌的那份 JSON */

export type NavItem = {
  /** 目录里的名字，取自 docs/README.md 的索引 */
  title: string;
  /** 索引里跟在名字后面的那句说明，可以没有 */
  description: string;
  /** 站内路径，不带站点的 base，末尾有斜杠：`foundations/color/` */
  route: string;
};

export type NavGroup = {
  /** `foundations`、`elements`… */
  key: string;
  /** 基础、母题… */
  title: string;
  /** 页头微文字行里的英文：`FOUNDATIONS` */
  latin: string;
  /** 索引里这一组标题下面的那句话 */
  intro: string;
  items: NavItem[];
};

export type TocEntry = {
  id: string;
  text: string;
  /** 1 是二级标题，2 是三级标题 */
  level: 1 | 2;
};

export type PageLink = { title: string; route: string };

export type HomePage = {
  kind: "home";
  route: "";
  title: string;
  description: string;
  /** 首屏上的两个读数，构建时数出来的 */
  stats: { docs: number; figures: number };
};

export type DocPage = {
  kind: "doc";
  route: string;
  /** 文档自己的一级标题 */
  title: string;
  /** 索引里的那句说明，可以是空的 */
  description: string;
  /** 给 <meta name="description"> 的：正文的第一段 */
  summary: string;
  group: { key: string; title: string; latin: string };
  toc: TocEntry[];
  /** 源文件在仓库里的路径：`docs/design/foundations/color.md` */
  source: string;
  prev?: PageLink;
  next?: PageLink;
};

export type Page = HomePage | DocPage;

export type SiteLinks = {
  storybook: string;
  github: string;
  npm: string;
  notice: string;
};

export type SiteData = {
  /** 站点挂在哪个路径下，首尾带斜杠 */
  base: string;
  nav: NavGroup[];
  page: Page;
  links: SiteLinks;
};

/** 搜索索引：一页一条，里面按小节切开 */
export type SearchPage = {
  route: string;
  title: string;
  group: string;
  sections: { id: string; heading: string; text: string }[];
};
