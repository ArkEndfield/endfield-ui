// 高对比模式（forced-colors）：系统把作者写的底色都换成页面色之后，"选中 / 当前"还分不分得出来。
// 计算样式读不到被系统换过之后的颜色，所以两头都核对：声明的是不是系统色关键字（和探针比），
// 画出来的那一点是不是真的是它（截 1×1 的图，和探针画出来的那一点比）。
// 只比"是同一个颜色 / 不是同一个颜色"，不比色值：系统色是使用者自己定的，每台机器不一样
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

let emulating = false;

/**
 * 打开一个 story。第一次用之前先把高对比模式的模拟开起来：之后换页它一直开着。
 * 没有放进 before()：它不保证排在起浏览器的那个 before 之后，那时候还没有页面
 */
async function open(page: Page, id: string) {
  if (!emulating) {
    // 截的是一个像素：把缩放固定成 1
    await page.setSize(1200, 800);
    // "减少动态效果"和它是同一条命令管的，要一起带上，不然会被这一条顶掉
    await page.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-reduced-motion", value: "reduce" },
        { name: "forced-colors", value: "active" },
      ],
    });
    emulating = true;
  }
  await page.story(id);
  assert.equal(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
    true,
    "高对比模式的模拟没有开起来",
  );
  // 一上来就开着的浮层还在进场：等它停下再取点
  await page.settled();
}

type Point = { x: number; y: number };
/** 从元素的左上角往里多少像素；负数是从右下角往里；`center` 是正中 */
type Offset = number | "center";
type SystemColor =
  "Highlight" | "HighlightText" | "CanvasText" | "ButtonText" | "GrayText";

/**
 * 第 `nth` 个匹配的元素里的一点（页面坐标）。取点要避开字：字的宽度每台机器不一样，
 * 所以都取在角上、边上这些只有底色的地方
 */
async function at(
  page: Page,
  selector: string,
  dx: Offset,
  dy: Offset,
  nth = 0,
): Promise<Point> {
  const read = () =>
    page.evaluate(
      (css, ox, oy, index) => {
        const element = document.querySelectorAll(css)[index];
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        const along = (start: number, size: number, offset: Offset) =>
          offset === "center"
            ? start + size / 2
            : offset < 0
              ? start + size + offset
              : start + offset;
        return {
          x: along(rect.left, rect.width, ox) + scrollX,
          y: along(rect.top, rect.height, oy) + scrollY,
        };
      },
      selector,
      dx,
      dy,
      nth,
    );
  // 连着两次量到同一个位置才算数：浮层进场时会挪几个像素，取早了取到的是别处
  let previous: Point | null = null;
  return page.waitFor(
    async () => {
      const current = await read();
      const still =
        current !== null &&
        previous !== null &&
        Math.abs(current.x - previous.x) < 0.5 &&
        Math.abs(current.y - previous.y) < 0.5;
      previous = current;
      return still ? current : null;
    },
    `找不到 ${selector}（第 ${nth + 1} 个），或者它一直在动`,
  );
}

/** 这一点画出来是什么：一张 1×1 的截图。只拿来比一样不一样 */
async function pixel(page: Page, { x, y }: Point): Promise<string> {
  const { data } = await page.send("Page.captureScreenshot", {
    format: "png",
    clip: { x: Math.floor(x), y: Math.floor(y), width: 1, height: 1, scale: 1 },
  });
  // 截图之后页面会被当成失去焦点，键盘事件慢一拍
  await page.send("Page.bringToFront");
  return data;
}

/** 系统色画出来是什么样：这个浏览器开着的时候不会变，量一次记住 */
const palette = new Map<SystemColor, string>();
async function painted(page: Page, keyword: SystemColor): Promise<string> {
  const known = palette.get(keyword);
  if (known) return known;
  const point = await page.evaluate((color) => {
    const probe = document.createElement("i");
    probe.id = "forced-colors-probe";
    probe.style.cssText = `position:fixed;left:0;top:0;width:8px;height:8px;z-index:2147483647;forced-color-adjust:none;background:${color}`;
    document.body.append(probe);
    return { x: scrollX + 4, y: scrollY + 4 };
  }, keyword);
  await page.frames();
  const color = await pixel(page, point);
  await page.evaluate(() =>
    document.getElementById("forced-colors-probe")?.remove(),
  );
  await page.frames();
  palette.set(keyword, color);
  return color;
}

