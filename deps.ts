export * as postcss from "https://deno.land/x/postcss@8.4.16/mod.js";
export * as postcssNesting from "https://esm.sh/stable/postcss-nesting@10.2.0/es2022/postcss-nesting.js";
export * as esbuild_deno_loader from "https://deno.land/x/esbuild_deno_loader@0.6.0/mod.ts";
// -- esbuild --
// @deno-types="https://deno.land/x/esbuild@v0.16.10/wasm.d.ts"
export * as esbuildWasm from "https://deno.land/x/esbuild@v0.16.10/wasm.js";
export * as esbuildNative from "https://deno.land/x/esbuild@v0.16.10/mod.js";
export * as stdFsWalk from "https://deno.land/std@0.170.0/fs/walk.ts";
export * as mrmime from "https://deno.land/x/mrmime@v1.0.1/mod.ts";
export const IS_PROD = !!Deno.env.get("DENO_DEPLOYMENT_ID");
