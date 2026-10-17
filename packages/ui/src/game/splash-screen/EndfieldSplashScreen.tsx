import { cn, SplashScreen, type SplashScreenProps } from "../lib/core";

export type EndfieldSplashScreenProps = Omit<
  SplashScreenProps,
  "backdrop" | "caption" | "decor"
>;

/**
 * 官网的开屏页：主入口的 `SplashScreen` 填上官方的标志、底图和微标。
 * 排法、动画、属性都是 `SplashScreen` 的，这里只管把图放进它的插槽。
 *
 * 标志、标语、状态字可以换（`logo`、`tagline`、`status`）；底图和微标经变量换，
 * 或者用 `data-ef-game-images="off"` 整类关掉，见 docs/design/game/splash-screen.md
 */
export function EndfieldSplashScreen({
  logo = (
    <span role="img" aria-label="明日方舟：终末地" className="ef-splash-logo" />
  ),
  tagline = "OVER THE FRONTIER / INTO THE FRONT",
  status = "Updating...",
  className,
  ...props
}: EndfieldSplashScreenProps) {
  return (
    <SplashScreen
      {...props}
      logo={logo}
      tagline={tagline}
      status={status}
      backdrop={<span className="ef-splash-backdrop" />}
      decor={
        <span className="ef-splash-deco">
          <span className="ef-splash-deco__text" />
          <span className="ef-splash-deco__mark" />
        </span>
      }
      className={cn("ef-splash", className)}
    />
  );
}