/** 等这一点画成这个系统色。状态刚变的头一两帧还是旧的，所以是等，不是量一次 */
async function shows(
  page: Page,
  point: Point,
  keyword: SystemColor,
  message: string,
) {
  const expected = await painted(page, keyword);
  await page.waitFor(
    async () => (await pixel(page, point)) === expected,
    message,
  );
}

/** 等这一点不是这个系统色。先等动效走完；刚换走的那一个，头一两帧可能还是旧的 */
async function differs(
  page: Page,
  point: Point,
  keyword: SystemColor,
  message: string,
) {
  const unexpected = await painted(page, keyword);
  await page.settled();
  await page.waitFor(
    async () => (await pixel(page, point)) !== unexpected,
    message,
  );
}

type ColorProperty = "backgroundColor" | "color" | "outlineColor";

/**
 * 等这个元素（或它的伪元素）上声明的颜色是这个系统色关键字。作者写的普通颜色在计算样式里
 * 还是原样（系统是在画的时候才换），和探针对不上；只有显式写的系统色关键字对得上
 */
const declares = (
  page: Page,
  selector: string,
  property: ColorProperty,
  keyword: SystemColor,
  { pseudo, nth = 0 }: { pseudo?: string; nth?: number } = {},
) =>
  page.waitFor(
    () =>
      page.evaluate(
        (css, name, color, pseudoElement, index) => {
          const element = document.querySelectorAll(css)[index];
          if (!element) return false;
          const probe = document.createElement("i");
          probe.style.color = color;
          document.body.append(probe);
          const expected = getComputedStyle(probe).color;
          probe.remove();
          return getComputedStyle(element, pseudoElement)[name] === expected;
        },
        selector,
        property,
        keyword,
        pseudo ?? null,
        nth,
      ),
    `${selector}${pseudo ?? ""} 的 ${property} 应该写的是 ${keyword}`,
  );

/**
 * 字压在系统色上的元素：颜色不让系统再改。不然浏览器会在字后面垫一块页面色的底板，
 * 把"选中"色盖掉——取在角上的那几个点量不出这件事，所以单独核对
 */
const unadjusted = (page: Page, selector: string, nth = 0) =>
  page.waitFor(
    () =>
      page.evaluate(
        (css, index) => {
          const element = document.querySelectorAll(css)[index];
          return (
            !!element && getComputedStyle(element).forcedColorAdjust === "none"
          );
        },
        selector,
        nth,
      ),
    `${selector} 上应该有 forced-color-adjust: none`,
  );

const ROOT = "#storybook-root";

test("分段选择：选中的那一段是系统的「选中」色，换一段跟过去；选中又禁用的是灰字色", async () => {
  const { page } = storybook;
  await open(page, "控件-segmentedcontrol-分段选择--playground");
  const group = `${ROOT} [role=radiogroup]`;
  const segment = (nth: number) => `${group} label:nth-child(${nth})`;
  const corner = (nth: number) => at(page, segment(nth), 3, 3);

  await shows(
    page,
    await corner(1),
    "Highlight",
    "选中的那一段应该画成系统的「选中」色",
  );
  await differs(
    page,
    await corner(2),
    "Highlight",
    "没选的那一段不该是「选中」色",
  );
  // 墨块在轨道上，字在那一段上
  await declares(page, group, "backgroundColor", "Highlight", {
    pseudo: "::after",
  });
  await declares(page, segment(1), "color", "HighlightText");
  await unadjusted(page, segment(1));

  await page.click(segment(3));
  await shows(
    page,
    await corner(3),
    "Highlight",
    "点了第三段：「选中」色应该跟过去",
  );
  await differs(
    page,
    await corner(1),
    "Highlight",
    "换走之后，原来那一段不该还是「选中」色",
  );

  // 第二组整组禁用，选着第二段
  await open(page, "控件-segmentedcontrol-分段选择--states");
  const disabled = `${ROOT} [role=radiogroup]:nth-child(2) label:nth-child(2)`;
  await shows(
    page,
    await at(page, disabled, 3, 3),
    "GrayText",
    "选中又禁用的那一段应该是灰字色的块",
  );
  await unadjusted(page, disabled);
});

