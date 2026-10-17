// 文档页会把一个组件的全部 story 同时渲染出来：里面不能有开着的浮层，也不能报错
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook({ width: 1280, height: 900 });

const pages = [
  "控件-dialog-弹窗--docs",
  "控件-drawer-抽屉--docs",
  "控件-toast-轻提示--docs",
  "控件-select-下拉选择--docs",
  "控件-combobox-组合框--docs",
  "控件-taginput-标签输入--docs",
  "控件-fileupload-文件上传--docs",
  "控件-itemslot-物品格--docs",
  "控件-table-表格--docs",
  "控件-toolbar-工具栏--docs",
  "控件-siderail-侧轨--docs",
  "控件-topbar-顶栏与全屏菜单--docs",
  "控件-navaction-主行动块--docs",
  "控件-dropdownmenu-下拉菜单--docs",
  "控件-contextmenu-右键菜单--docs",
  "控件-accordion-折叠面板--docs",
  "控件-slider-滑块--docs",
  "控件-avatar-头像与头像切换--docs",
  "控件-carousel-媒体轮播--docs",
  "控件-calendar-月历--docs",
  "控件-datepicker-日期选择--docs",
  "控件-daterangepicker-日期范围--docs",
  "控件-schedule-排期--docs",
  "控件-playbutton-播放钮--docs",
  "控件-mediacard-媒体卡--docs",
  "控件-backtotop-回到顶部--docs",
  "控件-segmentedcontrol-分段选择--docs",
  "控件-steps-步骤条--docs",
  "控件-toc-页内目录--docs",
  "控件-pageheader-页头--docs",
  "控件-scrollarea-滚动区--docs",
  "控件-otpinput-验证码输入--docs",
  "控件-hovercard-悬浮卡--docs",
  "控件-imageviewer-图片查看--docs",
  "控件-panel-面板--docs",
  "控件-tooltip-文字提示--docs",
  "控件-popover-气泡卡片--docs",
  "控件-flyoutbar-展开条--docs",
  "控件-datarow-数据行带--docs",
  "控件-sparkline-小型面积图--docs",
  "控件-list-列表行--docs",
  "母题-texture-底纹--docs",
];

for (const id of pages) {
  test(`文档页：${id}`, async () => {
    const { page } = storybook;
    await page.docs(id);

    const found = await page.evaluate(() => ({
      stories: document.querySelectorAll(".docs-story").length,
      dialogs: document.querySelectorAll("[role=dialog], [role=alertdialog]")
        .length,
      panels: [
        ...document.querySelectorAll("[role=listbox], [role=menu]"),
      ].filter((element) => !element.closest("[hidden]")).length,
    }));
    assert.ok(found.stories > 0, "文档页里没有 story");
    assert.equal(found.dialogs, 0, "文档页里有开着的弹窗、抽屉或轻提示");
    assert.equal(found.panels, 0, "文档页里有开着的下拉面板");
    assert.deepEqual(page.errors, [], "页面报了错");
  });
}

// Storybook 给每个 story 套的缩放外壳把里面的高度抄成自己的像素高度，晚一帧：
// story 一变高就溢出，外面的容器闪出一条滚动条，把 story 挤窄（看着是控件在抖）。
// `.storybook/preview.css` 里有一条规则让这个容器竖向不出滚动条
test("文档页：story 变高的那一刻，外面的容器不出竖向的滚动条", async () => {
  const { page } = storybook;
  // "减少动态效果"给每个元素都挂了 0.01ms 的过渡：同一步里读到的还是变高之前的样子
  await page.setReducedMotion(false);
  try {
    await page.docs("控件-accordion-折叠面板--docs");
    const scrollbars = await page.evaluate(() =>
      [...document.querySelectorAll(".docs-story")].map((story) => {
        const inner = story.querySelector<HTMLElement>(
          ".innerZoomElementWrapper",
        );
        if (!inner) return null;
        // 直接撑高，同一步里读：外壳来不及跟上的那一刻就是这个样子
        inner.style.paddingBottom = "40px";
        const over = story.scrollHeight - story.clientHeight;
        inner.style.paddingBottom = "";
        // 实测的浏览器不画滚动条，量不到它占掉的那 15px：
        // 问的是"这一刻溢出了没有，溢出的话这个方向出不出滚动条"
        return (
          over > 0 &&
          ["auto", "scroll"].includes(getComputedStyle(story).overflowY)
        );
      }),
    );
    assert.ok(scrollbars.length > 0, "文档页里没有 story");
    assert.ok(
      !scrollbars.includes(null),
      "没有找到 Storybook 的缩放外壳：它的结构变了，这条检查要跟着改",
    );
    assert.deepEqual(
      scrollbars,
      scrollbars.map(() => false),
      "story 变高时比外面的容器高出了一截，容器会闪出一条竖向的滚动条",
    );
  } finally {
    await page.setReducedMotion(true);
  }
});

