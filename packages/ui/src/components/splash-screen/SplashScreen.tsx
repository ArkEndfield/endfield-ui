import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { usePresence } from "../../hooks/usePresence";
import { cn } from "../../lib/cn";
import { decor as decorLayer } from "../../lib/decor";
import { mergeRefs } from "../../lib/merge-refs";

export type SplashScreenProps = Omit<ComponentProps<"div">, "children"> & {
  /** 真实进度，0 – 100。不知道就不传：显示不确定进度，不显示数字 */
  value?: number;
  /** 标志：自己的图或 SVG。放在画面偏右的一个盒子里，竖排时居中 */
  logo?: ReactNode;
  /** 标志下面的一行标语 */
  tagline?: ReactNode;
  /** 标语上方那组微标里的微文字。纯氛围，对读屏隐藏 */
  caption?: ReactNode;
  /**
   * 换掉标语上方的整组微标。不传是代码画的一组（小方框、`caption`、方点阵，旁边一枚三角标），
   * 传 `null` 是不要
   */
  decor?: ReactNode;
  /** 读数下面的状态字。默认 `LOADING` */
  status?: ReactNode;
  /** 底图：铺满整块，随进度从模糊变清晰 */
  backdrop?: ReactNode;
  /** 置为 `false` 开始退场：走满、铺满、淡出，结束后卸载。默认 `true` */
  open?: boolean;
  /** 铺满视口并锁住页面（默认）；关掉则铺满所在的定位容器 */
  fullscreen?: boolean;
  /** 进度条的可访问名称 */
  label?: string;
  /** 开始淡出、页面露出来的那一刻触发：页面自己的入场从这里起 */
  onReveal?: () => void;
  /** 淡出结束、已经卸载之后触发 */
  onExited?: () => void;
};

/*
 * 进度的补间 0.5s（官网实测）。两个变量一起走：位置用小数的那个，读数用整数的那个。
 * 退场时再加上整层的淡出：等 1.4s（走满 0.5s、铺满 0.6s、停一下）之后淡 1s。
 */
const progressTransition =
  "[transition:--ef-splash-progress_500ms_var(--ease-exit),--ef-splash-percent_500ms_var(--ease-exit)]";
const leavingTransition =
  "[transition:--ef-splash-progress_500ms_var(--ease-exit),--ef-splash-percent_500ms_var(--ease-exit),opacity_1s_var(--ease-standard)_1.4s]";

/** 三角标：三个朝下的小三角拼成一个倒三角 */
function Mark() {
  return (
    <svg
      viewBox="0 0 24 21"
      aria-hidden="true"
      className={cn(
        decorLayer,
        "absolute -top-[calc(var(--ef-splash-unit)*2.5)] -left-[calc(var(--ef-splash-unit)*3.375)] h-[calc(var(--ef-splash-unit)*1.3125)] w-[calc(var(--ef-splash-unit)*1.4375)] fill-action cq-portrait:hidden",
      )}
    >
      <path d="M0 0h11.6L5.8 10zM12.4 0H24l-5.8 10zM6.2 11h11.6L12 21z" />
    </svg>
  );
}

/**
 * 代码画的那组微标：带框的加号、微文字、两排方点。至少占官网那张图的高度（4 个单位）；
 * 微文字有字号的下限，多出来的往上长。竖排时上面紧挨着进度条的读数，放不下微文字
 */
