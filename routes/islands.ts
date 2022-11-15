import { esbuild, esbuild_deno_loader, stdFsWalk, IS_PROD } from "../deps.ts";

let esbuildInitialized: boolean | Promise<void> = false;
async function ensureEsbuildInitialized() {
  if (esbuildInitialized === false) {
    if (Deno.run === undefined) {
      const wasmURL = new URL(
        "../wasm/esbuild/esbuild_v0.15.14.wasm",
        import.meta.url
      ).href;
      esbuildInitialized = fetch(wasmURL).then(async (r) => {
        const resp = new Response(r.body, {
          headers: { "Content-Type": "application/wasm" },
        });
        const wasmModule = await WebAssembly.compileStreaming(resp);
        await esbuild.initialize({
          wasmModule,
          worker: false,
        });
      });
    } else {
      esbuild.initialize({});
    }
    await esbuildInitialized;
    esbuildInitialized = true;
  } else if (esbuildInitialized instanceof Promise) {
    await esbuildInitialized;
  }
}

export const setup = async ({ origin, importMapURL, ...esbuildConfig }) => {
  console.time("[init] " + import.meta.url);
  await ensureEsbuildInitialized();

  const islands = [];
  for await (const { path, isFile } of stdFsWalk.walk(origin))
    if (isFile) islands.push(path);
  console.timeEnd("[init] " + import.meta.url);
  console.time("[build] " + import.meta.url);
  return {
    origin,
    ...(await esbuild
      .build(
        (typeof esbuildConfig === "function" ? esbuildConfig : (v) => v)({
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
            esbuild_deno_loader.denoPlugin({ importMapURL, loader: "native" }),
          ],
          bundle: true,
          jsx: "automatic",
          treeShaking: true,
          write: false,
          minify: IS_PROD,
          sourcemap: true,
          outdir: ".",
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