// 每页第一个演示上面有 Storybook 自带的缩放按钮。外壳是整个缩放的，占多大地方
// 靠它那个写死的高度跟着变：高度被改回 auto 的时候（上一条以前的修法），
// 缩小之后下面留出一截空白，放大之后内容比容器高。
// "减少动态效果"下另有一种错法：外壳的缩放成了 0.01ms 的过渡，Storybook 量高度的那一刻
// 它还没动，记下的是上一步的高度。两种都看
async function zoomKeepsFit(page: Page) {
  await page.docs("控件-accordion-折叠面板--docs");

  const read = () =>
    page.evaluate(() => {
      const story = document.querySelector<HTMLElement>(
        ".sbdocs-preview:has([aria-label='Zoom out']) .docs-story",
      );
      const inner = story?.querySelector(".innerZoomElementWrapper");
      if (!story || !inner?.parentElement) return null;
      const style = getComputedStyle(story);
      // 容器里能放内容的那一块的下沿。从 clientHeight 算：横向的滚动条不算在里面
      const bottom =
        story.getBoundingClientRect().top +
        story.clientTop +
        story.clientHeight -
        parseFloat(style.paddingBottom);
      return {
        // 外壳缩放了多少：1 是没缩放
        scale: new DOMMatrix(getComputedStyle(inner.parentElement).transform).a,
        // 容器的下沿比内容画出来的下沿低多少：正的是空白，负的是内容有一截在容器外面
        slack: bottom - inner.getBoundingClientRect().bottom,
        scrollbarY:
          story.scrollHeight > story.clientHeight &&
          ["auto", "scroll"].includes(style.overflowY),
        scrollableX:
          story.scrollWidth > story.clientWidth &&
          ["auto", "scroll"].includes(style.overflowX),
      };
    });
  type Reading = NonNullable<Awaited<ReturnType<typeof read>>>;

  const press = async (
    label: string,
    name: string,
    scaled: (scale: number) => boolean,
  ): Promise<Reading> => {
    await page.click(`.sbdocs-preview [aria-label="${label}"]`);
    // 先等比例真的变了：点下去的那一刻什么都还没动，"正好包住"是上一个状态的
    await page.waitFor(async () => {
      const now = await read();
      return now !== null && scaled(now.scale);
    }, `点了 ${label}，演示没有${name}`);
    // 外壳的高度比比例晚一拍到；一直到不了就是留了空白或者溢出了
    let last = await read();
    try {
      await page.waitFor(async () => {
        last = await read();
        return last !== null && Math.abs(last.slack) <= 1;
      }, "");
    } catch {
      assert.fail(
        `${name}之后，容器的下沿和内容的下沿差了 ${last?.slack.toFixed(1)}px（正的是空白，负的是内容在容器外面）`,
      );
    }
    // 到了之后停得住
    await page.settled();
    const now = await read();
    assert.ok(now, "演示不见了");
    assert.ok(
      Math.abs(now.slack) <= 1,
      `${name}之后，容器的下沿没有停在内容的下沿上（差 ${now.slack.toFixed(1)}px）`,
    );
    assert.equal(now.scrollbarY, false, `${name}之后，容器竖向出了滚动条`);
    return now;
  };

  const before = await read();
  assert.ok(
    before,
    "第一个演示上面没有缩放按钮：Storybook 不再带这条工具栏的话，这条检查和 preview.css 里的说明要跟着改",
  );
  assert.equal(before.scale, 1, "一开始就缩放着");
  assert.ok(Math.abs(before.slack) <= 1, "没缩放时容器就没有包住内容");

  await press("Zoom out", "缩小", (scale) => scale < 0.99);
  await press("Reset zoom", "复位", (scale) => Math.abs(scale - 1) < 0.001);
  const larger = await press("Zoom in", "放大", (scale) => scale > 1.01);
  // 放大是整个放大，右边那一截到了容器外面：得能横着滚过去
  assert.ok(larger.scrollableX, "放大之后右边的内容滚不到");
  await press("Reset zoom", "复位", (scale) => Math.abs(scale - 1) < 0.001);
}

test("文档页：缩小、放大、复位之后，演示的容器都正好包住内容", async () => {
  const { page } = storybook;
  await page.setReducedMotion(false);
  try {
    await zoomKeepsFit(page);
  } finally {
    await page.setReducedMotion(true);
  }
});

test("文档页：减少动态效果下，缩小、放大、复位之后也正好包住内容", async () => {
  await zoomKeepsFit(storybook.page);
});
