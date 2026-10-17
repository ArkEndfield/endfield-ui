// Game 实机风格（独立入口的那一类）：文档页、图片从哪来、总开关、样式的层，以及几个控件的键盘与焦点
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const GROUP = "game-实机风格";
const DIALOG = ".ef-animated-dialog";
const ALERT = "[role=alertdialog]";
const HOVER_PANEL = "[data-item-tooltip-panel]";

const docsPages = [
  `${GROUP}-示例-弹窗与下拉--docs`,
  `${GROUP}-示例-圆角控件--docs`,
  `${GROUP}-示例-确认提示--docs`,
  `${GROUP}-示例-物品卡片与复合图标--docs`,
  `${GROUP}-示例-关掉官方图片--docs`,
  `${GROUP}-animateddialog-分阶段动画弹窗--docs`,
  `${GROUP}-roundedselect-圆角下拉选择--docs`,
  `${GROUP}-roundedbutton-圆角按钮--docs`,
  `${GROUP}-roundedtoggle-圆角分段选择--docs`,
  `${GROUP}-roundedswitch-圆角双槽开关--docs`,
  `${GROUP}-banneralert-装饰确认卡片--docs`,
  `${GROUP}-fullwidthalert-全宽确认弹窗--docs`,
  `${GROUP}-itemcard-物品卡片--docs`,
  `${GROUP}-itemicon-分层物品图标--docs`,
  `${GROUP}-itemtooltipcard-物品详情卡片--docs`,
  `${GROUP}-itemhovercard-物品悬浮卡--docs`,
  `${GROUP}-endfieldsplashscreen-官网开屏页--docs`,
];

for (const id of docsPages) {
  test(`文档页：${id}`, async () => {
    const { page } = storybook;
    await page.docs(id);

    // "保留挂载"的弹窗关着也留在页面里（带 hidden），数的是看得见的
    const found = await page.evaluate(() => {
      const shown = (css: string) =>
        [...document.querySelectorAll(css)].filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 && rect.height > 0 && !element.closest("[hidden]")
          );
        }).length;
      return {
        stories: document.querySelectorAll(".docs-story").length,
        dialogs: shown("[role=dialog], [role=alertdialog]"),
        panels: shown("[role=listbox], [data-item-tooltip-panel]"),
      };
    });
    assert.ok(found.stories > 0, "文档页里没有 story");
    assert.equal(found.dialogs, 0, "文档页里有开着的弹窗或确认提示");
    assert.equal(found.panels, 0, "文档页里有开着的下拉面板或悬浮卡");
    assert.deepEqual(page.errors, [], "页面报了错");
  });
}

/**
 * 这一类的元素（类名以 ef- 开头）在样式里引用的图片地址，加上页面里 <img> 的地址。
 * 读的是算出来的样式：变量、总开关最后落成什么，就是什么。
 */
function imageUrls(page: Page) {
  return page.evaluate(() => {
    const urls = new Set<string>();
    const collect = (value: string) => {
      for (const match of value.matchAll(/url\("?([^")]+)"?\)/g)) {
        urls.add(match[1]!);
      }
    };
    for (const element of document.querySelectorAll('[class*="ef-"]')) {
      for (const pseudo of [undefined, "::before", "::after"]) {
        const style = getComputedStyle(element, pseudo);
        collect(style.backgroundImage);
        collect(style.borderImageSource);
        collect(style.maskImage);
      }
    }
    const images = [...document.querySelectorAll("img")].map((image) => ({
      src: image.currentSrc || image.src,
      loaded: image.complete && image.naturalWidth > 0,
    }));
    return { styled: [...urls], images, origin: location.origin };
  });
}

const isFile = (url: string) => !url.startsWith("data:");

