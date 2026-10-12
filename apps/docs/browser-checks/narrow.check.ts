// 320px 宽：页面不横向溢出，浮层整个在视口里；手机上看文档页：一行里的东西不被挤折、挤出去
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook({ width: 500, height: 900 });

/** 伸到视口右边之外的元素（自己会横向滚动或裁切的容器里的不算） */
function overflowing(page: Page) {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const clipped = (element: Element) => {
      for (let parent = element.parentElement; parent;) {
        const overflow = getComputedStyle(parent).overflowX;
        if (overflow !== "visible") return true;
        parent = parent.parentElement;
      }
      return false;
    };
    const offenders = [...document.querySelectorAll("#storybook-root *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.right > viewport + 0.5;
      })
      .filter((element) => !clipped(element))
      .slice(0, 3)
      .map(
        (element) =>
          `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 40)}`,
      );
    return {
      pageScrolls: document.documentElement.scrollWidth > viewport,
      offenders,
    };
  });
}

/** 这个元素是不是整个在视口的左右边界之内 */
const inside = (page: Page, selector: string) =>
  page.evaluate((css) => {
    const rect = document.querySelector(css)!.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth;
  }, selector);

const stories = [
  "示例-仓库页--page",
  "示例-设置页--page",
  "示例-列表页--page",
  "示例-内容页--page",
  "示例-调度台--page",
  "控件-select-下拉选择--in-field",
  "控件-toast-轻提示--playground",
  "控件-dropdownmenu-下拉菜单--playground",
  "控件-popover-气泡卡片--playground",
  "控件-flyoutbar-展开条--playground",
  "控件-datarow-数据行带--playground",
  "控件-list-列表行--band",
  "控件-select-下拉选择--multiple",
  "控件-combobox-组合框--in-field",
  "控件-combobox-组合框--multiple",
  "控件-taginput-标签输入--narrow",
  "控件-taginput-标签输入--in-field",
  "控件-fileupload-文件上传--narrow",
  "控件-fileupload-文件上传--with-files",
  "控件-fileupload-文件上传--items",
  "控件-itemslot-物品格--grid",
  "控件-table-表格--playground",
  "控件-table-表格--rich-cells",
  "控件-table-表格--sticky-both",
  "控件-table-表格--expandable",
  "控件-table-表格--expandable-sticky",
  "控件-toolbar-工具栏--playground",
  "控件-toolbar-工具栏--narrow",
  "控件-toolbar-工具栏--toggles",
  "控件-contextmenu-右键菜单--rows",
  "控件-combobox-组合框--remote",
  "控件-siderail-侧轨--playground",
  "控件-siderail-侧轨--sub-tree",
  "控件-panel-面板--band-controls",
  "控件-topbar-顶栏与全屏菜单--playground",
  "控件-navaction-主行动块--layouts",
  "控件-accordion-折叠面板--extra",
  "控件-slider-滑块--marks",
  "控件-slider-滑块--range",
  "控件-avatar-头像与头像切换--switcher-horizontal",
  "控件-carousel-媒体轮播--with-links",
  "控件-calendar-月历--playground",
  "控件-schedule-排期--playground",
  "控件-datepicker-日期选择--start-and-end",
  "控件-calendar-月历--pick-range",
  "控件-daterangepicker-日期范围--in-field",
  "控件-daterangepicker-日期范围--sizes",
  "控件-playbutton-播放钮--on-cover",
  "控件-mediacard-媒体卡--video",
  "控件-backtotop-回到顶部--in-container",
  "控件-backtotop-回到顶部--page",
  "控件-segmentedcontrol-分段选择--in-field",
  "控件-segmentedcontrol-分段选择--narrow",
  "控件-steps-步骤条--playground",
  "控件-steps-步骤条--clickable",
  "控件-toc-页内目录--playground",
  "控件-toc-页内目录--long-titles",
  "控件-toc-页内目录--page",
  "控件-pageheader-页头--playground",
  "控件-pageheader-页头--narrow",
  "控件-pageheader-页头--long-title",
  "控件-pageheader-页头--with-stats",
  "控件-pageheader-页头--sticky",
  "控件-scrollarea-滚动区--narrow",
  "控件-scrollarea-滚动区--max-height",
  "控件-scrollarea-滚动区--horizontal",
  "控件-scrollarea-滚动区--both",
  "控件-scrollarea-滚动区--in-panel",
  "控件-otpinput-验证码输入--narrow",
  "控件-otpinput-验证码输入--sizes",
  "控件-otpinput-验证码输入--grouped",
  "控件-otpinput-验证码输入--in-field",
  "控件-otpinput-验证码输入--states",
  "控件-hovercard-悬浮卡--in-text",
  "控件-hovercard-悬浮卡--list",
  "控件-hovercard-悬浮卡--narrow",
  "控件-imageviewer-图片查看--playground",
  "控件-imageviewer-图片查看--narrow",
  "控件-imageviewer-图片查看--ratios",
  "控件-imageviewer-图片查看--own-layout",
  "控件-brackettitle-方括号标题--sizes",
  "母题-texture-底纹--variants",
];

