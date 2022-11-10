import { pascalify, getHashSync, memo } from "./shalimar.ts";

export default async ({ outfile, entrydir }) => {
  const styles: any[] = [];
  for await (const { name, isFile } of Deno.readDir(entrydir))
    if (isFile)
      styles.push({
        name,
        id: pascalify(name?.match(/(.*?)\.(.*)/)?.[1]),
        path: "./styles/" + name,
        className: `_${getHashSync(new URL(name, entrydir).href)}`,
      });

  await memo(Deno.writeTextFile)(
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
