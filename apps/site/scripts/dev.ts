/*
 * 开发服务器：pnpm dev:site，http://localhost:6107
 *
 * 每次请求现渲染那一页；改页面的代码由 Vite 热更新，改 docs/ 下的文档整页刷新。
 * 开发时站点挂在根路径下（SITE_BASE=/），不带线上的那段子路径。
 */
import { createReadStream, existsSync, watch } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import type { SiteData } from "../src/types.ts";
import { checkDocs } from "./check.ts";
import { assetsDir, docsDir, type Content } from "./content.ts";
import {
  documentHtml,
  siteDescription,
  siteLinks,
  siteName,
} from "./document.ts";

const base = (process.env.SITE_BASE ??= "/");
const port = Number(process.env.PORT ?? 6107);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const vite = await createServer({
  root,
  server: { middlewareMode: true },
  appType: "custom",
});

// 文档读一次留着，docs/ 下有文件变了再重读
let cached: Promise<{ content: Content; errors: string[] }> | undefined;
const load = () => (cached ??= checkDocs(base));
watch(docsDir, { recursive: true }, () => {
  cached = undefined;
  vite.ws.send({ type: "full-reload" });
});

const assets = {
  styles: [],
  scripts: [`${base}@vite/client`, `${base}src/entry-client.tsx`],
};

const server = createHttpServer((request, response) => {
  vite.middlewares(request, response, () => {
    void (async () => {
      const pathname = decodeURIComponent(
        new URL(request.url ?? "/", "http://localhost").pathname,
      );
      if (!pathname.startsWith(base)) {
        response.writeHead(302, { location: base }).end();
        return;
      }
      const route = pathname.slice(base.length);

      // 图解直接从 docs/design/assets 里给
      if (route.startsWith("figures/")) {
        const file = normalize(join(assetsDir, route.slice("figures/".length)));
        if (file.startsWith(assetsDir + sep) && existsSync(file)) {
          response.writeHead(200, {
            "content-type":
              extname(file) === ".svg"
                ? "image/svg+xml"
                : "application/octet-stream",
          });
          createReadStream(file).pipe(response);
          return;
        }
      }

      const { content, errors } = await load();
      for (const error of errors) console.warn(`[文档] ${error}`);

      if (route === "search.json") {
        response
          .writeHead(200, { "content-type": "application/json; charset=utf-8" })
          .end(JSON.stringify(content.pages.map((page) => page.search)));
        return;
      }

      const page = content.pages.find((item) => item.meta.route === route);
      if (route !== "" && !page) {
        response
          .writeHead(404, { "content-type": "text/plain; charset=utf-8" })
          .end("没有这一页");
        return;
      }

      const data: SiteData = {
        base,
        nav: content.nav,
        links: siteLinks(),
        page: page
          ? page.meta
          : {
              kind: "home",
              route: "",
              title: siteName,
              description: siteDescription,
              stats: {
                docs: content.pages.length,
                figures: content.figures.size,
              },
            },
      };
      const { render } = (await vite.ssrLoadModule(
        "/src/entry-server.tsx",
      )) as {
        render: (data: SiteData, html: string) => string;
      };
      const html = documentHtml({
        data,
        body: render(data, page?.html ?? ""),
        assets,
      });
      response
        .writeHead(200, { "content-type": "text/html; charset=utf-8" })
        .end(html);
    })().catch((error: unknown) => {
      if (error instanceof Error) vite.ssrFixStacktrace(error);
      console.error(error);
      response
        .writeHead(500, { "content-type": "text/plain; charset=utf-8" })
        .end(String(error));
    });
  });
});

server.listen(port, () => {
  console.log(`文档站开发服务器：http://localhost:${port}${base}`);
});
