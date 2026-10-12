import { copyFile, mkdir } from "node:fs/promises";

const destination = new URL("../dist/assets/", import.meta.url);
await mkdir(destination, { recursive: true });
await copyFile(
  new URL(
    "../src/components/rounded-button/assets/pag-button-texture.png",
    import.meta.url,
  ),
  new URL("pag-button-texture.png", destination),
);

const alertAssets = new URL(
  "../src/components/banner-alert/assets/",
  import.meta.url,
);
for (const filename of [
  "alert_banner_bg_left.png",
  "alert_banner_bg_right.png",
  "alert_bg.png",
  "deco_common_logo_bg.png",
]) {
  await copyFile(
    new URL(filename, alertAssets),
    new URL(filename, destination),
  );
}

const itemAssets = new URL(
  "../src/components/item-card/assets/",
  import.meta.url,
);
for (const filename of [
  "items_background.webp",
  "items_background_dark.webp",
  "weapons_background.webp",
  "weapons_background_dark.webp",
  "enemies_background.webp",
  "enemies_background_dark.webp",
  "icon_card_rarity_1_bottom_edge.webp",
  "icon_card_rarity_2_bottom_edge.webp",
  "icon_card_rarity_3_bottom_edge.webp",
  "icon_card_rarity_4_bottom_edge.webp",
  "icon_card_rarity_5_bottom_edge.webp",
  "icon_card_rarity_6_bottom_edge.webp",
  "prism.webp",
  "crystal-shell.webp",
  "copper-bottle.webp",
  "copper-bottle-content.webp",
  "gold-ticket.webp",
]) {
  await copyFile(new URL(filename, itemAssets), new URL(filename, destination));
}

const tooltipAssets = new URL(
  "../src/components/item-tooltip-card/assets/",
  import.meta.url,
);
for (const filename of ["header.webp", "link.webp", "detail.png"]) {
  await copyFile(
    new URL(filename, tooltipAssets),
    new URL(filename, destination),
  );
}
