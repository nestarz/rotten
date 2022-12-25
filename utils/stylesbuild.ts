import { pascalify, getHashSync, memo } from "./shalimar.ts";

export const cssIdFromUrl = (url: URL) =>
  pascalify(url.href.match(/.*\/(.*?)\.(.*)/)?.[1]);

export const cssSignatureFromUrl = async (url: URL) => ({
  id: cssIdFromUrl(url),
  className: `_${getHashSync(await Deno.readTextFile(url))}`,
});

export const cssSignatureFromEntrypoints = async (entryPoints: URL[]) =>
  await entryPoints
    .map(cssSignatureFromUrl)
    .reduce(async (p, v) => [...(await p), await v], []);

export default async ({ outfile, entryPoints }) => {
  const styles = await cssSignatureFromEntrypoints(entryPoints);
  const mem = await Deno.stat(outfile)
    .then(() => memo)
    .catch(() => (v) => v);
  await await mem(Deno.writeTextFile)(
    outfile,
    [
      ...styles.map(
        (obj) => `export const ${obj.id} = ${JSON.stringify(obj)};\n`
      ),
      `export const state = new Map();\n`,
      `const classs = ${((...args) =>
        args
          .flatMap((object) => {
            if (!object) return null;
            if (typeof object === "string") return object;
            return Object.entries(object).reduce(
              (str, [name, bool]) => (bool && name ? [...str, name] : str),
              []
            );
          })
          .filter((v) => v)
          .join(" ")).toString()};\n`,
      `export default (...args) => args.forEach(cn => state.set(cn)) ?? classs(...args);\n`,
    ].join("")
  );

  return styles;
};
