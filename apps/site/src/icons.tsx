/*
 * 站点自己用的几个图标：侧轨上每一组一个，外加搜索、主题、复制。
 * 都是按图标规范画的原创几何形（24 网格、2px 线、平头尖角），用库里的 createIcon 生成。
 */
import { createIcon } from "@endfield-ui/react";

/** 首页：四格 */
export const HomeIcon = createIcon(
  "HomeIcon",
  <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
);

/** 总纲：一页纸 */
export const OverviewIcon = createIcon(
  "OverviewIcon",
  <path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h3" />,
);

/** 基础：叠着的三层 */
export const FoundationsIcon = createIcon(
  "FoundationsIcon",
  <path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" />,
);

/** 母题：四个角括号围着一个小方块 */
export const ElementsIcon = createIcon(
  "ElementsIcon",
  <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M10 10h4v4h-4z" />,
);

/** 载体：一块屏幕 */
export const SurfacesIcon = createIcon(
  "SurfacesIcon",
  <path d="M3 5h18v12H3zM12 17v4M8 21h8" />,
);

/** 组件：方、圆、菱形 */
export const ComponentsIcon = createIcon(
  "ComponentsIcon",
  <>
    <path d="M4 4h7v7H4zM13 13h7v7h-7zM7.5 13l3.5 3.5L7.5 20 4 16.5z" />
    <circle cx="16.5" cy="7.5" r="3.5" />
  </>,
);

/** Game 实机风格：一颗圆角的钮，里面一个圆片 */
export const GameIcon = createIcon(
  "GameIcon",
  <>
    <rect x="3" y="7" width="18" height="10" rx="5" />
    <circle cx="16" cy="12" r="2.5" />
  </>,
);

/** 依据：一把尺 */
export const ReferencesIcon = createIcon(
  "ReferencesIcon",
  <path d="M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4" />,
);

export const SearchIcon = createIcon(
  "SearchIcon",
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
  </>,
);

/** 亮暗切换：半边涂实的圆 */
export const ContrastIcon = createIcon(
  "ContrastIcon",
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" stroke="none" />
  </>,
);

export const CopyIcon = createIcon(
  "CopyIcon",
  <path d="M9 9h11v11H9zM15 5V4H4v11h1" />,
);

/** 往外走的链接：斜向上的箭头 */
export const ExternalIcon = createIcon(
  "ExternalIcon",
  <path d="M7 17L18 6M9 6h9v9" />,
);
