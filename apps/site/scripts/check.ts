/*
 * 文档的两样常驻校验，构建站点之前跑，也能单独跑（pnpm check:docs）：
 *
 * 1. 链接、锚点、图、索引——loadContent 读内容的时候顺手查的；
 * 2. 文档里的令牌表对 packages/ui/src/styles/theme.css：表格里第一格是令牌名、
 *    后面跟着取值的那些行，取值要和 theme.css 里的一样。
 *
 * 有一条不过就以非零退出。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { docsDir, loadContent, repoRoot } from "./content.ts";

const themeFile = join(repoRoot, "packages/ui/src/styles/theme.css");

/** 取出一个以 `start` 开头的规则块的花括号里面的内容 */
function block(source: string, start: string) {
  const from = source.indexOf(start);
  if (from < 0) throw new Error(`theme.css 里没有找到 ${start}`);
  const open = source.indexOf("{", from);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  throw new Error("theme.css 的花括号不配对");
}

function declarations(css: string) {
  const out = new Map<string, string>();
  const flat = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@keyframes[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, "");
  for (const match of flat.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out.set(match[1]!, match[2]!.replace(/\s+/g, " ").trim());
  }
  return out;
}

type Token = { light: string; dark: string };

/** theme.css 里的令牌：名字是文档里写的那个（不带 `--ef-`、`--color-` 前缀） */
export function readTokens() {
  const theme = readFileSync(themeFile, "utf8").replace(/\r\n/g, "\n");
  const light = declarations(block(theme, ':root,\n[data-theme="light"]'));
  const dark = declarations(block(theme, '[data-theme="dark"] {'));
  const raw = declarations(block(theme, "@theme {"));

  const tokens = new Map<string, Token>();
  for (const [name, value] of light) {
    if (name.startsWith("--ef-x-")) continue;
    tokens.set(name.slice("--ef-".length), {
      light: value,
      dark: dark.get(name) ?? value,
    });
  }
  for (const [name, value] of raw) {
    if (name.endsWith("-*")) continue;
    const key = name.startsWith("--color-")
      ? name.slice("--color-".length)
      : name.slice(2);
    tokens.set(key, { light: value, dark: value });
  }
  return tokens;
}

const isHex = (value: string) => /^#[0-9a-f]{3,8}$/i.test(value);
const isLength = (value: string) => /^-?[\d.]+(px|rem|em|ms|s|%)?$/.test(value);
const isKeyword = (value: string) => /^[a-z][a-z-]*$/.test(value);
const isClamp = (value: string) => /^clamp\(.*\)$/.test(value);

/** 把表格里的一格收成一个能比的值：去掉反引号、只取"/"前面的那一半、负号统一 */
function cellValue(cell: string) {
  return cell.split(" / ")[0]!.replace(/`/g, "").replace(/−/g, "-").trim();
}

const same = (a: string, b: string) =>
  a.toLowerCase().replace(/\s+/g, "") === b.toLowerCase().replace(/\s+/g, "");

/** 两个值是同一类才比：色值对色值、长度对长度、关键字对关键字 */
function comparable(doc: string, theme: string) {
  return (
    (isHex(doc) && isHex(theme)) ||
    (isLength(doc) && isLength(theme)) ||
    (isKeyword(doc) && isKeyword(theme)) ||
    (isClamp(doc) && isClamp(theme))
  );
}

function markdownFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) out.push(...markdownFiles(file));
    else if (file.endsWith(".md")) out.push(file);
  }
  return out;
}

export function checkTokens() {
  const tokens = readTokens();
  const errors: string[] = [];

  for (const file of markdownFiles(docsDir)) {
    const where = relative(repoRoot, file).split(sep).join("/");
    let fenced = false;
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .forEach((line, index) => {
        if (/^\s*```/.test(line)) fenced = !fenced;
        if (fenced || !line.startsWith("|")) return;
        const cells = line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim());
        const first = /^`(?:--)?([a-z0-9-]+)`$/.exec(cells[0] ?? "");
        if (!first) return;
        // 圆角在 Tailwind 里叫 rounded-*，令牌叫 --radius-*
        const name = first[1]!.replace(/^rounded-/, "radius-");
        const token = tokens.get(name);
        if (!token) return;

        const [second, third] = [
          cellValue(cells[1] ?? ""),
          cellValue(cells[2] ?? ""),
        ];
        // 两格都是色值：亮色、暗色各一格
        if (
          isHex(second) &&
          isHex(third) &&
          isHex(token.light) &&
          isHex(token.dark)
        ) {
          if (!same(second, token.light) || !same(third, token.dark)) {
            errors.push(
              `${where}:${index + 1} ${first[1]}：文档写的是 ${second} / ${third}，theme.css 里是 ${token.light} / ${token.dark}`,
            );
          }
          return;
        }
        if (comparable(second, token.light) && !same(second, token.light)) {
          errors.push(
            `${where}:${index + 1} ${first[1]}：文档写的是 ${second}，theme.css 里是 ${token.light}`,
          );
        }
      });
  }
  return errors;
}

/** 两样一起查。站点的构建用它，拿回来的内容接着用 */
export async function checkDocs(base: string) {
  const content = await loadContent(base);
  return { content, errors: [...content.errors, ...checkTokens()] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { content, errors } = await checkDocs("/");
  if (errors.length) {
    console.error(`文档核对没过，${errors.length} 处：\n`);
    for (const error of errors) console.error(`  ${error}`);
    process.exit(1);
  }
  console.log(
    `文档核对通过：${content.pages.length} 篇文档、${content.figures.size} 张图解，链接、锚点和令牌表都对得上。`,
  );
}