test("页签：胶囊选中的是系统的「选中」色，换一个跟过去；楔形也是", async () => {
  const { page } = storybook;
  await open(page, "控件-tabs-页签--capsule");
  const tab = `${ROOT} [role=tab]`;
  // 胶囊顶边往里 4px、横向正中：在字的上面
  const top = (nth: number) => at(page, tab, "center", 4, nth);

  await shows(page, await top(0), "Highlight", "选中的胶囊应该画成「选中」色");
  await differs(page, await top(1), "Highlight", "没选的胶囊不该是「选中」色");
  await declares(
    page,
    `${ROOT} [role=tablist]`,
    "backgroundColor",
    "Highlight",
    {
      pseudo: "::after",
    },
  );
  await declares(page, tab, "color", "HighlightText");
  await unadjusted(page, tab);

  await page.click(`${tab}:nth-child(2)`);
  await shows(
    page,
    await top(1),
    "Highlight",
    "点了第二个：「选中」色应该跟过去",
  );
  await differs(
    page,
    await top(0),
    "Highlight",
    "换走之后，原来那一个不该还是「选中」色",
  );

  await open(page, "控件-tabs-页签--wedge");
  // 楔形左边是直的：取左上角
  await shows(
    page,
    await at(page, tab, 3, 3, 0),
    "Highlight",
    "选中的楔形应该画成「选中」色",
  );
  await differs(
    page,
    await at(page, tab, 3, 3, 1),
    "Highlight",
    "没选的页签不该是「选中」色",
  );
  await declares(page, tab, "color", "HighlightText");
  await unadjusted(page, tab);
});

test("筛选胶囊：选中的是系统的「选中」色，点一下换；选中又禁用的是灰字色", async () => {
  const { page } = storybook;
  await open(page, "控件-filterchip-筛选胶囊--states");
  // 第一行四颗：未选、已选、禁用、已选且禁用
  const chip = `${ROOT} button`;
  const top = (nth: number) => at(page, chip, "center", 4, nth);

  await shows(page, await top(1), "Highlight", "选中的胶囊应该画成「选中」色");
  await differs(page, await top(0), "Highlight", "没选的胶囊不该是「选中」色");
  await shows(
    page,
    await top(3),
    "GrayText",
    "选中又禁用的胶囊应该是灰字色的块",
  );
  await differs(page, await top(2), "GrayText", "禁用但没选的胶囊不该是实心的");
  await unadjusted(page, chip, 1);
  await unadjusted(page, chip, 3);

  await page.click(`${chip}:nth-child(1)`);
  await shows(page, await top(0), "Highlight", "点了之后应该变成「选中」色");
  await page.click(`${chip}:nth-child(1)`);
  await page.waitFor(
    () =>
      page.evaluate(
        (css) =>
          document.querySelector(css)!.getAttribute("aria-pressed") === "false",
        chip,
      ),
    "再点一下应该取消选中",
  );
  await differs(page, await top(0), "Highlight", "取消之后不该还是「选中」色");
});

