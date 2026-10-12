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
