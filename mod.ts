export {
  default as render,
  hydrate,
  scripted,
  scriptedGet,
} from "./utils/render.tsx";
export { default as stylesbuild } from "./utils/stylesbuild.ts";
export { default as svgbuild } from "./utils/svgbuild.ts";

import render, { scriptedGet } from "./utils/render.tsx";
export const withCtx = (handler) => (ctx) => (req) => handler(req, ctx);
const defaultHandler = (_, ctx) => ctx.render();
export const withRenderer = (
  { handler, default: elt, Wrapper, ...props },
  ctx
) =>
  withCtx(handler ?? defaultHandler)({
    render: (data) =>
      render(elt, props)({ Wrapper, scriptedGet, data, ...ctx }),
  });
export const readdir = async (styleDir) => {
  const entryPoints: string[] = [];
  for await (const { isFile, name } of Deno.readDir(styleDir))
    if (isFile) entryPoints.push(new URL(styleDir + name));
  return entryPoints;
};
