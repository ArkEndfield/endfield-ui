// 文档页会把一个组件的全部 story 同时渲染出来：里面不能有开着的浮层，也不能报错
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook } from "./lib/harness.ts";

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
// `.storybook/preview.css` 里有一条规则把这个高度交还给内容
test("文档页：story 变高的那一刻，外面的容器不溢出", async () => {
  const { page } = storybook;
  // "减少动态效果"给每个元素都挂了 0.01ms 的过渡：同一步里读到的还是变高之前的样子
  await page.setReducedMotion(false);
  try {
    await page.docs("控件-accordion-折叠面板--docs");
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll(".docs-story")].map((story) => {
        const inner = story.querySelector<HTMLElement>(
          ".innerZoomElementWrapper",
        );
        if (!inner) return null;
        // 直接撑高，同一步里读：外壳来不及跟上的那一刻就是这个样子
        inner.style.paddingBottom = "40px";
        const over = story.scrollHeight - story.clientHeight;
        inner.style.paddingBottom = "";
        return over;
      }),
    );
    assert.ok(overflow.length > 0, "文档页里没有 story");
    assert.ok(
      !overflow.includes(null),
      "没有找到 Storybook 的缩放外壳：它的结构变了，preview.css 里那条规则要跟着改",
    );
    assert.deepEqual(
      overflow,
      overflow.map(() => 0),
      "story 变高时比外面的容器高出了一截",
    );
  } finally {
    await page.setReducedMotion(true);
  }
});
