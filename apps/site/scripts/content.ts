/*
 * 把 docs/ 下的设计文档读成站点的内容。
 *
 * - 目录取自 docs/README.md 的"全部文档"一节：分组、顺序、每篇后面的那句说明。
 * - 每篇 Markdown 原地读，转成 HTML；文档之间的相对链接改成站内路径，
 *   指到 docs/design 之外的改成 GitHub 上的地址，图解改到 figures/ 下。
 * - 顺手把坏掉的东西记下来（目标不存在、锚点不存在、文档没进索引）：
 *   构建时有一条就不出站点。
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Element, ElementContent, Root, Text } from "hast";
import { toString as textOf } from "hast-util-to-string";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createCssVariablesTheme, createHighlighter } from "shiki";
import { unified } from "unified";
import type {
  DocPage,
  NavGroup,
  PageLink,
  SearchPage,
  TocEntry,
} from "../src/types.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, "..", "..", "..");
export const docsDir = join(repoRoot, "docs");
export const designDir = join(docsDir, "design");
export const assetsDir = join(designDir, "assets");
export const indexFile = join(docsDir, "README.md");
export const repoUrl = "https://github.com/icaruszezen/endfield-ui";

/** 索引里的组名对应的目录名和页头上的英文。索引里多出一组而这里没有，构建会报错 */
const groupMeta: Record<string, { key: string; latin: string }> = {
  总纲: { key: "overview", latin: "OVERVIEW" },
  基础: { key: "foundations", latin: "FOUNDATIONS" },
  母题: { key: "elements", latin: "ELEMENTS" },
  载体: { key: "surfaces", latin: "SURFACES" },
  组件: { key: "components", latin: "COMPONENTS" },
  "Game 实机风格": { key: "game", latin: "GAME" },
  依据: { key: "references", latin: "REFERENCES" },
};

const EVIDENCE = "实测|观察|社区|推断";
/** 表格单元格开头的来源等级：`实测`、`观察 + 社区`、`实测（官网首页大按钮）` */
const evidencePrefix = new RegExp(
  `^((?:${EVIDENCE})(?:\\s*\\+\\s*(?:${EVIDENCE}))*)(?=$|[（(：:；;，,、 ])`,
);

export type BuiltPage = {
  /** 源文件的绝对路径 */
  file: string;
  meta: DocPage;
  html: string;
  search: SearchPage;
};

export type Content = {
  nav: NavGroup[];
  pages: BuiltPage[];
  /** 要拷进产物的图解：源文件 → figures/ 下的相对路径 */
  figures: Map<string, string>;
  errors: string[];
};

const toPosix = (path: string) => path.split(sep).join("/");
const inRepo = (file: string) => toPosix(relative(repoRoot, file));

function walkFiles(dir: string, test: (file: string) => boolean): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) out.push(...walkFiles(file, test));
    else if (test(file)) out.push(file);
  }
  return out;
}

/** `docs/design/foundations/color.md` → `foundations/color/`；各目录的 README 就是那个目录 */
function routeOf(file: string) {
  const path = toPosix(relative(designDir, file)).replace(/\.md$/, "");
  if (basename(path) === "README") return `${toPosix(dirname(path))}/`;
  return `${path}/`;
}

type IndexEntry = {
  title: string;
  description: string;
  group: { key: string; title: string; latin: string };
};

/** 读 docs/README.md 的"全部文档"：站点的目录就是它 */
function readIndex(errors: string[]) {
  const lines = readFileSync(indexFile, "utf8").split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "## 全部文档");
  if (start < 0) {
    errors.push("docs/README.md 里没有找到“## 全部文档”这一节");
    return { nav: [], entries: new Map<string, IndexEntry>() };
  }
  const nav: NavGroup[] = [];
  const entries = new Map<string, IndexEntry>();
  let group: NavGroup | undefined;
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    const heading = /^### (.+)$/.exec(line);
    if (heading) {
      const title = heading[1]!.trim();
      const meta = groupMeta[title];
      if (!meta) {
        errors.push(
          `docs/README.md 的索引里多了一组“${title}”：在 apps/site/scripts/content.ts 的 groupMeta 里补上它`,
        );
        group = undefined;
        continue;
      }
      group = { ...meta, title, intro: "", items: [] };
      nav.push(group);
      continue;
    }
    if (!group) continue;
    const item = /^- \[([^\]]+)\]\(([^)]+)\)(?:——(.*))?$/.exec(line.trim());
    if (item) {
      const file = resolve(docsDir, item[2]!);
      const entry: IndexEntry = {
        title: item[1]!,
        description: (item[3] ?? "").trim(),
        group: { key: group.key, title: group.title, latin: group.latin },
      };
      if (!existsSync(file)) {
        errors.push(`docs/README.md 的索引指向了不存在的文件：${item[2]!}`);
        continue;
      }
      if (!file.startsWith(designDir + sep)) {
        errors.push(
          `docs/README.md 的索引里有 docs/design 之外的文件：${item[2]!}`,
        );
        continue;
      }
      entries.set(file, entry);
      group.items.push({
        title: entry.title,
        description: entry.description,
        route: routeOf(file),
      });
    } else if (line.trim() && !line.startsWith("-") && !group.items.length) {
      group.intro = line.trim();
    }
  }
  return { nav, entries };
}

