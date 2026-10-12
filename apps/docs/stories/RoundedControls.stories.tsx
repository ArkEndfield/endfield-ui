import {
  AnimatedDialog,
  Check,
  ChevronLeft,
  ChevronRight,
  Close,
  DialogClose,
  RoundedButton,
  RoundedIconButton,
  RoundedSwitch,
  RoundedToggle,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const views = [
  { value: "map", label: "地图" },
  { value: "list", label: "列表" },
  { value: "detail", label: "详情" },
];

function SettingsControls() {
  return (
    <div className="grid gap-6">
      <RoundedToggle aria-label="显示模式" options={views} defaultValue="map" />
      <div className="w-52 max-w-full">
        <RoundedSwitch aria-label="自动同步" defaultChecked />
      </div>
      <div className="flex flex-wrap gap-4">
        <DialogClose>
          <RoundedButton icon={<Check size={16} />}>完成</RoundedButton>
        </DialogClose>
      </div>
    </div>
  );
}

function RoundedControlsPreview() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10">
      <div className="flex flex-wrap items-center gap-5">
        <RoundedButton icon={<Check size={16} />}>确认</RoundedButton>
        <RoundedButton variant="default" icon={<Close size={16} />}>
          取消
        </RoundedButton>
        <RoundedButton loading icon={<Check size={16} />}>
          加载中
        </RoundedButton>
        <RoundedButton disabled icon={<Check size={16} />}>
          不可用
        </RoundedButton>
      </div>
      <div className="flex items-center gap-5">
        <RoundedIconButton aria-label="上一页">
          <ChevronLeft size={16} />
        </RoundedIconButton>
        <RoundedIconButton aria-label="下一页">
          <ChevronRight size={16} />
        </RoundedIconButton>
        <RoundedIconButton aria-label="不可用的上一页" disabled>
          <ChevronLeft size={16} />
        </RoundedIconButton>
      </div>
      <div className="w-80 max-w-full">
        <RoundedToggle
          aria-label="显示模式"
          options={views}
          defaultValue="map"
        />
      </div>
      <div className="w-52 max-w-full">
        <RoundedSwitch aria-label="自动同步" defaultChecked />
      </div>
      <AnimatedDialog
        title="显示设置"
        width="640px"
        trigger={<RoundedButton showIcon={false}>打开设置</RoundedButton>}
      >
        <div className="p-6">
          <SettingsControls />
        </div>
      </AnimatedDialog>
    </div>
  );
}

const meta = {
  title: "示例/圆角 Button Toggle Switch",
  component: RoundedControlsPreview,
  parameters: { sideBySide: false },
} satisfies Meta<typeof RoundedControlsPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Preview: Story = {};
