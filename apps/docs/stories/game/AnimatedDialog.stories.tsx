import {
  Button,
  Crosshair,
  DialogClose,
  Field,
  Input,
  Select,
} from "@endfield-ui/react";
import { AnimatedDialog } from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "Game 实机风格/AnimatedDialog 分阶段动画弹窗",
  component: AnimatedDialog,
  parameters: { sideBySide: false },
  args: {
    title: "物品详情",
    icon: <Crosshair />,
    trigger: <Button>查看物品详情</Button>,
    children: (
      <div className="p-6">
        <p>灰色标题带、黄色箭头、斜纹正文和底部三色条保留原有样式。</p>
        <div className="mt-6 flex justify-end">
          <DialogClose>
            <Button>知道了</Button>
          </DialogClose>
        </div>
      </div>
    ),
  },
  argTypes: {
    trigger: { control: false },
    icon: { control: false },
    children: { control: false },
    classNames: { control: false },
    initialFocus: { control: false },
    finalFocus: { control: false },
  },
} satisfies Meta<typeof AnimatedDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithForm: Story = {
  name: "表单 / 内嵌下拉",
  render: () => (
    <AnimatedDialog
      title="编辑物品资料"
      icon={<Crosshair />}
      trigger={<Button>编辑物品资料</Button>}
    >
      <div className="grid gap-5 p-6">
        <Field label="名称">
          <Input defaultValue="物资箱" />
        </Field>
        <Field label="所属地区">
          <Select
            defaultValue="valley"
            items={[
              { value: "valley", label: "四号谷地" },
              { value: "wuling", label: "武陵" },
              { value: "other", label: "其他" },
            ]}
          />
        </Field>
        <div className="flex justify-end">
          <DialogClose>
            <Button>保存</Button>
          </DialogClose>
        </div>
      </div>
    </AnimatedDialog>
  ),
};

export const AsyncClose: Story = {
  name: "异步关闭 / 待定时防重复请求",
  render: function AsyncCloseStory() {
    const [status, setStatus] = useState("未请求关闭");
    return (
      <div className="flex flex-col items-start gap-3">
        <AnimatedDialog
          title="异步关闭"
          icon={<Crosshair />}
          trigger={<Button>打开异步关闭示例</Button>}
          onClose={async () => {
            setStatus("正在处理关闭请求");
            await new Promise<void>((resolve) => setTimeout(resolve, 1000));
            setStatus("处理完成，弹窗关闭");
            return true;
          }}
        >
          <div className="p-6">
            <p>点击关闭按钮、遮罩或按 Esc。等待期间重复操作只会执行一次。</p>
          </div>
        </AnimatedDialog>
        <p role="status" className="text-sm text-ink-secondary">
          {status}
        </p>
      </div>
    );
  },
};

export const VetoClose: Story = {
  name: "关闭否决 / 异步拒绝",
  render: function VetoCloseStory() {
    const [allow, setAllow] = useState(false);
    const [failed, setFailed] = useState(false);
    return (
      <AnimatedDialog
        title="保留未保存的修改"
        icon={<Crosshair />}
        trigger={<Button>打开关闭否决示例</Button>}
        onClose={async () => {
          if (failed) throw new Error("示例：关闭处理失败");
          return allow;
        }}
      >
        <div className="flex flex-col items-start gap-4 p-6">
          <p>
            当前：{allow ? "允许关闭" : "阻止关闭"}，
            {failed ? "回调报错" : "回调正常"}。
          </p>
          <Button variant="light" onClick={() => setAllow((value) => !value)}>
            切换允许关闭
          </Button>
          <Button variant="light" onClick={() => setFailed((value) => !value)}>
            切换回调报错
          </Button>
        </div>
      </AnimatedDialog>
    );
  },
};

export const LongContent: Story = {
  name: "长正文 / 固定高度",
  render: () => (
    <AnimatedDialog
      title="物资目录"
      icon={<Crosshair />}
      height="560px"
      trigger={<Button>查看长正文</Button>}
    >
      <div className="p-6">
        {Array.from({ length: 30 }, (_, index) => (
          <p key={index} className="border-b border-line py-3">
            物资目录示例，第 {index + 1} 项。
          </p>
        ))}
      </div>
    </AnimatedDialog>
  ),
};

export const KeepMounted: Story = {
  name: "保留挂载 / 再次打开保留输入",
  args: {
    title: "保留草稿",
    keepMounted: true,
    trigger: <Button>编辑草稿</Button>,
    children: (
      <div className="p-6">
        <Field label="草稿">
          <Input defaultValue="关闭后再打开，输入还在。" />
        </Field>
      </div>
    ),
  },
};

export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  args: { defaultOpen: true },
};

function SettingsIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export const OriginalAppearance: Story = {
  name: "原组件默认外观对照",
  tags: ["!autodocs"],
  args: {
    defaultOpen: true,
    title: "Settings",
    icon: <SettingsIcon />,
    children: (
      <div style={{ padding: 24 }}>
        <p style={{ color: "#333", marginBottom: 12 }}>
          This is the dialog content area.
        </p>
        <p style={{ color: "#666", fontSize: 14 }}>
          You can place any content here, such as forms, lists, or information.
        </p>
      </div>
    ),
  },
};
