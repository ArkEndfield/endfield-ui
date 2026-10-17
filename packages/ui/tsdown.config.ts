import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type UserConfig } from "tsdown";

const src = resolve(dirname(fileURLToPath(import.meta.url)), "src");
const game = resolve(src, "game");

/**
 * game 入口里凡是指到 game 目录之外的源码，都换成对已经构建好的主入口的引用。
 * 这样 `dist/game.js` 用的 `Field` 上下文、主题钩子和 `dist/index.js` 是同一份，
 * 主入口的产物也不因为多了一个入口被拆成共享块——它和只有一个入口时一字不差。
 * 所以 game 用到的主库的东西必须是主入口公开导出的（收在 `src/game/lib/core.ts`）。
 */
const mainEntryAsExternal: NonNullable<UserConfig["plugins"]> = {
  name: "main-entry-as-external",
  async resolveId(source, importer, options) {
    if (!importer || !source.startsWith(".")) return null;
    const resolved = await this.resolve(source, importer, {
      ...options,
      skipSelf: true,
    });
    if (!resolved) return null;
    const outside =
      resolved.id.startsWith(src + sep) && !resolved.id.startsWith(game + sep);
    return outside ? { id: "./index.js", external: true } : null;
  },
};

const shared = {
  format: "esm",
  platform: "neutral",
  dts: true,
  // 带状态的组件（Tabs、SectionTitle）在 RSC 环境下必须是客户端组件
  banner: { js: '"use client";' },
} satisfies UserConfig;

export default defineConfig([
  { ...shared, entry: ["src/index.ts"], clean: true },
  // Game 实机风格：独立入口（`@endfield-ui/react/game`）。排在主入口后面，不清目录
  {
    ...shared,
    entry: { game: "src/game/index.ts" },
    clean: false,
    plugins: [mainEntryAsExternal],
  },
]);