function element(
  tagName: string,
  properties: Element["properties"],
  children: ElementContent[] = [],
): Element {
  return { type: "element", tagName, properties, children };
}

const text = (value: string): Text => ({ type: "text", value });

const classOf = (node: Element) => {
  const value = node.properties.className;
  return Array.isArray(value) ? value.map(String) : [];
};

/** SVG 的画布尺寸：给 <img> 写上宽高，图还没到时版面不跳 */
function svgSize(file: string) {
  const match = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(
    readFileSync(file, "utf8").slice(0, 600),
  );
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

type PendingLink = { from: string; target: string; anchor: string };

type Context = {
  file: string;
  base: string;
  routes: Map<string, string>;
  figures: Map<string, string>;
  errors: string[];
  pending: PendingLink[];
  toc: TocEntry[];
  highlight: (code: string, lang: string) => Element;
};

function rewriteLink(node: Element, context: Context) {
  const href = node.properties.href;
  if (typeof href !== "string") return;
  const where = inRepo(context.file);
  const external = () => {
    node.properties.target = "_blank";
    node.properties.rel = ["noopener", "noreferrer"];
    node.properties.className = [...classOf(node), "doc-ext"];
  };
  if (/^(https?:|mailto:)/.test(href)) {
    external();
    return;
  }
  const [path, anchor] = href.split("#") as [string, string | undefined];
  const fragment = anchor === undefined ? "" : decodeURIComponent(anchor);
  if (!path) {
    // 同一页里的锚点
    context.pending.push({
      from: where,
      target: context.file,
      anchor: fragment,
    });
    return;
  }
  const target = resolve(dirname(context.file), decodeURI(path));
  if (!target.startsWith(repoRoot + sep) || !existsSync(target)) {
    context.errors.push(`${where}：链接的目标不存在：${href}`);
    return;
  }
  const route = context.routes.get(target);
  if (route !== undefined) {
    node.properties.href = `${context.base}${route}${fragment ? `#${fragment}` : ""}`;
    if (fragment)
      context.pending.push({ from: where, target, anchor: fragment });
    return;
  }
  // 站里没有这一页：仓库里别的文件，链到 GitHub 上去
  const kind = statSync(target).isDirectory() ? "tree" : "blob";
  node.properties.href = `${repoUrl}/${kind}/main/${inRepo(target)}${fragment ? `#${fragment}` : ""}`;
  external();
}

function figureOf(image: Element, context: Context): Element | null {
  const src = image.properties.src;
  if (typeof src !== "string" || /^https?:/.test(src)) return null;
  const where = inRepo(context.file);
  const target = resolve(dirname(context.file), decodeURI(src));
  if (!existsSync(target)) {
    context.errors.push(`${where}：图不存在：${src}`);
    return null;
  }
  if (!target.startsWith(assetsDir + sep)) {
    context.errors.push(`${where}：图不在 docs/design/assets 下：${src}`);
    return null;
  }
  const path = toPosix(relative(assetsDir, target));
  context.figures.set(target, path);
  const size = target.endsWith(".svg") ? svgSize(target) : null;
  const alt =
    typeof image.properties.alt === "string" ? image.properties.alt : "";
  const url = `${context.base}figures/${path}`;
  return element("figure", { className: ["doc-figure"] }, [
    // 图在窄屏上被缩得很小：点它在新标签页里打开原图，可以放大看
    element(
      "a",
      {
        href: url,
        target: "_blank",
        rel: ["noopener"],
        ariaLabel: `${alt || "图解"}（在新标签页打开大图）`,
      },
      [
        element("img", {
          src: url,
          alt,
          ...size,
          loading: "lazy",
          decoding: "async",
        }),
      ],
    ),
    ...(alt ? [element("figcaption", {}, [text(alt)])] : []),
  ]);
}

/** 单元格开头的来源等级换成小标签 */
function markEvidence(cell: Element) {
  const first = cell.children[0];
  if (first?.type !== "text") return;
  const match = evidencePrefix.exec(first.value);
  if (!match) return;
  const levels = match[1]!.split("+").map((level) => level.trim());
  const marked: ElementContent[] = [];
  levels.forEach((level, index) => {
    if (index > 0) marked.push(text(" + "));
    marked.push(
      element("span", { className: ["doc-evidence"], dataLevel: level }, [
        text(level),
      ]),
    );
  });
  const rest = first.value.slice(match[0].length);
  cell.children.splice(0, 1, ...marked, ...(rest ? [text(rest)] : []));
}

function transform(parent: Root | Element, context: Context, inPre = false) {
  for (let index = 0; index < parent.children.length; index += 1) {
    const node = parent.children[index]!;
    const kind: string = node.type;
    if (kind === "raw") {
      const value = "value" in node ? node.value : "";
      context.errors.push(
        `${inRepo(context.file)}：正文里有原始的 HTML（${value.slice(0, 40)}），站点不渲染它——放进反引号或代码块里`,
      );
      continue;
    }
    if (node.type !== "element") continue;

    // 代码块：高亮之后整块换掉，里面不再往下走
    if (node.tagName === "pre") {
      const code = node.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "code",
      );
      if (code) {
        const lang = classOf(code)
          .find((name) => name.startsWith("language-"))
          ?.slice("language-".length);
        parent.children[index] = context.highlight(
          textOf(code).replace(/\n$/, ""),
          lang ?? "",
        );
      }
      continue;
    }

    // 只放了一张图的段落：换成带说明的图
    if (node.tagName === "p") {
      const meaningful = node.children.filter(
        (child) => !(child.type === "text" && !child.value.trim()),
      );
      const only = meaningful[0];
      if (
        meaningful.length === 1 &&
        only?.type === "element" &&
        only.tagName === "img"
      ) {
        const figure = figureOf(only, context);
        if (figure) {
          parent.children[index] = figure;
          continue;
        }
      }
    }

    if (node.tagName === "table") {
      transform(node, context);
      // 宽表格在自己里面横向滚动；能聚焦，键盘才滚得动它
      parent.children[index] = element(
        "div",
        {
          className: ["doc-table"],
          role: "region",
          ariaLabel: "表格",
          tabIndex: 0,
        },
        [node],
      );
      continue;
    }

    if (/^h[2-4]$/.test(node.tagName)) {
      transform(node, context);
      const id =
        typeof node.properties.id === "string" ? node.properties.id : "";
      const title = textOf(node);
      if (id && (node.tagName === "h2" || node.tagName === "h3")) {
        context.toc.push({
          id,
          text: title,
          level: node.tagName === "h2" ? 1 : 2,
        });
      }
      if (id) {
        node.children.push(
          element(
            "a",
            {
              className: ["doc-anchor"],
              href: `#${id}`,
              ariaLabel: `“${title}”这一节的链接`,
            },
            [text("#")],
          ),
        );
      }
      continue;
    }

    if (node.tagName === "a") rewriteLink(node, context);

    if (node.tagName === "code" && !inPre) {
      const value = textOf(node);
      // 短的名字（令牌、类名、属性）整个不折行：不然窄屏上会在连字符处断成两截
      if (value.length <= 28 && !/\s/.test(value)) {
        node.properties.className = [...classOf(node), "doc-nowrap"];
      }
      if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) {
        node.properties.className = [...classOf(node), "doc-hex"];
        node.children.unshift(
          element("span", {
            className: ["doc-swatch"],
            style: `background-color:${value}`,
            ariaHidden: "true",
          }),
        );
        continue;
      }
    }

    if (node.tagName === "td") markEvidence(node);

    transform(node, context, inPre);
  }
}

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

