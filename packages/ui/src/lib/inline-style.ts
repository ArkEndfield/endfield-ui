/**
 * 往元素上临时写过内联样式、又都撤掉之后调：原来没有 `style` 属性的，
 * 不留一个空的在上面。
 *
 * 先问一句"有没有这个属性"不是多余的：浏览器是懒着把内联样式同步成属性的，
 * 不问就去删，删的那一下落空，回头它又冒出来一个空的 `style=""`。
 */
export function dropEmptyStyle(node: HTMLElement) {
  if (node.style.length === 0 && node.hasAttribute("style")) {
    node.removeAttribute("style");
  }
}
