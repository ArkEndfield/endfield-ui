import { EndfieldSplashScreen } from "@endfield-ui/react/game";
import { Button } from "@endfield-ui/react";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState, type ReactNode } from "react";

/*
 * 官网的开屏页：主入口的 SplashScreen 填上官方的标志、底图和微标。
 * 和主入口那一页一样关掉 fullscreen，放进一个定了比例的框里看。
 */
function Frame({
  children,
  className = "aspect-video w-full max-w-4xl",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden border border-line ${className}`}>
      <div className="flex h-full items-center justify-center text-sm text-ink-secondary">
        页面内容
      </div>
      {children}
    </div>
  );
}

const meta = {
  title: "Game 实机风格/EndfieldSplashScreen 官网开屏页",
  component: EndfieldSplashScreen,
  args: { value: 51, fullscreen: false },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    logo: { control: false },
  },
} satisfies Meta<typeof EndfieldSplashScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const framed: Decorator = (Story) => (
  <Frame>
    <Story />
  </Frame>
);

export const Playground: Story = { decorators: [framed] };

export const Portrait: Story = {
  name: "竖排",
  decorators: [
    (Story) => (
      <Frame className="h-[640px] w-[296px] max-w-full">
        <Story />
      </Frame>
    ),
  ],
};

export const Start: Story = {
  name: "刚开始：底图还是模糊的",
  decorators: [framed],
  args: { value: 4 },
};

/** 充填 → 铺满 → 淡出，和官网首次载入时一样 */
function Sequence() {
  const [run, setRun] = useState(1);
  const [value, setValue] = useState(0);
  const done = value >= 100;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setValue((current) => Math.min(100, current + 9));
    }, 220);
    return () => window.clearInterval(timer);
  }, [run]);

  return (
    <div className="flex flex-col items-start gap-4">
      <Frame>
        <EndfieldSplashScreen
          key={run}
          fullscreen={false}
          value={value}
          open={!done}
        />
      </Frame>
      <Button
        variant="light"
        size="sm"
        onClick={() => {
          setRun(run + 1);
          setValue(0);
        }}
      >
        重播
      </Button>
    </div>
  );
}

export const Reveal: Story = {
  name: "充填后揭示",
  render: () => <Sequence />,
};
