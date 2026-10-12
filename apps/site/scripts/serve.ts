/*
 * 把构建好的站点（apps/site/dist）按它挂的子路径起在本机上，看的就是线上的样子。
 * 浏览器实测用它；也能直接跑：pnpm --filter @endfield-ui/site preview
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { base as siteBase } from "./base.ts";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/*
 * 浏览器不肯连的端口：Fetch 规范的"坏端口"里 1024 以上的那些。
 * 系统随机分到它们的时候放掉、再要一个（预览站的实测踩过）
 */
const UNSAFE_PORTS = new Set([
  1719, 1720, 1723, 2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666,
  6667, 6668, 6669, 6679, 6697, 10080,
]);

export const distDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist",
);

/** `base` 是站点挂的路径，首尾带斜杠；`port` 传 0 就让系统挑一个 */
export async function serve(root: string, base: string, port = 0) {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(
      new URL(request.url ?? "/", "http://localhost").pathname,
    );
    // 根路径和少了末尾斜杠的，都送到站点的首页去
    if (!pathname.startsWith(base)) {
      response.writeHead(
        pathname === "/" || `${pathname}/` === base ? 302 : 404,
        {
          location: base,
        },
      );
      response.end();
      return;
    }
    let file = normalize(join(root, pathname.slice(base.length)));
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) {
      // GitHub Pages 对少了末尾斜杠的目录是跳转过去的
      if (!pathname.endsWith("/")) {
        response.writeHead(301, { location: `${pathname}/` }).end();
        return;
      }
      file = join(file, "index.html");
    }
    if (!existsSync(file)) {
      response
        .writeHead(404, { "content-type": "text/plain; charset=utf-8" })
        .end("404");
      return;
    }
    response.writeHead(200, {
      "content-type":
        CONTENT_TYPES[extname(file).toLowerCase()] ??
        "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  });

  let listening: number;
  for (;;) {
    await new Promise<void>((resolve) =>
      server.listen(port, "127.0.0.1", resolve),
    );
    ({ port: listening } = server.address() as AddressInfo);
    if (port !== 0 || !UNSAFE_PORTS.has(listening)) break;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  return {
    /** 站点首页的地址，末尾带斜杠 */
    url: `http://127.0.0.1:${listening}${base}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!existsSync(join(distDir, "index.html"))) {
    console.error("还没有构建：先跑 pnpm build:site");
    process.exit(1);
  }
  const { url } = await serve(
    distDir,
    siteBase,
    Number(process.env.PORT ?? 6108),
  );
  console.log(`文档站的构建产物：${url}`);
}