/** 按二、三级标题把正文切成小节，给搜索用。要在改写之前切：那时还没有锚点的 # 和图的说明 */
function sectionsOf(tree: Root) {
  const sections: SearchPage["sections"] = [{ id: "", heading: "", text: "" }];
  for (const node of tree.children) {
    if (node.type !== "element") continue;
    if (node.tagName === "h1") continue;
    if (node.tagName === "h2" || node.tagName === "h3") {
      const id =
        typeof node.properties.id === "string" ? node.properties.id : "";
      sections.push({ id, heading: normalize(textOf(node)), text: "" });
      continue;
    }
    const current = sections[sections.length - 1]!;
    current.text = normalize(`${current.text} ${textOf(node)}`);
  }
  return sections.filter((section) => section.heading || section.text);
}

export async function loadContent(base: string): Promise<Content> {
  const errors: string[] = [];
  const { nav, entries } = readIndex(errors);

  // 每篇文档都要在索引里：不在的话站里就没有它的入口
  const files = walkFiles(designDir, (file) => file.endsWith(".md"));
  for (const file of files) {
    if (!entries.has(file)) {
      errors.push(`${inRepo(file)} 没有列进 docs/README.md 的“全部文档”`);
    }
  }

  const routes = new Map<string, string>();
  for (const file of entries.keys()) routes.set(file, routeOf(file));

  const highlighter = await createHighlighter({
    themes: [
      createCssVariablesTheme({ name: "ef", variablePrefix: "--code-" }),
    ],
    langs: ["css", "html", "tsx"],
  });
  const loaded = new Set(highlighter.getLoadedLanguages());
  const highlight = (code: string, lang: string): Element => {
    const tree = highlighter.codeToHast(code, {
      lang: loaded.has(lang) ? lang : "text",
      theme: "ef",
    });
    const pre = tree.children.find(
      (child): child is Element =>
        child.type === "element" && child.tagName === "pre",
    );
    const block =
      pre ?? element("pre", {}, [element("code", {}, [text(code)])]);
    // 颜色由站点的样式给，不用它内联写的那一份
    block.properties = { className: ["doc-code"], tabIndex: 0 };
    // 复制钮先画在这里，点了有没有反应由页面上的脚本管
    return element(
      "div",
      { className: ["doc-codeblock"], dataLang: lang || undefined },
      [
        block,
        element(
          "button",
          { type: "button", className: ["doc-copy"], dataCopy: "" },
          [text("复制")],
        ),
      ],
    );
  };

  const parser = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug);
  const serializer = unified().use(rehypeStringify);

  const figures = new Map<string, string>();
  const pending: PendingLink[] = [];
  const slugs = new Map<string, Set<string>>();
  const pages: BuiltPage[] = [];

  for (const [file, entry] of entries) {
    const source = readFileSync(file, "utf8");
    const tree = parser.runSync(parser.parse(source));
    const route = routes.get(file)!;

    const ids = new Set<string>();
    const collect = (node: Root | Element) => {
      for (const child of node.children) {
        if (child.type !== "element") continue;
        if (typeof child.properties.id === "string")
          ids.add(child.properties.id);
        collect(child);
      }
    };
    collect(tree);
    slugs.set(file, ids);

    // 一级标题交给页头画，正文里不再出现
    const headingIndex = tree.children.findIndex(
      (node) => node.type === "element" && node.tagName === "h1",
    );
    const heading = tree.children[headingIndex];
    const title =
      heading?.type === "element" ? normalize(textOf(heading)) : entry.title;
    if (headingIndex < 0) errors.push(`${inRepo(file)} 没有一级标题`);

    const sections = sectionsOf(tree);
    if (headingIndex >= 0) tree.children.splice(headingIndex, 1);
    const lead = tree.children.find(
      (node) => node.type === "element" && node.tagName === "p",
    );
    const summary = lead
      ? normalize(textOf(lead)).slice(0, 140)
      : entry.description;

    const toc: TocEntry[] = [];
    transform(tree, {
      file,
      base,
      routes,
      figures,
      errors,
      pending,
      toc,
      highlight,
    });

    pages.push({
      file,
      html: serializer.stringify(tree),
      meta: {
        kind: "doc",
        route,
        title,
        description: entry.description,
        summary,
        group: entry.group,
        toc,
        source: inRepo(file),
      },
      search: { route, title, group: entry.group.title, sections },
    });
  }
  highlighter.dispose();

  for (const { from, target, anchor } of pending) {
    if (!slugs.get(target)?.has(anchor)) {
      errors.push(`${from}：锚点不存在：${inRepo(target)}#${anchor}`);
    }
  }

  // 上一篇、下一篇：按目录的顺序
  const order = nav.flatMap((group) => group.items);
  pages.sort(
    (a, b) =>
      order.findIndex((item) => item.route === a.meta.route) -
      order.findIndex((item) => item.route === b.meta.route),
  );
  pages.forEach((page, index) => {
    const link = (
      item: (typeof order)[number] | undefined,
    ): PageLink | undefined => item && { title: item.title, route: item.route };
    page.meta.prev = link(order[index - 1]);
    page.meta.next = link(order[index + 1]);
  });

  // 没有文档引用的图解：多半是文档改了、图忘了删
  for (const file of walkFiles(assetsDir, (name) => name.endsWith(".svg"))) {
    if (!figures.has(file)) errors.push(`${inRepo(file)} 没有文档引用`);
  }

  return { nav, pages, figures, errors };
}