test("图片都随站点发：样式和示例里的图没有一张指向外面，也都取得到", async () => {
  const { page } = storybook;
  await page.story(`${GROUP}-示例-物品卡片与复合图标--preview`);
  await page.waitFor(
    async () => (await imageUrls(page)).images.every((image) => image.loaded),
    "物品图没有加载出来",
  );
  const cards = await imageUrls(page);
  assert.ok(cards.images.length > 0, "页面里应该有物品图");
  assert.ok(cards.styled.length > 0, "物品卡片的背景和稀有度底边应该是图片");

  await page.story(`${GROUP}-fullwidthalert-全宽确认弹窗--open`);
  await page.waitVisible(ALERT);
  await page.settled();
  const alert = await imageUrls(page);
  assert.ok(alert.styled.length > 0, "通栏确认提示应该有横幅和底图");

  for (const url of [
    ...cards.styled,
    ...alert.styled,
    ...cards.images.map((image) => image.src),
  ]) {
    assert.ok(
      !isFile(url) || url.startsWith(cards.origin),
      `图片指到了站外：${url}`,
    );
  }
  // 样式里引用的文件真的在：逐个取一遍
  const missing = await page.evaluate(
    async (urls) => {
      const results = await Promise.all(
        urls.map(async (url) => ((await fetch(url)).ok ? null : url)),
      );
      return results.filter(Boolean);
    },
    [...cards.styled, ...alert.styled].filter(isFile),
  );
  assert.deepEqual(missing, [], "样式里引用的图片取不到");
});

test("官网开屏页：底图、标志、微标、三角标四处都是图，都随站点发；竖着的框里底图换成竖的那一张", async () => {
  const { page } = storybook;
  const SPLASH = "#storybook-root .ef-splash";
  /** 这四处各自引用的图（底图和微标是背景，标志是遮罩） */
  const used = () =>
    page.evaluate((css) => {
      const root = document.querySelector(css)!;
      const url = (value: string) => /url\("?([^")]+)"?\)/.exec(value)?.[1];
      const style = (name: string) =>
        getComputedStyle(root.querySelector(`.${name}`)!);
      return {
        backdrop: url(style("ef-splash-backdrop").backgroundImage),
        logo: url(style("ef-splash-logo").maskImage),
        deco: url(style("ef-splash-deco__text").backgroundImage),
        mark: url(style("ef-splash-deco__mark").backgroundImage),
        origin: location.origin,
      };
    }, SPLASH);

  await page.story(`${GROUP}-endfieldsplashscreen-官网开屏页--playground`);
  const { origin, ...wide } = await used();
  for (const [part, url] of Object.entries(wide)) {
    assert.ok(url, `${part} 应该是一张图片`);
    // 小图构建时会被内联成 data:，不算文件
    assert.ok(
      !isFile(url) || url.startsWith(origin),
      `${part} 的图指到了站外：${url}`,
    );
  }
  const missing = await page.evaluate(
    async (urls) => {
      const results = await Promise.all(
        urls.map(async (url) => ((await fetch(url)).ok ? null : url)),
      );
      return results.filter(Boolean);
    },
    Object.values(wide).filter(
      (url): url is string => url !== undefined && isFile(url),
    ),
  );
  assert.deepEqual(missing, [], "开屏页引用的图片取不到");

  // 标志和官网一样按宽度放满那个盒子、高度跟着图走：比盒子略高，上下各探出一点
  const logo = await page.evaluate((css) => {
    const mark = document.querySelector(`${css} .ef-splash-logo`)!;
    const rect = mark.getBoundingClientRect();
    const box = mark.parentElement!.getBoundingClientRect();
    return {
      width: rect.width - box.width,
      ratio: rect.height / rect.width,
      taller: rect.height > box.height,
      centre: rect.top + rect.height / 2 - (box.top + box.height / 2),
    };
  }, SPLASH);
  assert.ok(Math.abs(logo.width) < 0.5, "标志应该和它的盒子一样宽");
  assert.ok(Math.abs(logo.ratio - 233 / 214) < 0.01, "标志应该保持原图的比例");
  assert.ok(logo.taller, "标志应该比盒子略高");
  assert.ok(Math.abs(logo.centre) < 0.5, "标志应该竖直居中在盒子上");

  // 横竖看的是它所在的那个框：这个 story 的框是竖的
  await page.story(`${GROUP}-endfieldsplashscreen-官网开屏页--portrait`);
  const tall = await used();
  assert.ok(tall.backdrop, "竖排也应该有底图");
  assert.notEqual(tall.backdrop, wide.backdrop, "竖排应该换一张底图");
  assert.equal(tall.logo, wide.logo, "标志还是同一张");
});

