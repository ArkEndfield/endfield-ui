// 示例页"实机风格"：三个弹窗除了能点开，还直接摆在页面上——摆着的不拦页面，点开的照常是模态
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const STORY = "示例-实机风格--page";
const STAGE = "#storybook-root [data-stage]";
const POPUP = "[role=dialog], [role=alertdialog]";
const HOVER_PANEL = "[data-item-tooltip-panel]";

/**
 * 那三块是滚到跟前才打开的：把视口拉高，三块都在视口里，再等它们各自的弹窗出来。
 * 每条检查自己调一次——上一条可能把视口改窄了。
 */
async function open(page: Page, width = 1200, height = 2400) {
  await page.setSize(width, height);
  await page.story(STORY);
  await page.waitEqual(
    () =>
      page.evaluate(
        ([stage, popup]) =>
          [...document.querySelectorAll(stage!)].map(
            (element) => element.querySelectorAll(popup!).length,
          ),
        [STAGE, POPUP],
      ),
    [1, 1, 1],
    "三块里应该各摆着一个弹窗",
  );
  await page.settled();
}

/** 每一块和它里面的弹窗各在哪 */
function layout(page: Page) {
  return page.evaluate(
    ([stage, popup]) =>
      [...document.querySelectorAll(stage!)].map((element) => {
        const box = element.getBoundingClientRect();
        const rect = element.querySelector(popup!)!.getBoundingClientRect();
        return {
          label: element.getAttribute("data-stage"),
          // 弹窗在这一块的左右之内、上沿之下（通栏确认的按钮有意探出面板的下沿，不量下面）
          inside:
            rect.left >= box.left - 1 &&
            rect.right <= box.right + 1 &&
            rect.top >= box.top - 1,
          centered:
            Math.abs((rect.left + rect.right - box.left - box.right) / 2) < 2,
          stageRight: Math.round(box.right),
        };
      }),
    [STAGE, POPUP],
  );
}

/** 不在那三块里的弹窗：点开的才是 */
function modals(page: Page) {
  return page.evaluate(
    (popup) =>
      [...document.querySelectorAll(popup)].filter(
        (element) =>
          !element.closest("[data-stage]") && !element.closest("[hidden]"),
      ).length,
    POPUP,
  );
}

function clickButton(page: Page, label: string, scope = "#storybook-root") {
  return page.evaluate(
    ([name, css]) => {
      const button = [
        ...document.querySelectorAll<HTMLElement>(`${css} button`),
      ].find(
        (element) =>
          !element.closest("[role=dialog], [role=alertdialog]") &&
          element.textContent?.trim() === name,
      );
      button!.click();
    },
    [label, scope],
  );
}

test("摆在页面上的三个弹窗：各在自己那一块里居中，页面不被挡住、不锁滚动，焦点没被抢走", async () => {
  const { page } = storybook;
  await open(page);

  for (const stage of await layout(page)) {
    assert.ok(stage.inside, `${stage.label}：弹窗伸到这一块外面去了`);
    assert.ok(stage.centered, `${stage.label}：弹窗没有在这一块里居中`);
  }

  const state = await page.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).overflowY,
    blocked:
      document
        .querySelector("#storybook-root")!
        .closest("[inert], [aria-hidden='true']") !== null,
    focus: document.activeElement === document.body,
  }));
  assert.notEqual(state.scroll, "hidden", "页面的滚动被锁住了");
  assert.equal(state.blocked, false, "页面被摆着的弹窗挡在了外头");
  assert.ok(state.focus, "摆着的弹窗把焦点抢走了");

  // 页面上别处的控件照常能用：点一下分段选择，换得过去。
  // 选项之间夹着隐藏的表单元素，不是紧挨着的兄弟，按文字找
  await page.evaluate(() => {
    const toggle = document.querySelector(
      "#storybook-root section .ef-rounded-toggle",
    )!;
    [...toggle.querySelectorAll<HTMLElement>(".ef-rounded-toggle__option")]
      .find((option) => option.textContent?.trim() === "列表")!
      .click();
  });
  await page.waitEqual(
    () =>
      page.evaluate(
        () =>
          document
            .querySelector("#storybook-root section .ef-rounded-toggle")!
            .querySelector("[data-checked]")?.textContent,
      ),
    "列表",
    "页面上的分段选择点不动",
  );
});

