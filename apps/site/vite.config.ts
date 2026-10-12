import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { base } from "./scripts/base.ts";

export default defineConfig({
  base,
  plugins: [tailwindcss()],
  resolve: {
    alias: [
      {
        // 直接指向组件库源码，和预览站是同一个做法：不用先构建组件库。
        // 只匹配包名本身，`@endfield-ui/react/tailwind.css` 仍走包的 exports
        find: /^@endfield-ui\/react$/,
        replacement: fileURLToPath(
          new URL("../../packages/ui/src/index.ts", import.meta.url),
        ),
      },
    ],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    manifest: true,
    rolldownOptions: {
      input: "src/entry-client.tsx",
      // Base UI 每个文件开头的 "use client" 打包后留不住，也用不着：一条一条报出来只是刷屏
      onLog(level, log, handler) {
        if (log.code !== "MODULE_LEVEL_DIRECTIVE") handler(level, log);
      },
    },
  },
});