test("月历：选一段时两端是「选中」色的块，中间是上下两条线；今天的短线看得见；块里的焦点环不贴边", async () => {
  const { page } = storybook;
  // 2026-10-07 到 10-15，今天是 10-09
  await open(page, "控件-calendar-月历--pick-range");
  const day = (date: string) => `${ROOT} [data-date="${date}"]`;

  for (const end of ["2026-10-07", "2026-10-15"]) {
    await shows(
      page,
      await at(page, day(end), 3, 3),
      "Highlight",
      `${end} 是一段的一头，应该是「选中」色的块`,
    );
    await declares(page, day(end), "color", "HighlightText");
    await unadjusted(page, day(end));
  }
  // 中间的格子：上下各一条线，里面还是页面色
  const between = day("2026-10-10");
  await shows(
    page,
    await at(page, between, "center", 1),
    "Highlight",
    "一段中间的格子上沿应该有一条「选中」色的线",
  );
  await shows(
    page,
    await at(page, between, "center", -1),
    "Highlight",
    "一段中间的格子下沿应该有一条「选中」色的线",
  );
  await differs(
    page,
    await at(page, between, 3, 8),
    "Highlight",
    "一段中间的格子不该是实心的",
  );
  await differs(
    page,
    await at(page, day("2026-10-20"), "center", 1),
    "Highlight",
    "不在这一段里的格子不该有线",
  );
  // 今天：数字下面那条短线是底色画的
  await declares(page, day("2026-10-09"), "backgroundColor", "CanvasText", {
    pseudo: "::after",
  });

  // 键盘进到网格里，停在起始日上：环画在块里面，往里收了，外面一圈还是块的颜色
  await page.key("Tab");
  await page.key("Tab");
  await page.key("Tab");
  await page.waitFocused(/^button:2026年10月7日/, "Tab 应该停在起始日上");
  const start = day("2026-10-07");
  await shows(
    page,
    await at(page, start, 3, 3),
    "HighlightText",
    "起始日上的焦点环应该是「选中」色上面的字色",
  );
  await shows(
    page,
    await at(page, start, 1, 1),
    "Highlight",
    "焦点环外面应该还留着一圈「选中」色",
  );

  // 选中的就是今天：短线压在块上，换成块上面的字色
  await open(page, "控件-calendar-月历--selected-today");
  await declares(page, day("2026-10-09"), "backgroundColor", "HighlightText", {
    pseudo: "::after",
  });
  await shows(
    page,
    await at(page, day("2026-10-09"), 3, 3),
    "Highlight",
    "选中的那一格应该是「选中」色的块",
  );
});

test("页内目录：当前项的粗条是系统的「选中」色", async () => {
  const { page } = storybook;
  await open(page, "控件-toc-页内目录--playground");
  const nav = `${ROOT} nav`;
  // 把正文滚到第二节贴着容器的上沿
  await page.evaluate((css) => {
    const scroller = document.querySelector<HTMLElement>(css)!;
    const heading = [...scroller.querySelectorAll("header")][1]!;
    scroller.scrollTop +=
      heading.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top;
  }, `${ROOT} [role=region]`);
  const current = await page.waitFor(
    () =>
      page.evaluate((css) => {
        const links = [...document.querySelectorAll(`${css} a`)];
        const index = links.findIndex((link) =>
          link.hasAttribute("aria-current"),
        );
        return index === -1 ? null : { index };
      }, nav),
    "滚到第二节之后目录里应该有一项亮着",
  );
  await page.settled(nav);

  // 粗条贴着列表的左缘，3px 宽：取中间那一列，纵向在那一项的正中
  const bar = (nth: number) =>
    page.evaluate(
      (css, index) => {
        const list = document.querySelector(`${css} ul`)!;
        const link = list.querySelectorAll("a")[index]!.getBoundingClientRect();
        return {
          x: Math.round(list.getBoundingClientRect().left) + 1 + scrollX,
          y: link.top + link.height / 2 + scrollY,
        };
      },
      nav,
      nth,
    );
  await shows(
    page,
    await bar(current.index),
    "Highlight",
    "当前项旁边的粗条应该画成「选中」色",
  );
  await differs(
    page,
    await bar(current.index === 0 ? 1 : 0),
    "Highlight",
    "别的项旁边不该有粗条",
  );
  await declares(page, `${nav} ul`, "backgroundColor", "Highlight", {
    pseudo: "::after",
  });
});

