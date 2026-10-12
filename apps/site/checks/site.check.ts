// 文档站：每一页渲染得出来、导航认得当前页、目录、主题、搜索、窄屏的菜单
import assert from "node:assert/strict";
import { test } from "node:test";
import { openSite } from "./lib/harness.ts";

const site = openSite({ width: 1440, height: 900 });

const RAIL = "nav[aria-label=文档导航]";
const DIALOG = "[role=dialog]";
const RESULTS = `${DIALOG} ul[aria-label=搜索结果] a`;

type Nav = { title: string; items: { title: string; route: string }[] }[];

/** 页面里内嵌的那份目录 */
const readNav = () =>
  site.page.evaluate(() => {
    const data = JSON.parse(
      document.getElementById("site-data")!.textContent,
    ) as {
      base: string;
      nav: Nav;
    };
    return data;
  });

/** 横向溢出了多少像素 */
const overflow = () =>
  site.page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

test("每一页都渲染得出来：有标题、有正文、不报错、不横向溢出，站内的链接和图都取得到", async () => {
  const { page } = site;
  await site.open("");
  const { base, nav } = await readNav();
  const routes = nav.flatMap((group) => group.items.map((item) => item.route));
  assert.ok(routes.length >= 30, `目录里只有 ${routes.length} 篇`);
  const known = new Set(["", ...routes].map((route) => base + route));

  for (const route of ["", ...routes]) {
    await site.open(route);
    const found = await page.evaluate(async (prefix) => {
      const article = document.querySelector("#doc-content");
      // 这一页上指向站内的链接（去掉锚点），和图解的地址
      const internal = [
        ...document.querySelectorAll<HTMLAnchorElement>("a[href]"),
      ]
        .map((anchor) => anchor.getAttribute("href") ?? "")
        .filter(
          (href) => href.startsWith(prefix) && !href.includes("/figures/"),
        )
        .map((href) => href.split("#")[0]!);
      const figures = [
        ...document.querySelectorAll<HTMLImageElement>(".doc-figure img"),
      ].map((image) => image.getAttribute("src") ?? "");
      const missing: string[] = [];
      for (const src of new Set(figures)) {
        const response = await fetch(src, { method: "HEAD" });
        if (!response.ok) missing.push(src);
      }
      return {
        heading: document.querySelector("h1")?.textContent?.trim() ?? "",
        headings: document.querySelectorAll("h1").length,
        text: article ? (article.textContent ?? "").trim().length : -1,
        internal: [...new Set(internal)],
        missing,
      };
    }, base);

    assert.ok(found.heading, `${route || "首页"} 没有一级标题`);
    assert.equal(found.headings, 1, `${route || "首页"} 的一级标题不止一个`);
    if (route) assert.ok(found.text > 200, `${route} 的正文是空的`);
    assert.deepEqual(found.missing, [], `${route || "首页"} 有图取不到`);
    for (const href of found.internal) {
      assert.ok(
        known.has(href),
        `${route || "首页"} 上有一个指向不存在的页面的链接：${href}`,
      );
    }
    assert.deepEqual(page.errors, [], `${route || "首页"} 在控制台里报了错`);
    assert.ok((await overflow()) <= 0, `${route || "首页"} 横向溢出了`);
  }
});

test("没开脚本也读得到：正文、目录和标题都在服务器给的 HTML 里", async () => {
  const response = await fetch(`${site.home}foundations/color/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<h1[^>]*>色彩<\/h1>/);
  assert.match(html, /id="中性色阶"/, "正文的小节不在 HTML 里");
  assert.match(html, /<title>色彩 · /);
  assert.match(html, /figures\/palette\/neutral-scale\.svg/);
  // 目录：当前这一组展开着，同组的另一篇是一个普通的链接
  assert.match(html, /href="[^"]*foundations\/typography\/"/);
});

test("侧轨：当前这一页所在的组展开着，当前项标了出来；别的组收着", async () => {
  const { page } = site;
  await site.open("foundations/color/");
  assert.deepEqual(await page.text(`${RAIL} a[aria-current=page]`), ["色彩"]);
  await page.waitVisible(`${RAIL} a[href$="foundations/typography/"]`);
  assert.equal(
    await page.visible(`${RAIL} a[href$="components/button/"]`),
    false,
    "没在看的那一组也展开着",
  );

  // 点开另一组，里面的文档就能点
  await page.click(`${RAIL} button[aria-expanded=false]`);
  await page.waitFor(
    () =>
      page.evaluate(
        (rail) =>
          document.querySelectorAll(`${rail} button[aria-expanded=true]`)
            .length >= 2,
        RAIL,
      ),
    "点了之后那一组没有展开",
  );
});

test("页内目录：点一项，地址换成那一节的锚点，那一项成了当前项", async () => {
  const { page } = site;
  await site.open("foundations/color/");
  const TOC = "main nav a[data-toc-section]";
  await page.waitVisible(TOC);
  const target = await page.evaluate((css) => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>(css)];
    // 挑靠后的一节：它离页首够远，点了一定要滚
    const link = links[Math.min(links.length - 1, 6)]!;
    return {
      section: link.dataset.tocSection ?? "",
      text: (link.textContent ?? "").trim(),
    };
  }, TOC);
  assert.ok(target.section, "目录里没有带锚点的项");

  await page.click(`${TOC}[data-toc-section="${target.section}"]`);
  await page.waitFor(
    () =>
      page.evaluate(
        (id) => decodeURIComponent(location.hash) === `#${id}`,
        target.section,
      ),
    "地址里的锚点没有换",
  );
  await page.waitEqual(
    () => page.text("main nav a[aria-current=location]"),
    [target.text],
    "点的那一项没有成为当前项",
  );
  const top = await page.evaluate(
    (id) =>
      Math.round(document.getElementById(id)!.getBoundingClientRect().top),
    target.section,
  );
  assert.ok(
    top >= 0 && top < 200,
    `那一节没有滚到视口上沿附近（离上沿 ${top}px）`,
  );
});

