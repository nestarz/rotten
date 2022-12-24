import { svgbuild, stylesbuild } from "rotten";

await svgbuild({
  outdir: "./components/svg/",
  outfile: "./svg.gen.ts",
  entries: [
    {
      base: "https://esm.sh/remixicon@2.5.0/icons/",
      urls: ["Document/folder-2-line.svg"],
    },
  ],
});

await stylesbuild({
  entrydir: new URL("./styles/", import.meta.url),
  outfile: new URL("./styles.gen.ts", import.meta.url),
});

await import("./main.ts");