function DefaultDecor({ caption }: { caption: ReactNode }) {
  return (
    <div className="flex min-h-[calc(var(--ef-splash-unit)*4)] flex-col items-start justify-between gap-[calc(var(--ef-splash-unit)*0.5)] text-neutral-600">
      <svg
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        className="size-[calc(var(--ef-splash-unit)*1.125)]"
      >
        <path d="M.5.5h11v11H.5zM6 3v6M3 6h6" />
      </svg>
      {caption !== undefined && (
        <p className="font-latin text-[length:max(calc(var(--ef-splash-unit)*0.75),var(--text-micro))] leading-[1.2] font-medium tracking-label whitespace-pre-line text-ink-tertiary uppercase cq-portrait:hidden">
          {caption}
        </p>
      )}
      {/* 画成一张图：方点只有半个单位大，一个个排成元素的话，小尺寸下间隔会忽宽忽窄 */}
      <svg
        viewBox="0 0 62 18"
        fill="currentColor"
        className="h-[calc(var(--ef-splash-unit)*1.125)] w-[calc(var(--ef-splash-unit)*3.875)]"
      >
        {[0, 11].flatMap((y) =>
          [0, 11, 22, 33, 44, 55].map((x) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" />
          )),
        )}
      </svg>
    </div>
  );
}

/**
 * 开屏页：照官网首次载入的那一页排的。近黑底，一根贴边的黄色进度条，读数跟着条的末端走；
 * 画面偏右是标志，下面一组微标、一条分隔线和一行标语。就绪后黄色铺满整屏，再整层淡出。
 *
 * 标志和底图是插槽，库里不带任何图。横竖看它所在的那一块自己的宽高比，不看视口；
 * 尺寸跟着那一块的宽度等比缩放，插槽里的东西可以用 `--ef-splash-unit` 跟着缩。
 *
 * 只要一块盖住整页的等待、不要这些排场，用 `Loader`。
 */