test("关掉官方图片：整类不再引用任何图片文件，弹出来的确认提示也是", async () => {
  const { page } = storybook;
  // 先看平时：同一类的控件是带着图的，下面"一张都没有"才说明是开关起了作用
  await page.story(`${GROUP}-itemcard-物品卡片--playground`);
  assert.ok(
    (await imageUrls(page)).styled.length > 0,
    "平时物品卡片的背景应该是一张图片",
  );

  await page.story(`${GROUP}-示例-关掉官方图片--preview`);
  await page.waitEqual(
    () =>
      page.evaluate(() =>
        document.documentElement.getAttribute("data-ef-game-images"),
      ),
    "off",
    "这一页应该把开关写在 <html> 上",
  );
  await page.settled();
  // 不分是文件还是内联的 data:——构建时小图会被内联进样式，照样是官方的图。
  // 关掉之后的画法只用渐变和边线，一个 url() 都不该剩
  assert.deepEqual(
    (await imageUrls(page)).styled,
    [],
    "开关关着，样式里还引用着图片",
  );
  // 物品图是这一页现画的占位，不是文件
  assert.deepEqual(
    (await imageUrls(page)).images.filter((image) => isFile(image.src)),
    [],
    "这一页不该有图片文件",
  );

  // 两种确认提示挂在 <body> 下，开关写在 <html> 上才管得到
  for (const name of ["卡片确认提示", "通栏确认提示"]) {
    await page.evaluate((label) => {
      const trigger = [
        ...document.querySelectorAll<HTMLElement>("#storybook-root button"),
      ].find((button) => button.textContent?.trim() === label);
      trigger!.click();
    }, name);
    await page.waitVisible(ALERT);
    await page.settled();
    assert.deepEqual(
      (await imageUrls(page)).styled,
      [],
      `${name}打开之后引用了图片`,
    );
    await page.key("Escape");
    await page.waitGone(ALERT);
  }
});

test("样式在 components 层：使用方传的工具类盖得掉默认值，基础重置盖不掉它", async () => {
  const { page } = storybook;
  await page.story(`${GROUP}-roundedbutton-圆角按钮--playground`);
  const BUTTON = "#storybook-root .ef-rounded-button";
  await page.settled();

  // 基础重置（base 层）把按钮的内边距清成 0；这一类的样式要压得过它
  const padding = await page.evaluate(
    (css) => getComputedStyle(document.querySelector(css)!).paddingLeft,
    BUTTON,
  );
  assert.notEqual(padding, "0px", "按钮的内边距被基础重置清掉了");

  // 工具类（utilities 层）要压得过这一类的样式：加一个 hidden，按钮就该不见
  await page.evaluate(
    (css) => document.querySelector(css)!.classList.add("hidden"),
    BUTTON,
  );
  await page.waitEqual(
    () =>
      page.evaluate(
        (css) => getComputedStyle(document.querySelector(css)!).display,
        BUTTON,
      ),
    "none",
    "加了 hidden 的按钮还在：这一类的样式压过了工具类",
  );
});

test("动画弹窗：键盘打开，Esc 关闭后焦点回到触发按钮", async () => {
  const { page } = storybook;
  await page.story(`${GROUP}-animateddialog-分阶段动画弹窗--playground`);

  await page.key("Tab");
  await page.waitFocused("button:查看物品详情");
  await page.key("Enter");
  await page.waitVisible(DIALOG);
  await page.waitFor(
    () =>
      page.evaluate(
        () => !!document.activeElement?.closest(".ef-animated-dialog"),
      ),
    "打开后焦点没有进到弹窗里",
  );

  await page.key("Escape");
  await page.waitGone(DIALOG);
  await page.waitFocused("button:查看物品详情", "关闭后焦点应该回到触发按钮");
});

