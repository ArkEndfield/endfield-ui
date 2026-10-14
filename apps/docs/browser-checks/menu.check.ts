// 下拉菜单：键盘开合与移动、按字母跳转、指针高亮、单选组、贴边不出视口；面板顶上的强调条
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const MENU = "[role=menu]";
const TRIGGER = "button[aria-haspopup]";

/** 焦点直接放到触发按钮上再回车：键盘打开的菜单，焦点会落在第一项 */
async function openWithKeyboard(page: Page) {
  await page.evaluate(() =>
    document.querySelector<HTMLElement>("button[aria-haspopup]")!.focus(),
  );
  await page.key("Enter");
  await page.waitVisible(MENU);
}

test("键盘：回车打开，方向键循环（禁用项也走得到），Home / End，Esc 关闭后焦点回到触发按钮", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--playground");

  await page.key("Tab");
  await page.waitFocused("button:更多操作");
  await page.key("Enter");
  await page.waitVisible(MENU);
  await page.waitFocused("menuitem:复制一份", "打开后焦点应该在第一项");

  const walk: string[] = [];
  for (let i = 0; i < 5; i++) {
    await page.key("ArrowDown");
    walk.push(await page.focused());
  }
  assert.deepEqual(walk, [
    // 行尾的快捷键也算在文字里
    "menuitem:锁定L",
    // 禁用项读屏要能读到，所以键盘走得到
    "menuitem:移动到…",
    "menuitem:查看详情",
    "menuitem:销毁",
    "menuitem:复制一份",
  ]);

  await page.key("End");
  assert.equal(await page.focused(), "menuitem:销毁");
  await page.key("Home");
  assert.equal(await page.focused(), "menuitem:复制一份");

  await page.key("Escape");
  await page.waitGone(MENU);
  await page.waitFocused("button:更多操作", "关闭后焦点应该回到触发按钮");
});

test("按字母跳到以它开头的项", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--language");
  await openWithKeyboard(page);
  await page.key("e");
  await page.waitFocused("menuitemradio:English");
});

test("指针经过的项被高亮；点外面关闭", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--playground");
  await page.click("text=更多操作");
  await page.waitVisible(MENU);

  // 菜单里唯一的链接项
  await page.moveTo("a[role=menuitem]");
  await page.waitFor(
    () =>
      page.evaluate(
        () =>
          document.querySelector("[data-highlighted]")?.textContent ===
          "查看详情",
      ),
    "指针经过的项没有被高亮",
  );

  await page.click({ x: 700, y: 500 });
  await page.waitGone(MENU);
});

test("单选组：选了之后菜单关上，再打开时它是当前项", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--sorting");
  await openWithKeyboard(page);
  await page.waitFocused("menuitemradio:按数量");
  await page.key("ArrowDown");
  await page.key("Enter");
  await page.waitGone(MENU, "选了之后菜单应该关上");
  await page.waitFor(
    async () => (await page.text(TRIGGER))[0]?.includes("按稀有度"),
    "触发按钮上应该写着新选的排序方式",
  );

  await openWithKeyboard(page);
  assert.deepEqual(await page.text("[role=menuitemradio][aria-checked=true]"), [
    "按稀有度",
  ]);
});

test("触发按钮贴近右边缘时，面板不出视口", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--playground");
  await page.evaluate(() => {
    document.querySelector<HTMLElement>(
      "button[aria-haspopup]",
    )!.style.marginLeft = `${innerWidth - 110}px`;
  });
  await page.click(TRIGGER);
  await page.waitVisible(MENU);
  assert.ok(
    await page.evaluate(() => {
      const rect = document
        .querySelector("[role=menu]")!
        .getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth;
    }),
    "面板超出了视口",
  );
});

const menus = (page: Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll("[role=menu]")].filter(
        (menu) => menu.getBoundingClientRect().height > 0,
      ).length,
  );

test("复选项：空格切换，菜单不关", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--view-options");
  await openWithKeyboard(page);
  await page.waitFocused("menuitemcheckbox:缩略图");

  const checked = () =>
    page.evaluate(() => document.activeElement?.getAttribute("aria-checked"));
  assert.equal(await checked(), "true");
  await page.key("Space");
  await page.waitFor(
    async () => (await checked()) === "false",
    "空格应该把勾去掉",
  );
  assert.ok(await page.visible(MENU), "勾选之后菜单不应该关");
});

test("子菜单：方向键右打开并进到第一项，左收起并回到这一行", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--view-options");
  await openWithKeyboard(page);
  // 缩略图 → 紧凑行距 → 按类别分组（禁用）→ 导出为
  for (let i = 0; i < 3; i++) await page.key("ArrowDown");
  await page.waitFocused("menuitem:导出为");
  assert.equal(await menus(page), 1);

  await page.key("ArrowRight");
  await page.waitFor(async () => (await menus(page)) === 2, "子菜单没有打开");
  await page.waitFocused("menuitem:表格（CSV）", "焦点应该进到子菜单的第一项");

  // 子面板进场时从这一行那一侧挪过来 4px：等它落稳再量
  await page.settled();
  const layout = await page.evaluate(() => {
    const [main, sub] = [...document.querySelectorAll("[role=menu]")].map(
      (menu) => menu.getBoundingClientRect(),
    );
    const row = [...document.querySelectorAll("[role=menuitem]")]
      .find((item) => item.textContent === "导出为")!
      .getBoundingClientRect();
    const first = document.activeElement!.getBoundingClientRect();
    return {
      beside: sub!.left >= main!.right - 1,
      rowsAligned: Math.abs(first.top - row.top) < 1.5,
    };
  });
  assert.deepEqual(layout, { beside: true, rowsAligned: true });

  await page.key("ArrowLeft");
  await page.waitFor(async () => (await menus(page)) === 1, "子菜单没有收起");
  await page.waitFocused("menuitem:导出为");

  await page.key("Escape");
  await page.waitGone(MENU);
});

