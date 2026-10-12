/*
 * 构建 Game 实机风格的样式之后跑：把 dist/game/styles.css 里引用的图片拷到它旁边。
 *
 * 源码里图片跟着各自的控件放（src/game/<控件>/assets/），样式里写的是 url("./assets/…")；
 * Tailwind CLI 合并 @import 时不改写地址，所以产物里它们都指向 dist/game/assets/。
 * 这里按文件名把图找出来拷过去，并核对三件事，有一件不对就让构建失败：
 *   - 产物里每个 url() 都指得到文件；
 *   - 地址都落在 dist/game/assets/ 里（官方图片在包里只有这一处）；
 *   - 文件名在各控件之间不重复（拷到一个目录里不会互相盖掉）。
 * 只有 story 在用的示例图没有被样式引用，不会被拷进来。
 */
import { copyFile, mkdir, readdir, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = new URL("../src/game/", import.meta.url);
const output = new URL("../dist/game/", import.meta.url);
const assets = new URL("assets/", output);

/** 文件名 → 它在源码里的位置 */
const found = new Map();
for (const entry of await readdir(source, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = new URL(`${entry.name}/assets/`, source);
  const names = await readdir(dir).catch(() => []);
  for (const name of names) {
    if (found.has(name)) {
      throw new Error(
        `图片重名：${name} 同时在 ${entry.name}/assets 和 ${found.get(name).control}/assets 里`,
      );
    }
    found.set(name, { control: entry.name, url: new URL(name, dir) });
  }
}

const css = await readFile(new URL("styles.css", output), "utf8");
const referenced = new Set();
for (const [, , raw] of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
  // 内联的 data: 和 SVG 里的 #片段 不是文件
  if (/^(data:|#|%23)/.test(raw)) continue;
  const match = /^\.\/assets\/([^/]+)$/.exec(raw);
  if (!match) {
    throw new Error(`样式里有不在 ./assets/ 下的地址：url(${raw})`);
  }
  referenced.add(match[1]);
}

await rm(assets, { recursive: true, force: true });
await mkdir(assets, { recursive: true });
for (const name of referenced) {
  const file = found.get(name);
  if (!file) throw new Error(`样式引用的图片在源码里找不到：${name}`);
  await copyFile(file.url, new URL(name, assets));
}

// 清单和随图标带的许可一起进包：包里不带 src/game
const extras = [
  ["resource-provenance.json", "resource-provenance.json"],
  ["item-tooltip-card/LICENSE.lucide", "LICENSE.lucide"],
];
for (const [from, to] of extras) {
  await copyFile(new URL(from, source), new URL(to, output));
}

const skipped = [...found.keys()].filter((name) => !referenced.has(name));
console.log(
  `game：拷了 ${referenced.size} 张图到 ${fileURLToPath(assets)}` +
    (skipped.length ? `；没被样式引用、不进包的 ${skipped.length} 张` : ""),
);