for (const id of stories) {
  test(`不横向溢出：${id}`, async () => {
    const { page } = storybook;
    await page.setSize(320, 800);
    await page.story(id);
    assert.deepEqual(await overflowing(page), {
      pageScrolls: false,
      offenders: [],
    });
  });
}

test("仓库页：确认弹窗和随后的轻提示都在视口里", async () => {
  const { page } = storybook;
  await page.setSize(320, 800);
  await page.story("示例-仓库页--page");

  await page.click("text=销毁所选");
  await page.waitVisible("[role=alertdialog]");
  assert.ok(await inside(page, "[role=alertdialog]"), "弹窗超出了视口");

  // 焦点在"取消"上，下一个是确认
  await page.key("Tab");
  await page.key("Enter");
  await page.waitVisible("[role=region] [role=dialog]");
  assert.ok(
    await inside(page, "[role=region] [role=dialog]"),
    "轻提示超出了视口",
  );
});

test("设置页：下拉的面板在视口里", async () => {
  const { page } = storybook;
  await page.setSize(320, 800);
  await page.story("示例-设置页--page");
  await page.click("[role=combobox]");
  await page.waitVisible("[role=listbox]");
  assert.ok(await inside(page, "[role=listbox]"), "面板超出了视口");
});

test("气泡卡片：面板在视口里", async () => {
  const { page } = storybook;
  await page.setSize(320, 800);
  await page.story("控件-popover-气泡卡片--playground");
  await page.click("text=显示设置");
  await page.waitVisible("[role=dialog]");
  assert.ok(await inside(page, "[role=dialog]"), "面板超出了视口");
});

/*
 * 手机上看文档页。文档页自己的留白加上并排外壳的内边距要吃掉 130px：360px 的屏，
 * story 只剩 230px 上下，比 320px 的单页预览（272px）还窄。一行里的东西被挤折、挤出去，
 * 在上面那些"页面不横向溢出"的检查里看不出来——外面那一层照样不滚
 */

/** 每个匹配到的元素里，字排成了几行。`text` 只留内容正好是它的那几个 */
function lineCounts(page: Page, selector: string, text?: string) {
  return page.evaluate(
    (css, only) =>
      [...document.querySelectorAll(css)]
        .filter(
          (element) => only === null || element.textContent?.trim() === only,
        )
        .map((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          // 同一行里字号不一样的几段，矩形的上下沿对不齐：纵向重叠过半就算同一行
          const lines: { top: number; bottom: number }[] = [];
          for (const rect of range.getClientRects()) {
            if (rect.width < 0.5 || rect.height < 0.5) continue;
            const line = lines.find(
              (known) =>
                Math.min(known.bottom, rect.bottom) -
                  Math.max(known.top, rect.top) >
                Math.min(known.bottom - known.top, rect.height) / 2,
            );
            if (line) {
              line.top = Math.min(line.top, rect.top);
              line.bottom = Math.max(line.bottom, rect.bottom);
            } else {
              lines.push({ top: rect.top, bottom: rect.bottom });
            }
          }
          return lines.length;
        }),
    selector,
    text ?? null,
  );
}

/**
 * 这些容器里，伸到容器右边之外的东西。自己会滚动或裁切的祖先里面的不算；
 * 绝对定位的也不算——角标本来就骑在边上
 */
function stickingOut(page: Page, selector: string) {
  return page.evaluate((css) => {
    const found: string[] = [];
    for (const box of document.querySelectorAll(css)) {
      const edge = box.getBoundingClientRect().right;
      const exempt = (element: Element) => {
        for (
          let node: Element | null = element;
          node && node !== box;
          node = node.parentElement
        ) {
          const style = getComputedStyle(node);
          if (style.position === "absolute") return true;
          if (node !== element && style.overflowX !== "visible") return true;
        }
        return false;
      };
      for (const element of box.querySelectorAll("*")) {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.right <= edge + 0.5) continue;
        if (exempt(element)) continue;
        const text = (element.textContent ?? "").trim().slice(0, 12);
        found.push(`${element.tagName.toLowerCase()}「${text}」`);
      }
    }
    return found.slice(0, 6);
  }, selector);
}

