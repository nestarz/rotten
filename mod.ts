export { default as render, scripted, scriptedGet } from "./utils/render.tsx";
export { default as stylesbuild } from "./utils/stylesbuild.ts";
export { default as svgbuild } from "./utils/svgbuild.ts";

import render, { scriptedGet } from "./utils/render.tsx";
export const withCtx = (handler) => (ctx) => (req) => handler(req, ctx);
const defaultHandler = (_, ctx) => ctx.render();
export const withRenderer = ({ handler, default: elt, Wrapper }, ctx) =>
  withCtx(handler ?? defaultHandler)({
    render: (data) => render(elt)({ Wrapper, scriptedGet, data, ...ctx }),
  });
