import { Button, SplashScreen } from "@endfield-ui/react";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState, type ReactNode } from "react";
import { ScenePlaceholder } from "./_shared/Placeholders";

/*
 * 开屏页默认铺满视口并锁住页面。这里为了能和别的 story 并排看，
 * 都关掉 fullscreen，放进一个定了比例的框里——横竖看的是这个框自己的宽高比。
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

/**
 * 演示用的原创标志：一块被斜切了一刀的方块，下面是虚构的队名。
 * 不对应任何官方标志——库里不带标志，这个位置放使用方自己的
 */
function Mark() {
  return (
    <svg viewBox="0 0 132 134" role="img" aria-label="第七勘探队">
      <path d="M26 6h80v80H26z" fill="currentColor" />
      <path d="M26 86 106 6v24L50 86z" className="fill-surface" />
      <text
        x="66"
        y="120"
        textAnchor="middle"
        fill="currentColor"
        fontSize="15"
        fontWeight="800"
        letterSpacing="2"
        className="font-display"
      >
        SEVENTH
      </text>
    </svg>
  );
}

const meta = {
  title: "控件/SplashScreen 开屏页",
  component: SplashScreen,
  args: {
    value: 51,
    fullscreen: false,
    logo: <Mark />,
    tagline: "SEVENTH SURVEY TEAM / FIELD ARCHIVE",
    caption: "ENDFIELD-UI\nREV 2026.10",
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    logo: { control: false },
    backdrop: { control: false },
    decor: { control: false },
  },
} satisfies Meta<typeof SplashScreen>;

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

export const Indeterminate: Story = {
  name: "不确定进度",
  decorators: [framed],
  args: { value: undefined, status: "CONNECTING" },
};

export const Backdrop: Story = {
  name: "带底图",
  decorators: [framed],
  args: {
    value: 24,
    // 底图随进度从模糊变清晰：拖 value 看
    backdrop: <ScenePlaceholder tone="dark" seed={1} />,
  },
};

export const Bare: Story = {
  name: "只有进度",
  decorators: [framed],
  args: {
    logo: undefined,
    tagline: undefined,
    caption: undefined,
    decor: null,
  },
};

/** 充填 → 铺满 → 淡出：进度到 100 就把 open 置为 false，后面的两秒多是它自己走的 */
function Sequence({ fullscreen = false }: { fullscreen?: boolean }) {
  const [run, setRun] = useState(fullscreen ? 0 : 1);
  const [value, setValue] = useState(0);
  const [note, setNote] = useState("");
  const done = value >= 100;

  useEffect(() => {
    if (run === 0) return;
    const timer = window.setInterval(() => {
      setValue((current) => Math.min(100, current + 9));
    }, 220);
    return () => window.clearInterval(timer);
  }, [run]);

  const start = () => {
    setRun(run + 1);
    setValue(0);
    setNote("");
  };

  const splash = run > 0 && (
    <SplashScreen
      key={run}
      fullscreen={fullscreen}
      value={value}
      open={!done}
      logo={<Mark />}
      tagline="SEVENTH SURVEY TEAM / FIELD ARCHIVE"
      caption={"ENDFIELD-UI\nREV 2026.10"}
      backdrop={<ScenePlaceholder tone="dark" seed={1} />}
      onReveal={() => setNote("页面露出来了")}
      onExited={() => setNote("开屏页已经卸载")}
    />
  );

  return (
    <div className="flex flex-col items-start gap-4">
      {fullscreen ? splash : <Frame>{splash}</Frame>}
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="light" size="sm" onClick={start}>
          {fullscreen ? "打开" : "重播"}
        </Button>
        <span aria-live="polite" className="text-sm text-ink-secondary">
          {note}
        </span>
      </div>
    </div>
  );
}

export const Reveal: Story = {
  name: "充填后揭示",
  render: () => <Sequence />,
};

export const Fullscreen: Story = {
  name: "整页",
  // 铺满视口、锁住页面：文档页里会把整页盖住，并排的两份也会叠在一起
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  render: () => <Sequence fullscreen />,
};