test("按钮点开的是真的弹窗：Esc 只关它，摆着的三个还在", async () => {
  const { page } = storybook;
  await open(page);
  assert.equal(await modals(page), 0);

  await clickButton(page, "动画弹窗");
  await page.waitEqual(() => modals(page), 1, "点了按钮，弹窗没有打开");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const dialog = [
          ...document.querySelectorAll(".ef-animated-dialog"),
        ].find((element) => !element.closest("[data-stage]"));
        return !!dialog && dialog.contains(document.activeElement);
      }),
    "点开的弹窗是模态的：焦点应该进到它里面",
  );

  await page.key("Escape");
  await page.waitEqual(() => modals(page), 0, "Esc 没有关掉点开的弹窗");
  // 摆着的那三个不该跟着关：等一会儿再看
  await page.pause(500);
  assert.deepEqual(
    (await layout(page)).map((stage) => stage.inside),
    [true, true, true],
    "Esc 把摆在页面上的弹窗也关了",
  );
});

test("重播：摆着的弹窗收起，再放一遍；点它自己的关闭也一样", async () => {
  const { page } = storybook;
  await open(page);
  const first = () =>
    page.evaluate(
      ([stage, popup]) =>
        document.querySelector(stage!)!.querySelectorAll(popup!).length,
      [STAGE, POPUP],
    );

  await clickButton(page, "重播", "#storybook-root figure:first-of-type");
  await page.waitEqual(first, 0, "点了重播，弹窗没有收起");
  await page.waitEqual(first, 1, "收起之后没有再放出来");

  await page.settled();
  await page.click(`${STAGE} .ef-animated-dialog__close`);
  await page.waitEqual(first, 0, "点了关闭，弹窗没有收起");
  await page.waitEqual(first, 1, "关闭之后没有再放出来");
});

test("从最后一张物品卡片按 Tab：悬浮卡里没有链接，焦点照常走到后面的详情卡里", async () => {
  const { page } = storybook;
  await open(page);

  // 折金票的悬浮卡里没有链接，也没有详情入口
  await page.evaluate(() =>
    document
      .querySelector<HTMLElement>('#storybook-root a[href="#ticket"]')!
      .focus(),
  );
  await page.waitVisible(HOVER_PANEL, "聚焦卡片后悬浮卡没有出现");
  await page.settled(HOVER_PANEL);

  await page.key("Tab");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const element = document.activeElement;
        return (
          !!element?.closest("#storybook-root .ef-item-tooltip-card") &&
          !element.closest("[data-item-tooltip-panel]")
        );
      }),
    "按 Tab 之后焦点没有落到后面那张详情卡的链接上",
  );
  await page.waitGone(HOVER_PANEL);
});

test("文档页：摆着的弹窗不算开着的浮层——没有模态的弹窗，页面不报错", async () => {
  const { page } = storybook;
  await page.setSize(1200, 800);
  await page.docs("示例-实机风格--docs");
  assert.equal(await modals(page), 0, "文档页里有点开的弹窗");
  assert.equal(
    await page.evaluate(
      () =>
        getComputedStyle(document.documentElement).overflowY !== "hidden" &&
        document.querySelector("[inert]") === null,
    ),
    true,
    "文档页被弹窗锁住了",
  );
  assert.deepEqual(page.errors, [], "页面报了错");
});

test("手机宽：三块都不伸出页面，弹窗还在各自那一块里", async () => {
  const { page } = storybook;
  try {
    await open(page, 360, 2800);
    const width = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    for (const stage of await layout(page)) {
      assert.ok(stage.stageRight <= width, `${stage.label}：这一块伸出了页面`);
      assert.ok(stage.inside, `${stage.label}：弹窗伸到这一块外面去了`);
    }
    assert.ok(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
      "页面横向滚动了",
    );
  } finally {
    await page.setSize(1200, 800);
  }
});
