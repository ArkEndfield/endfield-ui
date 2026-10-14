/*
 * 实机风格这一类用到的主库的东西，都从这一个文件过。
 *
 * 列在这里的必须是主入口（`src/index.ts`）公开导出的名字：构建 game 入口时，
 * game 目录之外的模块一律换成对 `./index.js` 的引用（见 `tsdown.config.ts`）。
 * 这样 `Field` 的上下文和主入口是同一份，主入口的产物也不因为多了这个入口而变。
 */
export { useFieldContext, useFieldControl } from "../../components/field/Field";
export {
  SplashScreen,
  type SplashScreenProps,
} from "../../components/splash-screen/SplashScreen";
export { useControllableState } from "../../hooks/useControllableState";
export { usePortalScope } from "../../hooks/usePortalScope";
export { useReducedMotion } from "../../hooks/useReducedMotion";
export { cn } from "../../lib/cn";
