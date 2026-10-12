import { Alert } from "@endfield-ui/react";
import {
  BannerAlert,
  FullWidthAlert,
  RoundedButton,
} from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

function ConfirmationAlertsPreview() {
  const [result, setResult] = useState("");
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8">
      <div className="flex flex-wrap items-center gap-5">
        <BannerAlert
          title="确认保存"
          trigger={<RoundedButton showIcon={false}>卡片确认提示</RoundedButton>}
          cancelText="取消"
          confirmText="确定"
          onConfirm={() => setResult("卡片提示已确认")}
        >
          <p>是否保存当前修改？</p>
        </BannerAlert>
        <FullWidthAlert
          title="确认退出"
          trigger={
            <RoundedButton variant="default" showIcon={false}>
              通栏确认提示
            </RoundedButton>
          }
          cancelText="取消"
          confirmText="退出"
          onConfirm={() => setResult("通栏提示已确认")}
        >
          <p>未保存的修改会被放弃。</p>
        </FullWidthAlert>
      </div>
      <Alert title="Alert">原有页面内提示条。</Alert>
      {result && <output>{result}</output>}
    </div>
  );
}

const meta = {
  title: "Game 实机风格/示例/确认提示",
  component: ConfirmationAlertsPreview,
  parameters: { sideBySide: false },
} satisfies Meta<typeof ConfirmationAlertsPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Preview: Story = {};
