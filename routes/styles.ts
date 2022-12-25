import { postcss, postcssNesting } from "../deps.ts";
import {
  cssSignatureFromUrl,
  cssIdFromUrl,
  default as build,
} from "../utils/stylesbuild.ts";

const cssTransform = async (className, url) =>
  await postcss.default([postcssNesting.default]).process(
    (
      await Deno.readTextFile(new URL(url))
    ).replace(/:host( {)/, (_, $1) => `.${className}${$1}`),
    { from: undefined }
  );

export const setup = async ({ entryPoints }) => {
  return await Promise.all(
    entryPoints.map(async (url: any) => {
      const { className, id } = await cssSignatureFromUrl(url);
      return {
        id,
        className,
        css: await cssTransform(className, url),
      };
    })
  );
};

export const handler = async (req, { styles }) => {
  const reqId = cssIdFromUrl(new URL(req.url));
  for (const { id, css } of styles) {
    if (reqId === id)
      return new Response(css, {
        headers: {
          "content-type": "text/css",
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
  }
  return new Response(null, { status: 404 });
};
