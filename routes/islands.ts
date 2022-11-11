import { esbuildWasm, esbuild_deno_loader, stdFsWalk } from "../deps.ts";

let esbuildOk: boolean = false;
export const setup = async ({ origin, importMapURL, ...esbuildConfig }) => {
  esbuildOk =
    (esbuildOk ||
      (await esbuildWasm.initialize({
        worker: false,
        wasmModule: await fetch(
          new URL("../wasm/esbuild/esbuild_v0.15.13.wasm", import.meta.url),
          { headers: { "Content-Type": "application/wasm" } }
        ).then(WebAssembly.compileStreaming),
      }))) ??
    true;

  const islands = [];
  for await (const { path, isFile } of stdFsWalk.walk(origin))
    if (isFile) islands.push(path);
  return {
    origin,
    ...(await esbuildWasm.build({
      entryPoints: {
        preact: "preact",
        ...Object.fromEntries(
          islands.map((d) => [
            d.split("/").slice(-1).pop().split(".").slice(0, -1).join("."),
            d,
          ])
        ),
      },
      jsxFactory: "createElement",
      jsxFragment: "Fragment",
      jsxImportSource: "preact",
      format: "esm",
      target: ["chrome99", "firefox99", "safari15"],
      plugins: [
        esbuild_deno_loader.denoPlugin({ importMapURL, loader: "portable" }),
      ],
      bundle: true,
      jsx: "automatic",
      treeShaking: true,
      write: false,
      minify: !!Deno.env.get("DENO_DEPLOYMENT_ID"),
      sourcemap: true,
      outdir: ".",
      metafile: true,
      splitting: true,
      platform: "neutral",
      ...esbuildConfig,
    })),
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
