export * as postcss from "https://deno.land/x/postcss@8.4.16/mod.js";
export * as postcssNesting from "https://esm.sh/postcss-nesting@10.2.0";
export * as esbuild_deno_loader from "https://deno.land/x/esbuild_deno_loader@0.5.2/mod.ts";
// -- esbuild --
// @deno-types="https://deno.land/x/esbuild@v0.15.14/mod.d.ts"
import * as esbuildWasm from "https://deno.land/x/esbuild@v0.15.14/wasm.js";
import * as esbuildNative from "https://deno.land/x/esbuild@v0.15.14/mod.js";
// @ts-ignore trust me
const esbuild: typeof esbuildWasm =
  Deno.run === undefined ? esbuildWasm : esbuildNative;
export { esbuild, esbuildWasm as esbuildTypes };
export * as stdFsWalk from "https://deno.land/std@0.162.0/fs/walk.ts";
export * as mrmime from "https://deno.land/x/mrmime@v1.0.1/mod.ts";
export const IS_PROD = !!Deno.env.get("DENO_DEPLOYMENT_ID");
