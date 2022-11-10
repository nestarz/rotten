import { pascalify, memo } from "./shalimar.ts";

export const getSvg = async (
  url: string | URL,
  base: string | URL,
  outdir: string | URL
) => {
  const filepath = `${outdir}${url.split("/")[1]}.jsx`;
  if (!(await Deno.lstat(filepath).catch(() => false))) {
    await Deno.mkdir(outdir, { recursive: true }).catch(() => null);
    const str: string = await fetch(new URL(url, base)).then((r) => r.text());
    if (!str.includes("<svg")) throw Error(`${url} on ${base} not found`);
    await Deno.writeTextFile(
      new URL(filepath),
      `export default (props) => ${str.replace("<svg ", "<svg {...props} ")}`
    );
  }
};

export default memo(async ({ outfile, outdir, entries }) => {
  await Promise.all(
    entries.flatMap(({ base, urls }) =>
      urls.map(async (url) => await getSvg(url, base, outdir))
    )
  );
  const svgs = [];
  for await (const { name, isFile } of Deno.readDir(outdir))
    if (isFile) svgs.push(name);
  await Deno.writeTextFile(
    outfile,
    svgs
      .map(
        (name) =>
          `export { default as ${pascalify(
            name
              .split("/")
              ?.pop()
              ?.match(/(.*?)\.(.*)/)?.[1]
          )?.replace(/-/g, "")} } from "./src/components/svg/${name}";\n`
      )
      .join("")
  );
});
