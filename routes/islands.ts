import {
  esbuildWasm,
  esbuild_deno_loader,
  stdFsWalk,
  IS_PROD,
} from "../deps.ts";

import * as esbuild2 from "https://deno.land/x/esbuild/mod.js";

export let esbuild = esbuild2;
export const setup = async ({ origin, importMapURL, ...esbuildConfig }) => {
  console.time("[init] " + import.meta.url);

  esbuild =
    esbuild ??
    (await esbuildWasm
      .initialize({
        worker: !IS_PROD,
        wasmModule: await fetch(
          new URL("../wasm/esbuild/esbuild_v0.16.0.wasm", import.meta.url),
          { headers: { "Content-Type": "application/wasm" } }
        ).then(WebAssembly.compileStreaming),
      })
      .then(() => esbuildWasm));

  const islands = [];
  for await (const { path, isFile } of stdFsWalk.walk(origin))
    if (isFile) islands.push(path);
  console.timeEnd("[init] " + import.meta.url);
  console.time("[build] " + import.meta.url);
  console.log(
    Object.fromEntries(
      islands.map((d) => [
        d.split("/").slice(-1).pop().split(".").slice(0, -1).join("."),
        d,
      ])
    )
  );

  return {
    origin,
    ...(await esbuild
      .build(
        (typeof esbuildConfig === "function" ? esbuildConfig : (v) => v)({
          entryPoints: {
            ...Object.fromEntries(
              islands.map((d) => [
                d.split("/").slice(-1).pop().split(".").slice(0, -1).join("."),
                d,
              ])
            ),
          },
          format: "esm",
          target: ["chrome99", "firefox99", "safari15"],
          plugins: [esbuild_deno_loader.denoPlugin({ importMapURL })],
          bundle: true,
          jsx: "transform",
          jsxFactory: "h",
          jsxFragment: "Fragment",
          treeShaking: true,
          write: false,
          minify: IS_PROD,
          sourcemap: true,
          outdir: ".",
          outfile: "",
          metafile: true,
          splitting: true,
          platform: "neutral",
          ...(typeof esbuildConfig === "object" ? esbuildConfig : {}),
        })
      )
      .finally(() => console.timeEnd("[build] " + import.meta.url))),
  };
};

export const handler = async (req, { origin, metafile, outputFiles }) => {
  const fpath = new URL(`..${new URL(req.url).pathname}`, origin);
  for (const [i, key] of Object.keys(metafile?.outputs ?? {}).entries()) {
    if (new URL(key, origin).href === fpath.href) {
      return new Response(outputFiles[i].contents, {
        headers: {
          "content-type": key.endsWith(".map")
            ? "application/json"
            : "application/javascript",
        },
      });
    }
  }

  return new Response(null, { status: 401 });
};
