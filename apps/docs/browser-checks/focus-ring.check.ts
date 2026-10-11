// 键盘聚焦时看得见焦点环，颜色跟着主题走（亮色是墨色，暗色是黄色）；
// 环画在一块实心的"选中"底里面时，换成和那块底分得开的颜色
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

/** 当前焦点（或它的某一层父元素）上的焦点环，以及这个位置上 `focus` 令牌的取值 */
function ring(page: Page, levelsUp = 0) {
  return page.evaluate((levels) => {
    let element = document.activeElement as HTMLElement;
    for (let i = 0; i < levels; i++) element = element.parentElement!;
    const style = getComputedStyle(element);
    // 令牌写的是十六进制，量到的是 rgb()：借一个元素把前者也换算成 rgb()
    const probe = document.createElement("span");
    probe.style.color = style.getPropertyValue("--ef-focus");
    element.append(probe);
    const token = getComputedStyle(probe).color;
    probe.remove();
    return {
      style: style.outlineStyle,
      width: style.outlineWidth,
      color: style.outlineColor,
      token,
    };
  }, levelsUp);
}

/**
 * 等焦点环画出来：2px 实线、`focus` 令牌的颜色。
 * 要等而不是直接量——"减少动态效果"把所有过渡压到 0.01ms，但仍然是一次过渡，
 * 聚焦后的头一帧量到的是起点值（3px、文字色）。
 */
async function waitRing(page: Page, where: string, levelsUp = 0) {
  let found: Awaited<ReturnType<typeof ring>> | undefined;
  try {
    await page.waitFor(
      async () => {
        found = await ring(page, levelsUp);
        return (
          found.style === "solid" &&
          found.width === "2px" &&
          found.color === found.token
        );
      },
      "",
      2000,
    );
  } catch {
    assert.fail(
      `${where}的焦点环不对（要 2px 实线、focus 令牌的颜色）：${JSON.stringify(found)}`,
    );
  }
}

