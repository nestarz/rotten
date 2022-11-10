import { postcss, postcssNesting } from "../deps.ts";

const cssTransform = async (className, url) =>
  await postcss.default([postcssNesting.default]).process(
    (
      await Deno.readTextFile(new URL(url))
    ).replace(/:host( {)/, (_, $1) => `.${className}${$1}`),
    { from: undefined }
  );

export const setup = async ({ stylesGen, base }) => {
  return await Promise.all(
    Object.values(stylesGen)
      .filter(({ className: v }: any) => v)
      .map(async ({ className, path }: any) => ({
        className,
        path,
        css: await cssTransform(className, new URL(path, base)),
      }))
  );
};

export const handler = async (req, stylesFiles) => {
  const origin = new URL("./", import.meta.url);
  const fpath = new URL(`.${new URL(req.url).pathname}`, origin);
  for (const { path, css } of stylesFiles) {
    if (new URL("../src/" + path, origin).href === fpath.href)
      return new Response(css, {
        headers: {
          "content-type": lookup(path) ?? "text/css",
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
  }
  return new Response(null, { status: 404 });
};
