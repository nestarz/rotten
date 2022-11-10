import { svgbuild, stylesbuild } from "rotten";

await svgbuild({
  outdir: new URL("./components/svg/", import.meta.url),
  outfile: new URL("./svg.gen.ts", import.meta.url),
  entries: [
    {
      base: "https://esm.sh/remixicon@2.5.0/icons/",
      urls: [
        "Document/markdown-line.svg",
        "Media/image-add-line.svg",
        "Design/pencil-line.svg",
        "Device/database-2-line.svg",
        "Document/folder-2-line.svg",
        "Editor/text.svg",
        "Editor/hashtag.svg",
        "Editor/mind-map.svg",
        "System/download-line.svg",
        "System/upload-line.svg",
      ],
    },
  ],
});

await stylesbuild({
  entrydir: new URL("./styles/", import.meta.url),
  outfile: new URL("./styles.gen.ts", import.meta.url),
});

await import("./main.ts");