export function SplashScreen({
  value,
  logo,
  tagline,
  caption,
  decor,
  status = "LOADING",
  backdrop,
  open = true,
  fullscreen = true,
  label = "加载中",
  onReveal,
  onExited,
  onKeyDown,
  className,
  style,
  ref,
  ...props
}: SplashScreenProps) {
  // 页面露出来了没有：开始淡出的那一刻。在那之前这一层一直盖着、锁着
  const [revealed, setRevealed] = useState(false);
  if (open && revealed) setRevealed(false);

  const handlers = useRef({ onReveal });
  const fired = useRef(false);
  useLayoutEffect(() => {
    handlers.current = { onReveal };
    if (open) fired.current = false;
  });
  const reveal = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    setRevealed(true);
    handlers.current.onReveal?.();
  }, []);

  // 退出：淡出的过渡走完后卸载；重新打开立刻挂回来
  const { ref: rootRef, mounted } = usePresence<HTMLDivElement>(open, {
    onExited: () => {
      // 没有过渡可等的环境里等不到"开始淡出"：卸载之前补上
      reveal();
      onExited?.();
    },
  });
  const leaving = mounted && !open;

  // 淡出排在铺满之后，等的是它真的开始的那一刻（延迟走完），不是退场的开头
  useLayoutEffect(() => {
    const node = rootRef.current;
    if (!leaving || !node) return;
    const onStart = (event: TransitionEvent) => {
      if (event.target === node && event.propertyName === "opacity") reveal();
    };
    node.addEventListener("transitionstart", onStart);
    return () => node.removeEventListener("transitionstart", onStart);
  }, [leaving, rootRef, reveal]);

  /*
   * 整页模式：锁住页面滚动，把焦点收进来。和 Loader 不一样，开始退场时不放开——
   * 黄色铺满的那一段页面还完全被盖着，放开了只会点到看不见的东西。到开始淡出才放
   */
  const blocking = mounted && (open || !revealed);
  useEffect(() => {
    if (!fullscreen || !blocking) return;
    const page = document.documentElement;
    const previousOverflow = page.style.overflow;
    const previousFocus = document.activeElement;
    page.style.overflow = "hidden";
    rootRef.current?.focus({ preventScroll: true });
    return () => {
      page.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [fullscreen, blocking, rootRef]);

  if (!mounted) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    // 焦点留在开屏页上，不让 Tab 走到被盖住的内容里
    if (fullscreen && blocking && event.key === "Tab") event.preventDefault();
  };

  const indeterminate = value === undefined;
  const current = indeterminate ? 0 : Math.min(Math.max(value, 0), 100);
  // 退场先把条走满：就绪就是百分之百，铺满前的那半秒留给它
  const shown = open ? current : 100;
  const travelling = indeterminate && open;

  return (
    <div
      tabIndex={-1}
      {...props}
      ref={mergeRefs(rootRef, ref)}
      // 固定的近黑底，不随页面的主题变：做成局部的暗色主题，插槽里照常用语义令牌
      data-theme="dark"
      data-state={open ? "open" : "closing"}
      onKeyDown={handleKeyDown}
      style={
        {
          ...style,
          "--ef-splash-progress": shown,
          "--ef-splash-percent": Math.round(shown),
        } as CSSProperties
      }
      className={cn(
        "overflow-hidden bg-surface text-ink outline-none [container-type:size]",
        fullscreen ? "fixed inset-0 z-(--z-loader)" : "absolute inset-0",
        leaving ? leavingTransition : progressTransition,
        leaving && "opacity-0",
        !blocking && "pointer-events-none",
        className,
      )}
    >
      {/*
       * 一个单位是官网的 1rem：横排是宽度的 1/160，竖排是 1/67.5。
       * 状态字和标语有字号的下限（官网在小屏上会缩到看不清），收成两个变量：
       * 竖排时下面那一摞是从底边往上排的，条要按它们多占的高度往上让
       */}
      <div className="absolute inset-0 [--_status:max(var(--ef-splash-unit),var(--text-xs))] [--_tagline:max(calc(var(--ef-splash-unit)*1.5),var(--text-xs))] [--ef-splash-unit:0.625cqw] cq-portrait:[--ef-splash-unit:1.4815cqw]">
        {backdrop !== undefined && (
          <div
            aria-hidden="true"
            className={cn(
              decorLayer,
              "absolute inset-0 blur-[calc((100_-_var(--ef-splash-progress))*0.08px)] *:size-full [&>img]:object-cover",
            )}
          >
            {backdrop}
          </div>
        )}

        {logo !== undefined && (
          <div className="absolute top-[calc(50%_-_var(--ef-splash-unit)*17.375)] left-[64.4531%] flex h-[calc(var(--ef-splash-unit)*16.75)] w-[calc(var(--ef-splash-unit)*16.5)] items-center justify-center cq-portrait:top-[41.667%] cq-portrait:left-1/2 cq-portrait:h-[calc(var(--ef-splash-unit)*20.9375)] cq-portrait:w-[calc(var(--ef-splash-unit)*19.3125)] cq-portrait:-translate-1/2 [&>:is(img,svg)]:size-full [&>img]:object-contain">
            {logo}
          </div>
        )}

        <div className="absolute top-[calc(50%_+_var(--ef-splash-unit)*18.375)] right-[calc(var(--ef-splash-unit)*2)] left-[64.4531%] cq-portrait:top-auto cq-portrait:right-[calc(var(--ef-splash-unit)*4.625)] cq-portrait:bottom-[calc(var(--ef-splash-unit)*5.75)] cq-portrait:left-[calc(var(--ef-splash-unit)*4.625)]">
          {decor === undefined && <Mark />}
          {decor !== null && (
            <div
              aria-hidden="true"
              className={cn(decorLayer, "absolute bottom-full left-0")}
            >
              {decor === undefined ? <DefaultDecor caption={caption} /> : decor}
            </div>
          )}
          <span
            aria-hidden="true"
            className={cn(
              decorLayer,
              "mt-[calc(var(--ef-splash-unit)*1.25)] mb-[calc(var(--ef-splash-unit))] -ml-[calc(var(--ef-splash-unit)*21.625)] block h-0.5 w-[calc(var(--ef-splash-unit)*70)] bg-linear-to-r from-transparent via-neutral-0/10 to-transparent",
            )}
          />
          {tagline !== undefined && (
            <p className="text-[length:var(--_tagline)] leading-[1.35] wrap-anywhere">
              {tagline}
            </p>
          )}
        </div>

        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={travelling ? undefined : shown}
          // 高对比模式下底色都被系统换掉：轨道剩一圈线，填充用系统的"选中"色（同 Progress）
          className="absolute top-0 left-0 h-full w-[calc(var(--ef-splash-unit)*1.25)] forced-colors:outline forced-colors:-outline-offset-1 forced-colors:outline-[CanvasText] cq-portrait:top-auto cq-portrait:bottom-[calc(var(--ef-splash-unit)*17.75_+_(var(--_status)_-_var(--ef-splash-unit))*1.25_+_(var(--_tagline)_-_var(--ef-splash-unit)*1.5)*1.35)] cq-portrait:h-[calc(var(--ef-splash-unit)*2.5)] cq-portrait:w-[82.4074%]"
        >
          {travelling ? (
            <span className="absolute inset-0 overflow-hidden">
              <span className="absolute inset-x-0 top-0 h-2/5 animate-indeterminate-y bg-action motion-reduce:translate-y-3/4 forced-colors:bg-[Highlight] cq-portrait:inset-x-auto cq-portrait:inset-y-0 cq-portrait:left-0 cq-portrait:h-auto cq-portrait:w-2/5 cq-portrait:animate-indeterminate cq-portrait:motion-reduce:translate-x-3/4 cq-portrait:motion-reduce:translate-y-0" />
            </span>
          ) : (
            <span className="absolute top-0 left-0 h-[calc(var(--ef-splash-progress)*1%)] w-full bg-action forced-colors:bg-[Highlight] cq-portrait:h-full cq-portrait:w-[calc(var(--ef-splash-progress)*1%)]" />
          )}

          {/* 读数骑在条的末端上：一条没有高度的基线，数字在线上面，状态字在线下面 */}
          <div
            aria-hidden="true"
            className={cn(
              "absolute top-[calc(var(--ef-splash-progress)*1%)] left-[calc(var(--ef-splash-unit)*3.125)] h-0 whitespace-nowrap cq-portrait:top-auto cq-portrait:-bottom-[calc(var(--ef-splash-unit)*1.75)] cq-portrait:left-[calc(var(--ef-splash-progress)*1%)] cq-portrait:ml-[calc(var(--ef-splash-unit)*0.75)]",
              // 没有数字的时候条的末端不在哪：状态字往下让一点，别贴着上沿
              travelling &&
                "translate-y-[calc(var(--ef-splash-unit)*3)] cq-portrait:translate-y-0",
            )}
          >
            {!indeterminate && (
              <p className="absolute bottom-[calc(var(--ef-splash-unit)*1.625)] left-0 leading-none text-action">
                <span className="mb-[calc(var(--ef-splash-unit)*0.25)] block h-[calc(var(--ef-splash-unit)*1.875)] w-[calc(var(--ef-splash-unit)*0.5)] rounded-[calc(var(--ef-splash-unit)*0.25)] bg-action" />
                {/* 数字是计数器画的：它跟着那个整数变量补间，脚本不用一帧一帧去写 */}
                <span className="text-[length:calc(var(--ef-splash-unit)*4.375)] font-medium tabular-nums [counter-reset:ef-splash_var(--ef-splash-percent)] before:content-[counter(ef-splash)]" />
                <span className="text-[length:calc(var(--ef-splash-unit)*3.25)]">
                  %
                </span>
              </p>
            )}
            <p className="absolute -top-[calc(var(--ef-splash-unit)*0.5)] left-0 text-[length:var(--_status)] leading-[1.25] text-ink-tertiary">
              <span className="block h-[calc(var(--ef-splash-unit)*0.5)] w-[calc(var(--ef-splash-unit)*1.25)] border-x-[length:calc(var(--ef-splash-unit)*0.5)] border-current" />
              {status}
            </p>
          </div>
        </div>
      </div>

      {/* 铺满：等条走满（0.5s）再从左往右盖过去，0.6s，先慢后快（官网实测） */}
      {leaving && (
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-left animate-fill bg-action [animation-delay:500ms] [animation-timing-function:cubic-bezier(1,0,0.7,1)] motion-reduce:hidden forced-colors:bg-[Highlight]"
        />
      )}
    </div>
  );
}
