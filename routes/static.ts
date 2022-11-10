import { stdFsWalk, mrmime } from "../deps.ts";

export const handler = async (req, { origin }) => {
  const fpath = new URL(`.${new URL(req.url).pathname}`, origin);
  if (await Deno.stat(origin).catch(() => false))
    for await (const { path } of stdFsWalk.walk(origin))
      if (new URL(path, origin).href === fpath.href)
        return new Response(await Deno.readFile(path), {
          headers: {
            "content-type": mrmime.lookup(path) ?? "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
  return new Response(null, { status: 404 });
};