test("复选与单选：已选的是「选中」色的块，圆点看得见；菱形方案的已选是实心的", async () => {
  const { page } = storybook;
  await open(page, "控件-choice-选择控件--checkbox-states");
  const on = `${ROOT} input[type=checkbox]:checked:enabled`;
  const off = `${ROOT} input[type=checkbox]:not(:checked, :indeterminate):enabled`;
  // 方格 20px、描边 2px：往里 4px 是底，对勾还没到这儿
  await shows(
    page,
    await at(page, on, 4, 4),
    "Highlight",
    "已选的方格应该是「选中」色的块",
  );
  await shows(
    page,
    await at(page, `${ROOT} input[type=checkbox]:indeterminate:enabled`, 4, 4),
    "Highlight",
    "半选的方格应该是「选中」色的块",
  );
  await differs(
    page,
    await at(page, off, 4, 4),
    "Highlight",
    "没选的方格不该是实心的",
  );

  await open(page, "控件-choice-选择控件--radio-states");
  const checked = `${ROOT} input[type=radio]:checked:enabled`;
  // 圆 20px，圆点 8px 在正中：顶边往里 4px 是底，正中是圆点
  await shows(
    page,
    await at(page, checked, "center", 4),
    "Highlight",
    "选中的圆应该是「选中」色的",
  );
  await shows(
    page,
    await at(page, checked, "center", "center"),
    "HighlightText",
    "选中的圆正中应该有一个看得见的圆点",
  );
  await differs(
    page,
    await at(
      page,
      `${ROOT} input[type=radio]:not(:checked):enabled`,
      "center",
      4,
    ),
    "Highlight",
    "没选的圆不该是实心的",
  );

  // 菱形方案没有对勾和圆点，"已选"只靠实心
  await open(page, "控件-choice-选择控件--diamond");
  await shows(
    page,
    await at(page, on, "center", "center"),
    "Highlight",
    "菱形方案里已选的应该是「选中」色的实心菱形",
  );
  await differs(
    page,
    await at(page, off, "center", "center"),
    "Highlight",
    "菱形方案里没选的应该是空心的",
  );
});

test("开关：关着看得见轨道和旋钮，开着是「选中」色的实心轨道；双标签开关看得出旋钮在哪边", async () => {
  const { page } = storybook;
  await open(page, "控件-choice-选择控件--switch-states");
  const off = `${ROOT} input[role=switch]:not(:checked):enabled`;
  const on = `${ROOT} input[role=switch]:checked:enabled`;
  // 轨道 52 × 28，旋钮 20px：关的时候旋钮在左边，开了到右边
  await shows(
    page,
    await at(page, off, "center", 1),
    "ButtonText",
    "关着的开关应该有一圈看得见的边线",
  );
  await shows(
    page,
    await at(page, off, 14, "center"),
    "ButtonText",
    "关着的开关左边应该有一个看得见的旋钮",
  );
  await differs(
    page,
    await at(page, off, -10, "center"),
    "Highlight",
    "关着的开关轨道不该是实心的",
  );
  await shows(
    page,
    await at(page, on, 10, "center"),
    "Highlight",
    "开着的开关轨道应该是「选中」色的",
  );
  await shows(
    page,
    await at(page, on, -14, "center"),
    "HighlightText",
    "开着的开关右边应该有一个看得见的旋钮",
  );

  await open(page, "控件-choice-选择控件--dual-label-switch");
  const dual = `${ROOT} input[role=switch]`;
  // 旋钮盖住半条轨道：两头各往里 7px，在字的外侧
  await shows(
    page,
    await at(page, dual, 7, "center"),
    "Highlight",
    "关的时候旋钮应该在左边那个值下面",
  );
  await differs(
    page,
    await at(page, dual, -7, "center"),
    "Highlight",
    "关的时候右边那个值下面不该有旋钮",
  );
  // 旋钮上的值、轨道上的值各用各的字色；都不让系统再改颜色
  await declares(page, `${ROOT} [data-value=off]`, "color", "HighlightText");
  await declares(page, `${ROOT} [data-value=on]`, "color", "CanvasText");
  await unadjusted(page, `${ROOT} [data-value=off]`);

  await page.click(dual);
  await shows(
    page,
    await at(page, dual, -7, "center"),
    "Highlight",
    "开了之后旋钮应该换到右边",
  );
  await differs(
    page,
    await at(page, dual, 7, "center"),
    "Highlight",
    "开了之后左边不该还有旋钮",
  );
  await declares(page, `${ROOT} [data-value=on]`, "color", "HighlightText");
});

