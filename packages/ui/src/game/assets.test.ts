import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "./resource-provenance.json";

/*
 * 这个目录里的图片是官方素材，没有授权（见 docs/design/game/README.md 的"风险与处理"）。
 * 能做的是把它们管住：只在这一处，每一张都登记在案。这里核对的就是这两件事——
 * 多出一张没登记的图、或者图出现在了别处，测试就不过。
 */
// 测试在包的根目录下跑（jsdom 环境里 import.meta.url 不是文件地址，不能拿来定位）
const src = resolve("src");
const game = join(src, "game");
const IMAGE = /\.(png|webp|jpe?g|gif|avif|svg|ico|bmp)$/i;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const slash = (path: string) => path.split(sep).join("/");
const all = walk(src);
/** 实际在盘上的图：相对 src/game 的路径 */
const onDisk = all
  .filter((file) => IMAGE.test(file) && file.startsWith(game + sep))
  .map((file) => slash(relative(game, file)))
  .sort();
const listed = manifest.assets.map((asset) => asset.path).sort();

describe("Game 实机风格带的官方图片", () => {
  it("只在 src/game/<控件>/assets 里，别处没有图片文件", () => {
    const elsewhere = all
      .filter((file) => IMAGE.test(file))
      .map((file) => slash(relative(src, file)))
      .filter((path) => !/^game\/[^/]+\/assets\/[^/]+$/.test(path));
    expect(elsewhere).toEqual([]);
  });

  it("每一张都登记在 resource-provenance.json 里，清单里也没有多的", () => {
    expect(onDisk).toEqual(listed);
  });

  it("文件的字节数和 SHA256 与清单一致", () => {
    for (const asset of manifest.assets) {
      const bytes = readFileSync(join(game, asset.path));
      expect(bytes.length, asset.path).toBe(asset.bytes);
      expect(createHash("sha256").update(bytes).digest("hex"), asset.path).toBe(
        asset.sha256,
      );
    }
  });

  it("文件名在各控件之间不重复", () => {
    // 构建时它们拷进同一个 dist/game/assets，重名的会互相盖掉
    const names = listed.map((path) => basename(path));
    expect(names.length).toBe(new Set(names).size);
  });

  it("清单里标了随包发的，正好是样式引用到的那些", () => {
    const css = all
      .filter((file) => file.endsWith(".css") && file.startsWith(game + sep))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    const referenced = [
      ...new Set(
        [...css.matchAll(/url\(\s*["']?\.\/assets\/([^"')]+)["']?\s*\)/g)].map(
          (match) => match[1]!,
        ),
      ),
    ].sort();
    const shipped = manifest.assets
      .filter((asset) => asset.shipped)
      .map((asset) => basename(asset.path))
      .sort();
    expect(referenced).toEqual(shipped);
  });
});