test("子菜单：指针停在这一行上就打开；右边放不下时翻到左边", async () => {
  const { page } = storybook;
  await page.story("控件-dropdownmenu-下拉菜单--view-options");
  await page.evaluate(() => {
    document.querySelector<HTMLElement>(
      "button[aria-haspopup]",
    )!.style.marginLeft = `${innerWidth - 260}px`;
  });
  await page.click(TRIGGER);
  await page.waitVisible(MENU);
  await page.moveTo("[role=menuitem][aria-haspopup]");
  await page.waitFor(async () => (await menus(page)) === 2, "子菜单没有打开");

  assert.ok(
    await page.evaluate(() =>
      [...document.querySelectorAll("[role=menu]")].every((menu) => {
        const rect = menu.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth;
      }),
    ),
    "子菜单超出了视口",
  );
});

/** 这一点画出来是什么：一张 1×1 的截图。只拿来比一样不一样 */
async function pixel(page: Page, x: number, y: number): Promise<string> {
  const { data } = await page.send("Page.captureScreenshot", {
    format: "png",
    clip: { x, y, width: 1, height: 1, scale: 1 },
  });
  // 截图之后页面会被当成失去焦点，键盘事件慢一拍
  await page.send("Page.bringToFront");
  return data;
}

/**
 * 开着的那块跟随主题的面板：左上角（边线的外沿）和右边。
 * 带 `data-variant` 的不止面板（按钮也带），面板另外还带着基元给的 `data-side`
 */
const panelBox = (page: Page) =>
  page.evaluate(() => {
    const panel = [
      ...document.querySelectorAll("[data-variant=plain][data-side]"),
    ].find((element) => element.getBoundingClientRect().height > 0)!;
    const rect = panel.getBoundingClientRect();
    return { left: rect.left, top: rect.top, right: rect.right };
  });

test("菜单面板一族：顶上的强调条挂着一个朝下的小三角，压在第一行的底色之上", async () => {
  const { page } = storybook;

  /*
   * 条从面板的左上角起，高 3px；三角接在它下面，露出 8×4，中心距左 32px。
   * 取的点都是整个像素落在形状里面（或外面）的：斜边上的那几个像素是半透明的，不取
   */
  const look = async () => {
    // 面板进场时挪 4px，条和三角从左伸出来：都走完了再量
    await page.settled();
    const { left, top, right } = await panelBox(page);
    assert.ok(
      Number.isInteger(left) && Number.isInteger(top),
      `面板没有落在整像素上（${left}, ${top}），下面取的点对不上`,
    );
    return {
      bar: await pixel(page, left + 10, top + 1),
      // 右半边没有条：同一行上是面板的底
      ground: await pixel(page, right - 10, top + 2),
      // 三角里：条和第一行之间的那 2px，以及探进第一行的头一个像素
      inGap: await pixel(page, left + 32, top + 4),
      inRow: await pixel(page, left + 32, top + 5),
      // 三角外：两边，和尖的下面
      before: await pixel(page, left + 22, top + 4),
      after: await pixel(page, left + 42, top + 4),
      below: await pixel(page, left + 32, top + 8),
      // 第一行里、离三角远一点的地方：这一行的底
      row: await pixel(page, left + 60, top + 6),
    };
  };

  // 下拉菜单把滚动写在面板自己身上：三角不能被它裁掉
  await page.story("控件-dropdownmenu-下拉菜单--open");
  await page.waitVisible(MENU);
  const menu = await look();
  assert.notEqual(menu.bar, menu.ground, "条应该是行动色，不是面板的底");
  assert.equal(menu.inGap, menu.bar, "条的下面应该挂着三角");
  assert.equal(menu.inRow, menu.bar, "三角应该有 4px 高");
  assert.deepEqual(
    [menu.before, menu.after, menu.below],
    [menu.ground, menu.ground, menu.ground],
    "三角只有 8px 宽、4px 高，旁边和尖的下面是面板的底",
  );

  // 下拉选择的第一行就是选项：指针停上去有悬停底，三角仍然在它上面
  await page.story("控件-select-下拉选择--open");
  await page.waitVisible("[role=listbox]");
  const rest = await look();
  assert.equal(rest.inGap, rest.bar, "下拉选择的面板也应该有三角");
  assert.equal(rest.row, rest.ground, "第一行平时没有底色");

  await page.moveTo("[role=option]");
  await page.waitFor(
    () =>
      page.evaluate(() =>
        document.querySelector("[role=option]")?.matches("[data-highlighted]"),
      ),
    "指针停在第一项上，它应该被高亮",
  );
  // "仍然是"这一类：等动效走完、再等一会儿，只问一次
  await page.settled();
  await page.pause(300);
  const hovered = await look();
  assert.notEqual(hovered.row, hovered.ground, "第一行应该有了悬停底");
  assert.equal(hovered.inRow, hovered.bar, "三角被第一行的底色盖住了");
});
