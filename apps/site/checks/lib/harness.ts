/*
 * 每个检查文件开头调一次 `openSite()`：起一个浏览器，把构建好的站点（apps/site/dist）
 * 按它挂的子路径起在本机上；文件跑完关掉。哪条检查没过，就把当时的画面存到 `.artifacts/`。
 *
 * 浏览器的驱动用的是预览站实测的那一个（apps/docs/browser-checks/lib/browser.ts），这里只引用。
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { after, afterEach, before } from "node:test";
import { fileURLToPath } from "node:url";
import { launch, type Page } from "../../../docs/browser-checks/lib/browser.ts";
import { base } from "../../scripts/base.ts";
import { distDir, serve } from "../../scripts/serve.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const artifactsDir = join(here, "..", ".artifacts");

export type { Page } from "../../../docs/browser-checks/lib/browser.ts";

export function openSite(size: { width?: number; height?: number } = {}) {
  let page: Page | undefined;
  let server: Awaited<ReturnType<typeof serve>> | undefined;
  /** 站点首页的地址，末尾带斜杠 */
  let home = "";

  before(async () => {
    // 设了 SITE_URL 就测那个地址：正在跑的开发服务器，或者线上的站点
    home = process.env.SITE_URL?.replace(/\/?$/, "/") ?? "";
    if (!home) {
      assert.ok(
        existsSync(join(distDir, "index.html")),
        "没有找到 apps/site/dist。先跑 pnpm build:site，或者用 SITE_URL 指向一个正在跑的站点。",
      );
      server = await serve(distDir, base);
      home = server.url;
    }
    page = await launch({ baseUrl: home.replace(/\/$/, ""), ...size });
  });

  afterEach(async (context) => {
    // `passed` 从 Node 20.12 起就有，只是 @types/node 还没写进去
    const { passed } = context as typeof context & { passed: boolean };
    if (passed || !page) return;
    const name = context.name.replace(/[^\p{L}\p{N}]+/gu, "-");
    await page.screenshot(join(artifactsDir, `${name}.png`));
  });

  after(async () => {
    await page?.close();
    await server?.close();
  });

  const current = () => {
    assert.ok(page, "浏览器还没起来：只能在 test() 里面用");
    return page;
  };

  /** 等眼前这一页水合完、字体到齐 */
  const ready = async (url: string) => {
    const tab = current();
    await tab.waitFor(
      () =>
        tab.evaluate(
          (expected) =>
            location.href.split("#")[0] === expected.split("#")[0] &&
            document.readyState === "complete" &&
            document.documentElement.dataset.ready !== undefined,
          url,
        ),
      `页面没有渲染出来：${url}`,
      20000,
    );
    await tab.evaluate(() => document.fonts.ready.then(() => true));
    await tab.frames();
  };

  // 每个新文档载入之前先把主题记进浏览器：页面 <head> 里的那段脚本读的就是它
  let themeScript: string | undefined;
  const remember = async (theme: "light" | "dark" | null) => {
    const tab = current();
    if (themeScript) {
      await tab.send("Page.removeScriptToEvaluateOnNewDocument", {
        identifier: themeScript,
      });
      themeScript = undefined;
    }
    if (!theme) return;
    const added = (await tab.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `try{localStorage.setItem("ef-theme",${JSON.stringify(theme)})}catch(e){}`,
    })) as { identifier: string };
    themeScript = added.identifier;
  };

  return {
    get page() {
      return current();
    },
    get home() {
      return home;
    },

    /**
     * 打开站内的一页（`route` 是不带 base 的路径，首页是空串），等它水合完。
     * `theme` 是打开之前记在浏览器里的主题，默认亮色——跑实测的机器系统是亮是暗说不准，不跟系统。
     */
    async open(route: string, theme: "light" | "dark" = "light") {
      const tab = current();
      await remember(theme);
      tab.errors.length = 0;
      const url = home + route;
      await tab.send("Page.navigate", { url });
      await ready(url);
    },

    /**
     * 原地重新载入，这一次不替它记主题：看的是页面自己记住了什么。
     * `scripts: false` 把页面的脚本拦掉——这样载入的页面不会水合，
     * 量到的是服务器给的 HTML 加 <head> 里那一小段内联脚本的样子。
     */
    async reload({ scripts = true } = {}) {
      const tab = current();
      await remember(null);
      const url = await tab.evaluate(() => location.href);
      // 先把记号摘掉，等的才是新载入的那一页
      await tab.evaluate(() => {
        delete document.documentElement.dataset.ready;
      });
      if (scripts) {
        await tab.send("Page.reload");
        await ready(url);
        return;
      }
      await tab.send("Network.enable");
      await tab.send("Network.setBlockedURLs", { urls: ["*/assets/*.js"] });
      try {
        // 在旧的那一页的 body 上留个记号：等到它没了，眼前的才是新载入的一页
        await tab.evaluate(() => {
          document.body.dataset.stale = "";
        });
        await tab.send("Page.reload");
        await tab.waitFor(
          () =>
            tab.evaluate(
              () =>
                document.readyState === "complete" &&
                document.body.dataset.stale === undefined &&
                document.documentElement.dataset.ready === undefined,
            ),
          `不带脚本重新载入之后页面没有出来：${url}`,
          20000,
        );
      } finally {
        await tab.send("Network.setBlockedURLs", { urls: [] });
      }
    },
  };
}
