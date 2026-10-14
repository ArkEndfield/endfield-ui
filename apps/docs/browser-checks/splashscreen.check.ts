// 开屏页：16:9 下各部分的位置对着官网的实测值；竖排换一套排法；横竖和尺寸看的是它所在的那一块，
// 不是视口；整页模式锁住页面，退场后把焦点还回去。动效（补间、铺满、淡出的时间）在 motion.check.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook({ width: 1280, height: 720 });

const SPLASH = "#storybook-root [data-state]";
const PLAYGROUND = "控件-splashscreen-开屏页--playground";

type Box = { x: number; y: number; width: number; height: number };

/**
 * 打开一个 story，并把它那个框定成指定的大小、挪到视口的左上角。
 * 尺寸直接写在框上，不靠预览页自己排出来多宽：量的是"这么大的一块里它怎么排"
 */
async function open(
  page: Page,
  id: string,
  frame: { width: number; height: number },
  viewport = frame,
) {
  await page.setSize(viewport.width, viewport.height);
  await page.story(id, "light");
  await page.evaluate(
    (css, width, height) => {
      const box = document.querySelector(css)!.parentElement!;
      box.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px;max-width:none;aspect-ratio:auto;border:0;z-index:99`;
    },
    SPLASH,
    frame.width,
    frame.height,
  );
  // "减少动态效果"下每个属性的变化仍是一次 0.01ms 的过渡，要到下一帧才走完；换了横竖的时候
  // 是一环套一环的（单位变了，用它算的宽高才跟着变），前后要三帧。等它们全停下再量
  await page.settled(SPLASH);
}

/** 各部分的盒子（相对开屏页自己），和几样读出来的字号 */
const measure = (page: Page) =>
  page.evaluate((css) => {
    const root = document.querySelector(css)!;
    const origin = root.getBoundingClientRect();
    const box = (node: Element | null | undefined): Box | null => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const round = (value: number) => Math.round(value * 10) / 10;
      return {
        x: round(rect.x - origin.x),
        y: round(rect.y - origin.y),
        width: round(rect.width),
        height: round(rect.height),
      };
    };
    const size = (node: Element | null | undefined) =>
      node ? Number.parseFloat(getComputedStyle(node).fontSize) : null;
    const bar = root.querySelector("[role=progressbar]")!;
    const marker = bar.children[1]!;
    const group = bar.previousElementSibling!;
    const reading = marker.children.length > 1 ? marker.children[0]! : null;
    const tagline = group.querySelector(":scope > p");
    const caption = group.querySelector(":scope > div p");
    return {
      root: { width: origin.width, height: origin.height },
      logo: box(group.previousElementSibling),
      group: box(group),
      mark: box(group.querySelector(":scope > svg")),
      decor: box(group.querySelector(":scope > div")),
      caption: box(caption),
      divider: box(group.querySelector(":scope > span")),
      tagline: box(tagline),
      bar: box(bar)!,
      fill: box(bar.children[0])!,
      reading: box(reading),
      status: box(marker.lastElementChild)!,
      font: {
        number: size(reading?.children[1]),
        percent: size(reading?.children[2]),
        status: size(marker.lastElementChild),
        tagline: size(tagline),
      },
    };
  }, SPLASH);

/** 差不到一个像素就算一样：位置是按容器宽度的百分比算的，带小数 */
function near(actual: number | undefined, expected: number, message: string) {
  assert.ok(
    actual !== undefined && Math.abs(actual - expected) <= 1,
    `${message}：应该是 ${expected}，量到 ${actual}`,
  );
}

test("横排：1280×720 下各部分的位置和官网实测的一样", async () => {
  const { page } = storybook;
  // 这个 story 的进度是 51。官网这个宽度下 1rem 是 8px（docs/design/references/measurements.md 8.13）
  await open(page, PLAYGROUND, { width: 1280, height: 720 });
  const at = await measure(page);
  const unit = 8;

  // 进度条：贴左缘 1.25rem 宽、通高，从上往下长到 51%
  assert.deepEqual(at.bar, { x: 0, y: 0, width: 10, height: 720 });
  near(at.fill.height, 720 * 0.51, "条长");
  assert.equal(at.fill.y, 0, "条从上沿起");

  // 读数：距左 3.125rem，底边在条的末端以上 1.625rem；一共 6.5rem 高（小竖条 + 数字）
  const tip = 720 * 0.51;
  near(at.reading?.x, 3.125 * unit, "读数的左边");
  near(at.reading!.y + at.reading!.height, tip - 1.625 * unit, "读数的底边");
  near(at.reading?.height, 6.5 * unit, "读数的高");
  near(at.font.number ?? 0, 4.375 * unit, "数字的字号");
  near(at.font.percent ?? 0, 3.25 * unit, "百分号的字号");
  // 状态字：从末端以上 0.5rem 起
  near(at.status.x, 3.125 * unit, "状态字的左边");
  near(at.status.y, tip - 0.5 * unit, "状态字的上边");

  // 标志：左 64.4531%、上 27.625rem，16.5 × 16.75rem
  near(at.logo?.x, 1280 * 0.644531, "标志的左边");
  near(at.logo?.y, 27.625 * unit, "标志的上边");
  near(at.logo?.width, 16.5 * unit, "标志的宽");
  near(at.logo?.height, 16.75 * unit, "标志的高");

  // 微标组：那张 4rem 高的微标图从 59.375rem 起，所以分隔线的上边距从 63.375rem 起
  const anchor = 63.375 * unit;
  near(at.group?.x, 1280 * 0.644531, "微标组的左边");
  near(at.decor!.y + at.decor!.height, anchor, "微标的底边");
  near(at.decor?.x, 1280 * 0.644531, "微标的左边");
  // 分隔线：再往下 1.25rem，往左伸出 21.625rem，70rem 宽、2px 高
  near(at.divider?.y, anchor + 1.25 * unit, "分隔线的上边");
  near(at.divider?.x, 1280 * 0.644531 - 21.625 * unit, "分隔线的左边");
  near(at.divider?.width, 70 * unit, "分隔线的宽");
  assert.equal(at.divider?.height, 2, "分隔线的高");
  // 标语：线下面 1rem，字号 1.5rem
  near(at.tagline?.y, anchor + 1.25 * unit + 2 + unit, "标语的上边");
  near(at.font.tagline ?? 0, 1.5 * unit, "标语的字号");
  // 三角标：微标组左侧 3.375rem，比微标图的上边低 1.5rem
  near(at.mark?.x, 1280 * 0.644531 - 3.375 * unit, "三角标的左边");
  near(at.mark?.y, anchor - 2.5 * unit, "三角标的上边");
});

test("竖排：条横在下面、从左往右长，读数在它的末端；标志居中，微标组靠左下", async () => {
  const { page } = storybook;
  await open(page, PLAYGROUND, { width: 375, height: 812 });
  const at = await measure(page);
  const unit = 375 / 67.5;

  // 条：轨道宽 82.4074%、高 2.5rem，贴左缘
  near(at.bar.x, 0, "条的左边");
  near(at.bar.width, 375 * 0.824074, "轨道的宽");
  near(at.bar.height, 2.5 * unit, "轨道的高");
  near(at.fill.width, 375 * 0.824074 * 0.51, "条长");
  near(at.fill.height, at.bar.height, "条的高");
  // 读数在末端右边 0.75rem，竖着和条差不多齐
  near(at.reading?.x, at.fill.width + 0.75 * unit, "读数的左边");
  assert.ok(
    at.reading!.y < at.bar.y && at.reading!.y + at.reading!.height > at.bar.y,
    "读数应该从条的上方伸下来、和条搭着",
  );
  assert.ok(at.status.y >= at.bar.y, "状态字应该在条的下半边往下");

  // 标志：水平居中，中心在上 50rem（官网实测）
  near(at.logo!.x + at.logo!.width / 2, 375 / 2, "标志的水平中心");
  near(at.logo!.y + at.logo!.height / 2, 50 * unit, "标志的竖直中心");
  near(at.logo?.width, 19.3125 * unit, "标志的宽");
  // 微标组：左 4.625rem，标语的底边距底 5.75rem
  near(at.group?.x, 4.625 * unit, "微标组的左边");
  near(at.tagline!.y + at.tagline!.height, 812 - 5.75 * unit, "标语的底边");
  // 竖排没有三角标，也放不下微文字
  assert.equal(at.mark?.width, 0, "竖排不该有三角标");
  assert.equal(at.caption?.width, 0, "竖排不该有微文字");

  // 字有下限（12px），多出来的高度由条往上让：状态字不压到下面的微标上
  assert.equal(at.font.status, 12);
  assert.equal(at.font.tagline, 12);
  assert.ok(
    at.status.y + at.status.height <= at.decor!.y + 0.5,
    `状态字（到 ${at.status.y + at.status.height}）不该压到微标（从 ${at.decor!.y} 起）上`,
  );
});

test("横竖看它所在的那一块，不看视口", async () => {
  const { page } = storybook;
  // 横着的视口里一个竖着的框
  await open(
    page,
    PLAYGROUND,
    { width: 300, height: 600 },
    { width: 1280, height: 720 },
  );
  let at = await measure(page);
  assert.ok(at.bar.width > at.bar.height, "竖着的框里条应该是横的");

  // 竖着的视口里一个横着的框
  await open(
    page,
    PLAYGROUND,
    { width: 560, height: 315 },
    { width: 600, height: 900 },
  );
  at = await measure(page);
  assert.ok(at.bar.height > at.bar.width, "横着的框里条应该是竖的");
});

test("尺寸跟着宽度等比缩放，状态字和标语有下限；标语放不下就折行，不伸到外面", async () => {
  const { page } = storybook;
  await open(page, PLAYGROUND, { width: 640, height: 360 });
  const at = await measure(page);
  // 一半的宽度，一半的尺寸
  near(at.bar.width, 5, "条的宽");
  near(at.font.number ?? 0, 17.5, "数字的字号");
  near(at.logo?.width, 66, "标志的宽");
  assert.equal(at.font.status, 12, "状态字不小于 12px");
  assert.equal(at.font.tagline, 12, "标语不小于 12px");
  assert.ok(at.tagline!.x + at.tagline!.width <= 640, "标语不该伸到开屏页外面");
});

test("别的宽高比：纵向位置和官网一样按宽度定；超宽放不下时往上收，不掉出底边", async () => {
  const { page } = storybook;
  // 比 16:9 高（4:3）：和官网一样，从上往下 27.625rem 和 63.375rem，这一列偏在上半边
  await open(page, PLAYGROUND, { width: 1280, height: 960 });
  let at = await measure(page);
  near(at.logo?.y, 27.625 * 8, "4:3 下标志的上边");
  near(at.decor!.y + at.decor!.height, 63.375 * 8, "4:3 下微标的底边");

  // 比 16:9 扁很多：照官网排，标语会贴到底边甚至掉出去。往上收，标语的底边离底 4 个单位
  await open(page, PLAYGROUND, { width: 1720, height: 720 });
  at = await measure(page);
  const unit = 1720 / 160;
  near(at.logo?.y, 720 - 44.25 * unit, "超宽时标志的上边");
  near(at.decor!.y + at.decor!.height, 720 - 8.5 * unit, "超宽时微标的底边");
  assert.ok(
    at.tagline!.y + at.tagline!.height <= 720 - 3.5 * unit,
    "超宽时标语不该贴到底边",
  );
});

test("读数画的是进度取整，条和读数的位置是同一个进度；底图的模糊跟着进度", async () => {
  const { page } = storybook;
  // 这个 story 的进度是 24，带底图
  await open(page, "控件-splashscreen-开屏页--backdrop", {
    width: 1280,
    height: 720,
  });
  const read = await page.evaluate((css) => {
    const root = document.querySelector(css)!;
    const style = getComputedStyle(root);
    const bar = root.querySelector("[role=progressbar]")!;
    const number = bar.children[1]!.children[0]!.children[1]!;
    const backdrop = root.firstElementChild!.firstElementChild!;
    return {
      progress: style.getPropertyValue("--ef-splash-progress"),
      percent: style.getPropertyValue("--ef-splash-percent"),
      now: bar.getAttribute("aria-valuenow"),
      content: getComputedStyle(number, "::before").content,
      drawn: number.getBoundingClientRect().width > 0,
      fill: bar.children[0]!.getBoundingClientRect().height,
      marker: bar.children[1]!.getBoundingClientRect().top,
      filter: getComputedStyle(backdrop).filter,
      hidden: backdrop.getAttribute("aria-hidden"),
    };
  }, SPLASH);
  assert.equal(read.progress, "24");
  assert.equal(read.percent, "24");
  assert.equal(read.now, "24");
  assert.equal(read.content, "counter(ef-splash)", "数字应该是计数器画的");
  assert.ok(read.drawn, "数字应该画出来了");
  near(read.fill, 720 * 0.24, "条长");
  near(read.marker, 720 * 0.24, "读数的基线");
  // 8px 起，随进度降到 0：24% 时还剩 76%
  assert.equal(read.filter, "blur(6.08px)");
  assert.equal(read.hidden, "true", "底图是氛围，对读屏隐藏");
});

test("不确定进度：没有数字，条上是一块来回走的色块；减少动态效果下停在正中", async () => {
  const { page } = storybook;
  await open(page, "控件-splashscreen-开屏页--indeterminate", {
    width: 1280,
    height: 720,
  });
  const read = await page.evaluate((css) => {
    const root = document.querySelector(css)!;
    const bar = root.querySelector("[role=progressbar]")!;
    const block = bar.children[0]!.children[0]!;
    const rect = block.getBoundingClientRect();
    return {
      now: bar.getAttribute("aria-valuenow"),
      reading: bar.children[1]!.children.length,
      animation: getComputedStyle(block).animationName,
      top: rect.top,
      height: rect.height,
    };
  }, SPLASH);
  assert.equal(read.now, null, "不知道进度就不该报数");
  assert.equal(read.reading, 1, "只剩状态字，没有数字");
  assert.equal(read.animation, "ef-indeterminate-y");
  // 色块是轨道的 40% 长，停在正中：上下各空 30%
  near(read.height, 720 * 0.4, "色块的长");
  near(read.top, 720 * 0.3, "色块的上边");
});

test("整页：铺满视口、锁住页面、焦点出不去；退场后页面放开，焦点回到原来的按钮", async () => {
  const { page } = storybook;
  await page.setSize(1280, 720);
  await page.story("控件-splashscreen-开屏页--fullscreen", "light");
  const locked = () =>
    page.evaluate(() => document.documentElement.style.overflow === "hidden");
  assert.equal(await locked(), false, "没打开的时候不该锁页面");

  await page.click("text=打开");
  await page.waitVisible(SPLASH);
  const shown = await page.evaluate((css) => {
    const root = document.querySelector(css)!;
    const rect = root.getBoundingClientRect();
    return {
      box: [rect.x, rect.y, rect.width, rect.height],
      view: [0, 0, innerWidth, innerHeight],
      focused: document.activeElement === root,
    };
  }, SPLASH);
  assert.deepEqual(shown.box, shown.view, "应该铺满视口");
  assert.ok(shown.focused, "焦点应该收进开屏页");
  assert.equal(await locked(), true, "打开的时候应该锁住页面滚动");

  await page.key("Tab");
  await page.key("Tab", { shift: true });
  assert.ok(
    await page.evaluate(
      (css) => document.activeElement === document.querySelector(css),
      SPLASH,
    ),
    "Tab 不该把焦点带到被盖住的内容里",
  );

  // 进度自己走到头，然后退场（这里是减少动态效果，不等）
  await page.waitFor(
    async () => !(await page.visible(SPLASH)),
    "进度到头之后开屏页应该卸载",
    15_000,
  );
  assert.equal(await locked(), false, "卸载之后应该放开页面");
  await page.waitFocused("button:打开", "焦点应该回到打开它的按钮上");
  await page.waitFor(
    () =>
      page.evaluate(
        () =>
          document.querySelector("#storybook-root [aria-live]")!.textContent ===
          "开屏页已经卸载",
      ),
    "应该先后报过 onReveal 和 onExited",
  );
});