test("工具栏的开关钮、图标按钮：按下的是系统的「选中」色", async () => {
  const { page } = storybook;
  await open(page, "控件-toolbar-工具栏--toggles");
  // 前两个是一组只按一个的：标准（按着）、紧凑
  const item = `${ROOT} [role=toolbar] button`;
  const corner = (nth: number) => at(page, item, 3, 3, nth);
  await shows(
    page,
    await corner(0),
    "Highlight",
    "按下的开关钮应该画成「选中」色",
  );
  await differs(page, await corner(1), "Highlight", "没按的不该是「选中」色");
  await declares(page, item, "color", "HighlightText");
  await unadjusted(page, item);

  await page.click("text=紧凑");
  await shows(
    page,
    await corner(1),
    "Highlight",
    "按下第二个：它应该变成「选中」色",
  );
  await differs(page, await corner(0), "Highlight", "第一个应该弹起来了");

  // 三种变体都按着
  await open(page, "控件-iconbutton-图标按钮--pressed");
  const button = `${ROOT} button`;
  for (const nth of [0, 1, 2]) {
    await shows(
      page,
      await at(page, button, 3, 3, nth),
      "Highlight",
      `第 ${nth + 1} 个图标按钮是激活的，应该画成「选中」色`,
    );
  }
  await declares(page, button, "color", "HighlightText");
  await page.click(button);
  await page.waitFor(
    () =>
      page.evaluate(
        (css) =>
          document.querySelector(css)!.getAttribute("aria-pressed") === "false",
        button,
      ),
    "点一下应该取消激活",
  );
  await differs(
    page,
    await at(page, button, 3, 3),
    "Highlight",
    "取消激活之后不该还是「选中」色",
  );
});

test("下拉选择：已选项左缘有一条「选中」色的竖条；组合框：移到的那一项有一圈环", async () => {
  const { page } = storybook;
  await open(page, "控件-select-下拉选择--open");
  const option = "[role=listbox] [role=option]";
  await page.waitVisible(option);
  await page.waitFocused(/^option:/, "面板打开后焦点应该在已选的那一项上");
  // 把焦点挪开：已选项上只剩竖条，没有焦点环
  await page.key("ArrowDown");
  const selected = `${option}[aria-selected=true]`;
  await page.waitFor(
    () =>
      page.evaluate(
        (css) => !document.querySelector(css)!.matches(":focus"),
        selected,
      ),
    "按 ↓ 之后焦点应该离开已选的那一项",
  );
  await shows(
    page,
    await at(page, selected, 1, "center"),
    "Highlight",
    "已选项的左缘应该有一条「选中」色的竖条",
  );
  await differs(
    page,
    await at(page, selected, -1, "center"),
    "Highlight",
    "焦点挪开之后，已选项的右缘不该有东西",
  );
  await declares(page, selected, "backgroundColor", "Highlight", {
    pseudo: "::before",
  });

  await open(page, "控件-combobox-组合框--open");
  await page.waitVisible(option);
  // 焦点一直在输入框里：选项上的环是跟着"移到了哪一项"画的
  await page.evaluate(() =>
    document.querySelector<HTMLElement>("[role=combobox]")!.focus(),
  );
  await page.waitFocused(/^combobox:/);
  await page.key("ArrowDown");
  const moved = `${option}[data-highlighted]`;
  await page.waitVisible(moved, "按 ↓ 之后应该移到某一项上");
  await declares(page, moved, "outlineColor", "Highlight");
  await shows(
    page,
    await at(page, moved, "center", 1),
    "Highlight",
    "移到的那一项上沿应该有一圈「选中」色的环",
  );
  await differs(
    page,
    await at(
      page,
      `${option}:not([data-highlighted], [aria-selected=true])`,
      "center",
      1,
    ),
    "Highlight",
    "没移到的项不该有环",
  );
});