test("主题：切到暗色，重新载入之后还是暗色", async () => {
  const { page } = site;
  await site.open("overview/", "light");
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.theme),
    "light",
  );

  await page.click(`${RAIL} button[aria-label=切换到暗色]`);
  await page.waitFor(
    () =>
      page.evaluate(() => document.documentElement.dataset.theme === "dark"),
    "点了之后没有换成暗色",
  );
  await page.waitVisible(`${RAIL} button[aria-label=切换到亮色]`);

  // 先不带脚本载入一次：暗色是 <head> 里那一小段脚本在样式到之前就写上的，不等水合——不然页面会先亮一下
  await site.reload({ scripts: false });
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.theme),
    "dark",
    "页面的脚本还没到的时候不是暗色：会先亮一下再变暗",
  );

  await site.reload();
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.theme),
    "dark",
    "重新载入之后没有记住",
  );
  await page.waitVisible(`${RAIL} button[aria-label=切换到亮色]`);
  // 页面底色真的是暗色那一档，不只是属性写上了
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const [red = 255] =
          getComputedStyle(document.body)
            .backgroundColor.match(/\d+/g)
            ?.map(Number) ?? [];
        return red < 60;
      }),
    "属性是暗色，页面的底色却不是",
  );
});

test("搜索：按 / 打开，打一个中文词有结果，回车去头一条；Esc 关上", async () => {
  const { page } = site;
  await site.open("overview/");

  await page.key("/");
  await page.waitVisible(`${DIALOG} input[type=search]`);
  await page.waitFocused("input:搜索文档");
  await page.type("信号黄");
  await page.waitVisible(RESULTS, "搜“信号黄”没有结果");
  const first = await page.evaluate(
    (css) =>
      document.querySelector<HTMLAnchorElement>(css)!.getAttribute("href") ??
      "",
    RESULTS,
  );
  assert.match(first, /\/foundations\/color\/#/, "头一条不是色彩那一篇");

  // 搜不到的词：说一句没找到，不是空着
  await page.key("a", { ctrl: true });
  await page.type("zzzzqqqq");
  await page.waitFor(
    async () =>
      (await page.text(`${DIALOG} [role=status]`))[0]?.includes("没有找到"),
    "搜不到的时候没有说明",
  );

  await page.key("Escape");
  await page.waitGone(DIALOG);

  // 再开一次是从头找；这一次回车直接去头一条
  await page.key("k", { ctrl: true });
  await page.waitFocused("input:搜索文档");
  assert.equal(
    await page.evaluate(
      () => (document.activeElement as HTMLInputElement).value,
    ),
    "",
    "上一次打的字还留着",
  );
  await page.type("切角");
  await page.waitVisible(RESULTS);
  const top = await page.evaluate(
    (css) =>
      document.querySelector<HTMLAnchorElement>(css)!.getAttribute("href") ??
      "",
    RESULTS,
  );
  await page.key("Enter");
  await page.waitFor(
    () =>
      page.evaluate((href) => location.pathname === href.split("#")[0], top),
    "回车没有去头一条",
    10000,
  );
});

test("键盘：Tab 的头一站是“跳到正文”", async () => {
  const { page } = site;
  await site.open("components/button/");
  await page.key("Tab");
  await page.waitFocused("a:跳到正文");
  await page.key("Enter");
  await page.waitFor(
    () => page.evaluate(() => location.hash === "#main"),
    "回车之后没有跳到正文",
  );
});

test("窄屏：侧轨换成顶栏和全屏菜单，菜单里是同一份目录，当前项标着", async () => {
  const { page } = site;
  await page.setSize(390, 800);
  try {
    await site.open("components/button/");
    const { nav } = await readNav();
    const count = nav.reduce((sum, group) => sum + group.items.length, 0);

    assert.equal(await page.visible(RAIL), false, "窄屏上侧轨还在");
    await page.click("button[aria-label=打开菜单]");
    await page.waitVisible(`${DIALOG} nav`);
    await page.settled(DIALOG);
    assert.equal(
      await page.evaluate(
        (css) => document.querySelectorAll(css).length,
        `${DIALOG} nav a`,
      ),
      count + 1,
      "菜单里的栏目数和目录对不上（目录里的每一篇，加首页）",
    );
    assert.deepEqual(await page.text(`${DIALOG} nav a[aria-current=page]`), [
      "按钮",
    ]);

    await page.key("Escape");
    await page.waitGone(DIALOG);
    await page.waitFocused("button:打开菜单");

    // 右边那一列目录放不下，收成了正文上面的一行
    await page.waitVisible("main h3 button[aria-expanded]");
    assert.equal(await page.visible("main nav a[data-toc-section]"), false);
  } finally {
    await page.setSize(1440, 900);
  }
});

test("320px 宽：首页和两篇最长的文档都不横向溢出", async () => {
  const { page } = site;
  await page.setSize(320, 700);
  try {
    for (const route of ["", "foundations/color/", "components/form/"]) {
      await site.open(route);
      assert.ok(
        (await overflow()) <= 0,
        `${route || "首页"} 在 320px 宽时横向溢出了 ${await overflow()}px`,
      );
    }
  } finally {
    await page.setSize(1440, 900);
  }
});