test("动画弹窗：关闭按钮的焦点环是两圈，暗色页面上也看得见", async () => {
  const { page } = storybook;
  await page.story(`${GROUP}-animateddialog-分阶段动画弹窗--open`, "dark");
  await page.waitVisible(DIALOG);
  await page.settled();

  // 关闭按钮排在标题带里，在正文的前面：往回走几步一定到得了
  for (let step = 0; step < 6; step += 1) {
    if ((await page.focused()) === "button:关闭") break;
    await page.key("Tab", { shift: true });
  }
  await page.waitFocused("button:关闭");
  await page.settled();

  // 环的一半压在遮罩上，页面是暗色时遮罩是深的：外圈得是亮的，里圈是墨色
  await page.waitEqual(
    () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return {
          outer: `${style.outlineStyle} ${style.outlineColor}`,
          inner: style.boxShadow.includes("rgb(25, 25, 25)"),
        };
      }),
    { outer: "solid rgb(255, 255, 255)", inner: true },
    "关闭按钮的焦点环应该是外白里墨两圈",
  );
});

test("圆角下拉：键盘打开，方向键换一项，回车选中后面板关上、值换了", async () => {
  const { page } = storybook;
  await page.story(`${GROUP}-roundedselect-圆角下拉选择--playground`);
  const TRIGGER = "#storybook-root .ef-rounded-select-trigger";

  await page.key("Tab");
  await page.waitFocused(/^combobox:地区/);
  assert.deepEqual(await page.text(TRIGGER), ["四号谷地"]);

  await page.key("Enter");
  await page.waitVisible("[role=listbox]");
  // 面板出现和焦点进面板不是同一刻：等焦点到了选项上再按键
  await page.waitFocused(/^option:/);
  await page.key("ArrowDown");
  await page.waitFocused(/^option:武陵/);
  await page.key("Enter");

  await page.waitGone("[role=listbox]");
  await page.waitEqual(
    () => page.text(TRIGGER),
    ["武陵"],
    "选中之后触发器上应该是新的值",
  );
  await page.waitFocused(/^combobox:地区/, "选完焦点应该回到触发器");
});

test("确认提示：打开后焦点在“取消”上，Esc 关闭后回到触发按钮", async () => {
  const { page } = storybook;
  await page.story(`${GROUP}-banneralert-装饰确认卡片--playground`);

  await page.key("Tab");
  await page.waitFocused("button:打开确认卡片");
  await page.key("Enter");
  await page.waitVisible(ALERT);
  // 约定和主库的弹窗一样："取消"在前，打开后一回车不会直接执行
  await page.waitFocused("button:取消", "打开后焦点应该落在“取消”上");

  const name = await page.evaluate(() => {
    const dialog = document.querySelector("[role=alertdialog]")!;
    return document.getElementById(dialog.getAttribute("aria-labelledby")!)
      ?.textContent;
  });
  assert.equal(name, "移除物品", "标题不显示在画面里，但读屏要读得到");

  await page.key("Escape");
  await page.waitGone(ALERT);
  await page.waitFocused("button:打开确认卡片", "关闭后焦点应该回到触发按钮");
});

test("物品悬浮卡：聚焦触发元素就出现，↓ 进面板，Esc 收起并把焦点还回去", async () => {
  const { page } = storybook;
  await page.story(`${GROUP}-itemhovercard-物品悬浮卡--default`);

  await page.key("Tab");
  await page.waitFocused("button:协议棱柱组");
  await page.waitVisible(HOVER_PANEL, "聚焦触发元素后悬浮卡没有出现");
  await page.settled(HOVER_PANEL);
  assert.equal(
    await page.focused(),
    "button:协议棱柱组",
    "悬浮卡出现时不该抢走焦点",
  );

  await page.key("ArrowDown");
  await page.waitFor(
    () =>
      page.evaluate(
        () => !!document.activeElement?.closest("[data-item-tooltip-panel]"),
      ),
    "按 ↓ 之后焦点没有进到悬浮卡里",
  );

  await page.key("Escape");
  await page.waitGone(HOVER_PANEL);
  await page.waitFocused("button:协议棱柱组", "Esc 之后焦点应该回到触发元素");
  // 焦点回来不该让它立刻又弹出来
  await page.pause(400);
  assert.equal(
    await page.visible(HOVER_PANEL),
    false,
    "焦点还回去之后悬浮卡又弹出来了",
  );
});
