/*
 * 站点挂在哪个路径下，首尾都带斜杠。
 *
 * 线上是 GitHub Pages 的子路径（根路径是 Storybook 预览站）；换地方部署时用 SITE_BASE 改。
 * 单放一个文件、不带任何依赖：构建、预览和浏览器实测都要读它，实测那边是不装包就跑的。
 */
export const base = process.env.SITE_BASE ?? "/endfield-ui/design/";
