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
