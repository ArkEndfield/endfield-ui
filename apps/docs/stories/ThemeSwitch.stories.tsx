import {
  Button,
  Panel,
  PanelHeader,
  PanelRow,
  PanelRows,
  SectionTitle,
  Segment,
  SegmentedControl,
  Tag,
  TagPair,
  useTheme,
  type ThemePreference,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";

/**
 * `useTheme` 切换亮暗：整页交叉淡化一次，不是带换色过渡的慢慢过去、别的硬切。
 * 浏览器要支持视图过渡；系统开了"减少动态效果"时直接切。
 *
 * 工具栏里换主题是预览站自己的另一条路，是直接切的——要看淡化，用这一页里的开关。
 */
const meta = {
  title: "示例/主题切换",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* 文案全部虚构 */
function Sample({ toolbar }: { toolbar: "light" | "dark" }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  // 进这一页、工具栏换了主题：从工具栏的那个出发。这一页上一次记下的选择不带过来
  useEffect(() => {
    setTheme(toolbar);
  }, [toolbar, setTheme]);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <SectionTitle variant="band" subtitle="Theme">
        主题
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl
          aria-label="主题"
          value={theme}
          onValueChange={(next) => setTheme(next as ThemePreference)}
        >
          <Segment value="light">亮色</Segment>
          <Segment value="dark">暗色</Segment>
          <Segment value="system">跟随系统</Segment>
        </SegmentedControl>
        <p role="status" className="font-tech text-xs text-ink-secondary">
          {`// ${theme} → ${resolvedTheme}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="action">进入区域</Button>
        <Button>更多情报</Button>
        <Tag variant="accent">推荐</Tag>
        <TagPair name="地区" value="湿地" emphasis />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel>
          <PanelHeader>跟着页面走</PanelHeader>
          <PanelRows>
            <PanelRow label="站点">12</PanelRow>
            <PanelRow label="路线">31</PanelRow>
          </PanelRows>
        </Panel>
        {/* 局部主题：写死在这一块上的，页面换了它不换，切的时候也看不出变化 */}
        <div
          data-theme="dark"
          data-local=""
          className="flex flex-col gap-2 bg-surface p-4 text-ink"
        >
          <p className="font-medium">写死暗色的一块</p>
          <p className="text-sm text-ink-secondary">
            `data-theme` 写在这一块上：页面的主题换了，它不跟着换。
          </p>
        </div>
      </div>
    </div>
  );
}

export const Switch: Story = {
  name: "亮 / 暗 / 跟随系统",
  // 这一页自己写 <html> 上的主题：不并排（并排的两半各有各的局部主题，切了看不出来），
  // 也不进文档页——会连别的 story 一起换掉
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  render: (_, { globals }) => (
    <Sample toolbar={globals.theme === "dark" ? "dark" : "light"} />
  ),
};