/** 当前焦点上的焦点环和它压着的那块底，以及这个位置上两个令牌各自的取值（都是 rgb()） */
function ringOnFill(
  page: Page,
  tokens: { ring: string; fill: string },
  pseudo: string | null,
) {
  return page.evaluate(
    (ringToken, fillToken, where) => {
      const element = document.activeElement as HTMLElement;
      const style = getComputedStyle(element);
      // 探针每个令牌新建一个：在同一个元素上连着改颜色，读到的是上一个值
      const resolve = (name: string) => {
        const probe = document.createElement("span");
        probe.style.color = style.getPropertyValue(name);
        element.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      return {
        style: style.outlineStyle,
        width: style.outlineWidth,
        offset: style.outlineOffset,
        ring: style.outlineColor,
        fill: getComputedStyle(element, where).backgroundColor,
        ringToken: resolve(ringToken),
        fillToken: resolve(fillToken),
      };
    },
    tokens.ring,
    tokens.fill,
    pseudo,
  );
}

/**
 * 焦点环画在一块实心的底里面：等环和底都到位（各是哪个令牌），再看这两个颜色分不分得开。
 * 普通的焦点色在亮色下是墨色、暗色下是黄色，正好分别和反转块、行动色的底是同一个颜色。
 * 底也要等：暗色主题是载入之后过渡过去的，头几帧量到的还是亮色那一档。
 * `pseudo` 是底画在哪个伪元素上（楔形画在 `::before`），不传就是元素自己。
 * `offset` 是环离边多远（声明的值）：贴边是 -2px；颜色和页面分不开的那一种要再往里收
 */
async function waitRingOnFill(
  page: Page,
  where: string,
  tokens: { ring: string; fill: string },
  {
    pseudo = null,
    offset = "-2px",
  }: { pseudo?: string | null; offset?: string } = {},
) {
  // 先等过渡走完：环的颜色是从文字色过渡过来的，而黄楔上的字正好就是 `on-action`——
  // 刚聚焦就读，一个没换颜色的环也会在头一帧碰巧"对上"
  await page.settled();
  let found: Awaited<ReturnType<typeof ringOnFill>> | undefined;
  try {
    await page.waitFor(
      async () => {
        found = await ringOnFill(page, tokens, pseudo);
        return (
          found.style === "solid" &&
          found.width === "2px" &&
          found.offset === offset &&
          found.ring === found.ringToken &&
          found.fill === found.fillToken
        );
      },
      "",
      2000,
    );
  } catch {
    assert.fail(
      `${where}的焦点环不对（要 2px 实线、离边 ${offset}、${tokens.ring} 的颜色，压在 ${tokens.fill} 的底上）：${JSON.stringify(found)}`,
    );
  }
  assert.notEqual(
    found!.ring,
    found!.fill,
    `${where}的焦点环和它压着的底是同一个颜色，看不见`,
  );
}

for (const theme of ["light", "dark"] as const) {
  test(`${theme}：月历选中格的焦点环画在实心块里面，颜色和那块底分得开`, async () => {
    const { page } = storybook;
    await page.story("控件-calendar-月历--pick-range", theme);
    // 两个翻月的钮，然后是网格里唯一的停靠点：这一段的起始日
    await page.key("Tab");
    await page.key("Tab");
    await page.key("Tab");
    await page.waitFocused(/^button:.*起始日$/);
    await waitRingOnFill(page, "月历的起始日", {
      ring: "--ef-accent-ink-inverse",
      fill: "--ef-surface-inverse",
    });

    // 往前一天不在这一段里：它压在页面上，照旧是普通的焦点色
    await page.key("ArrowLeft");
    await page.waitFor(
      () =>
        page.evaluate(
          () =>
            document.activeElement?.getAttribute("data-date") === "2026-10-06",
        ),
      "焦点没有走到前一天",
    );
    await waitRing(page, "没选中的日期格");
  });

  test(`${theme}：楔形页签选中项的焦点环画在黄楔里面，颜色和黄底分得开`, async () => {
    const { page } = storybook;
    await page.story("控件-tabs-页签--wedge", theme);
    await page.key("Tab");
    await page.waitFocused("tab:物资");
    // 墨色的环贴着边时，在暗色页面上和页面分不开：它再往里收 2px，两边都是黄
    await waitRingOnFill(
      page,
      "选中的楔形页签",
      { ring: "--ef-on-action", fill: "--ef-action" },
      { pseudo: "::before", offset: "-4px" },
    );
  });

  test(`${theme}：深色面板里打开下拉，焦点落在黄底的当前项上，焦点环和黄底分得开`, async () => {
    const { page } = storybook;
    await page.story("控件-select-下拉选择--strong-panel", theme);
    await page.key("Tab");
    await page.waitFocused("combobox:语言");
    await page.key("Enter");
    await page.waitVisible("[role=listbox]");
    await page.waitFocused("option:简体中文");
    // 面板是深色的局部主题，焦点色是黄的；墨色的环贴着边又和面板分不开，所以往里收
    await waitRingOnFill(
      page,
      "深色面板的当前项",
      { ring: "--ef-on-action", fill: "--ef-action" },
      { offset: "-4px" },
    );

    // 别的项压在深色的面板上：照旧是贴边的普通焦点色
    await page.key("ArrowDown");
    await page.waitFocused("option:English");
    await page.settled();
    await waitRing(page, "深色面板里不是当前项的选项");
  });

  test(`${theme}：深色面板的单选菜单，当前项的焦点环和黄底分得开`, async () => {
    const { page } = storybook;
    await page.story("控件-dropdownmenu-下拉菜单--language", theme);
    await page.key("Tab");
    await page.key("Enter");
    await page.waitVisible("[role=menu]");
    await page.waitFocused("menuitemradio:简体中文");
    await waitRingOnFill(
      page,
      "深色面板里选中的单选项",
      { ring: "--ef-on-action", fill: "--ef-action" },
      { offset: "-4px" },
    );
  });

  test(`${theme}：全屏菜单当前项的焦点环和黄底分得开，而且不贴边`, async () => {
    const { page } = storybook;
    await page.story("控件-topbar-顶栏与全屏菜单--menu-open", theme);
    await page.waitVisible("[role=dialog]");
    await page.waitFocused("a:总览");
    await page.key("Tab");
    await page.waitFocused("a:调度");
    await waitRingOnFill(
      page,
      "全屏菜单的当前项",
      { ring: "--ef-on-action", fill: "--ef-action" },
      { offset: "-4px" },
    );
  });

  test(`${theme}：菜单项有焦点环`, async () => {
    const { page } = storybook;
    await page.story("控件-dropdownmenu-下拉菜单--playground", theme);
    await page.key("Tab");
    await page.key("Enter");
    await page.waitVisible("[role=menu]");
    await page.key("ArrowDown");
    await waitRing(page, "菜单项");
  });

  test(`${theme}：下拉的选项有焦点环，触发器的环画在外框上`, async () => {
    const { page } = storybook;
    await page.story("控件-select-下拉选择--playground", theme);
    await page.key("Tab");
    await page.waitFocused("combobox:地区");
    await waitRing(page, "触发器的外框", 1);

    await page.key("Enter");
    await page.waitVisible("[role=listbox]");
    await page.key("ArrowDown");
    await waitRing(page, "选项");
  });
}

test("两个主题下焦点环的颜色不同", async () => {
  const { page } = storybook;
  const colors: string[] = [];
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-dropdownmenu-下拉菜单--playground", theme);
    await page.key("Tab");
    colors.push((await ring(page)).token);
  }
  assert.notEqual(colors[0], colors[1]);
});