/** 这些元素各有多宽 */
const widths = (page: Page, selector: string) =>
  page.evaluate(
    (css) =>
      [...document.querySelectorAll(css)].map((element) =>
        Math.round(element.getBoundingClientRect().width),
      ),
    selector,
  );

const NAME = ".docs-story [role=radiogroup] + [aria-live] > :first-child";

test("手机上的文档页：内容页的页码不折行，标题不被旁边的按钮挤折，没有东西伸出去", async () => {
  const { page } = storybook;
  await page.setSize(360, 800);
  await page.docs("示例-内容页--docs");

  // 并排的两份各有一个
  assert.deepEqual(
    await lineCounts(page, ".docs-story span", "01 / 04"),
    [1, 1],
    "页码应该排在一行里",
  );
  assert.deepEqual(
    await lineCounts(page, ".docs-story h2", "最新情报"),
    [1, 1],
    "标题不应该被“查看全部”挤成两行",
  );
  assert.deepEqual(await stickingOut(page, ".docs-story section"), []);
});

test("手机上的文档页：内容页的队员一节上下叠放，名字排在一行里", async () => {
  const { page } = storybook;
  await page.setSize(360, 800);
  await page.docs("示例-内容页--docs");

  assert.deepEqual(
    await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          ".docs-story [role=radiogroup][aria-label=队员]",
        ),
      ].map((group) => group.getAttribute("aria-orientation")),
    ),
    ["horizontal", "horizontal"],
    "窄的时候头像应该横排在介绍上面",
  );
  assert.deepEqual(await lineCounts(page, NAME), [1, 1], "名字应该排在一行里");
});

test("手机上的文档页：内容页的名字折行时，右括号跟着最后一个字", async () => {
  const { page } = storybook;
  await page.setSize(360, 800);
  await page.docs("示例-内容页--docs");

  const together = await page.evaluate(
    (css) =>
      [...document.querySelectorAll<HTMLElement>(css)].map((name) => {
        // 不靠字宽（CI 上没有中文字体）：压到两个字多一点，三个字的名字怎么都得折
        name.style.width = "2.25em";
        const walker = document.createTreeWalker(name, NodeFilter.SHOW_TEXT);
        const letters: DOMRect[] = [];
        const range = document.createRange();
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const value = node.nodeValue ?? "";
          for (let at = 0; at < value.length; at++) {
            if (value[at]!.trim() === "") continue;
            range.setStart(node, at);
            range.setEnd(node, at + 1);
            letters.push(range.getBoundingClientRect());
          }
        }
        // 最后两个字：名字的末一个字、右括号
        const [last, bracket] = letters.slice(-2) as [DOMRect, DOMRect];
        return (
          Math.min(last.bottom, bracket.bottom) -
            Math.max(last.top, bracket.top) >
          Math.min(last.height, bracket.height) / 2
        );
      }),
    NAME,
  );
  assert.deepEqual(together, [true, true], "右括号不应该自己落到下一行");
});

test("手机上的文档页：统计块旁边放图，数字不被挤折", async () => {
  const { page } = storybook;
  await page.setSize(360, 800);
  await page.docs("控件-sparkline-小型面积图--docs");
  const lines = await lineCounts(page, ".docs-story [data-size] span", "1,280");
  assert.ok(lines.length >= 2, "没有找到统计块的数字");
  assert.deepEqual([...new Set(lines)], [1], "数字应该排在一行里");
});

test("手机上的文档页：工具条上的字不被按钮挤折", async () => {
  const { page } = storybook;
  // 这一条要更窄才挤得到
  await page.setSize(320, 800);
  await page.docs("母题-hatch-斜纹--docs");
  const lines = await lineCounts(page, ".docs-story span", "已选 3 项");
  assert.ok(lines.length >= 2, "没有找到工具条上的字");
  assert.deepEqual([...new Set(lines)], [1], "“已选 3 项”应该排在一行里");
});

test("手机上的文档页：页内目录旁边的正文、侧轨旁边的页面不被挤成一条", async () => {
  const { page } = storybook;
  await page.setSize(360, 800);

  await page.docs("控件-toc-页内目录--docs");
  const texts = await widths(
    page,
    ".docs-story [role=region][aria-label=正文]",
  );
  assert.ok(texts.length >= 2, "没有找到正文的滚动框");
  assert.ok(
    texts.every((width) => width >= 160),
    `正文的滚动框太窄了：${texts.join("、")}`,
  );

  await page.docs("控件-siderail-侧轨--docs");
  const mains = await widths(page, ".docs-story main");
  assert.ok(mains.length >= 2, "没有找到侧轨旁边的页面");
  assert.ok(
    mains.every((width) => width >= 160),
    `侧轨旁边的页面太窄了：${mains.join("、")}`,
  );
});
