const tm = Deno.makeTempDirSync;
Deno.makeTempDirSync = (...props) => {
  console.log(new Error().stack.split("\n")[2].trim().split(" ")[1]);
  console.log("Deno.makeTempDirSync", props);
};

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
export const withRenderer = ({ handler, default: elt, Wrapper }, ctx) =>
  withCtx(handler ?? defaultHandler)({
    render: (data) => render(elt)({ Wrapper, scriptedGet, data, ...ctx }),
  });
