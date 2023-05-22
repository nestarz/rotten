import { fromFileUrl, join } from "https://deno.land/std@0.188.0/path/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.17.19/wasm.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.7.0/mod.ts";
import {
  getHashSync,
  scripted,
  collectAndCleanScripts,
} from "https://deno.land/x/scripted@0.0.2/mod.ts";
export { scripted } from "https://deno.land/x/scripted@0.0.2/mod.ts";

const readPlugin = () => ({
  name: "deno_read",
  setup(build) {
    build.onResolve(
      { filter: /^\.(.*)\.(t|j)s(x|)/, namespace: "file" },
      async (args) => {
        const path = await Deno.realPath(
          args.path.startsWith("file")
            ? fromFileUrl(args.path)
            : args.path.startsWith(".")
            ? join(args.resolveDir, args.path)
            : args.path
        );
        return { path, namespace: "file" };
      }
    );
    build.onLoad(
      { filter: /.*\.(t|j)s(x|)/, namespace: "file" },
      async (args) => ({
        contents: await fetch(args.path).then((r) => r.text()),
        loader: "tsx",
      })
    );
  },
});

const readOnly = !!Deno.env.get("DENO_DEPLOYMENT_ID");

console.time(`[init] ${esbuild.version}`);
await esbuild
  .initialize({
    wasmURL: `https://raw.githubusercontent.com/esbuild/deno-esbuild/v${esbuild.version}/esbuild.wasm`,
    worker: false,
  })
  .catch(console.warn);
console.timeEnd(`[init] ${esbuild.version}`);

const esBuild = async (
  manifest: Manifest,
  config: Parameters<typeof esbuild.build>[0] = {}
) => {
  console.time("build");
  const res = await esbuild.build({
    plugins: [
      readPlugin(),
      ...denoPlugins({
        importMapURL: new URL("import_map.json", manifest.baseUrl).href,
      }),
    ],
    format: "esm",
    jsx: "transform",
    jsxFactory: "h",
    jsxFragment: "Fragment",
    bundle: true,
    splitting: true,
    treeShaking: true,
    write: false,
    outdir: manifest.prefix,
    sourcemap: "linked",
    minify: true,
    ...config,
  });
  console.timeEnd("build");
  return res;
};

export const dump = async (manifest: Manifest) => {
  const contents = collectAndCleanScripts();
  const { outputFiles } = await esBuild(manifest, {
    splitting: false,
    stdin: { contents },
    sourcemap: false,
  });
  return outputFiles?.[0].text;
};

type Glob = (Deno.DirEntry & { url: URL })[];

const readDir = async (dir: string | URL) => {
  const results: Deno.DirEntry[] = [];
  if (await Deno.stat(dir).catch(() => false))
    for await (const result of Deno.readDir(dir)) results.push(result);
  return results;
};

const asyncGlob = async (
  dir: string | URL,
  pattern: URLPattern
): Promise<Glob> => {
  const entries = await readDir(dir);
  const results: Glob = [];
  for (const entry of entries) {
    const url = new URL(`${dir}/${entry.name}`);
    if (entry.isDirectory) {
      const subResults = await asyncGlob(`${dir}/${entry.name}`, pattern);
      results.push(...subResults);
    } else if (pattern.test(url)) {
      results.push({ ...entry, url });
    }
  }
  return results;
};

interface Root {
  render(children: React.ReactNode): void;
  unmount(): void;
}

type HydrateFn = (
  container: Element | Document,
  initialChildren: React.ReactNode
) => Root;

const hydrate = (
  node: Element,
  specifier: string,
  name: string,
  { ...props }: { [key: string]: any }
): void => {
  import(specifier).then(({ h, hydrate, ...o }: { hydrate: HydrateFn }) => {
    const childs = [...node.childNodes].map((node) => {
      if (!node.tagName && node.nodeType === 3) return node.textContent;
      const attributes = Array.from(node.attributes ?? {}).reduce(
        (p, a) => ({ ...p, [a.name]: a.value }),
        { dangerouslySetInnerHTML: { __html: node.innerHTML } }
      );
      return h(node.tagName.toLowerCase(), attributes);
    });
    const hydrateFn = (a, b) =>
      hydrate.length === 2 ? hydrate(a, b) : hydrate(b, a);
    hydrateFn(h(o[name], props, childs), node.parentNode);
  });
};

const getIsland = (islands: Record<string, string>[], url: string | URL) => {
  return islands.find((v) => v.reqpath === new URL(url).pathname);
};

const buildIsland = async (prefix: string, entryUrl: URL) => {
  const id = `_${getHashSync(await fetch(entryUrl).then((r) => r.text()))}`;
  const reqpath = join(prefix, `${id}.js`);
  const entrypath = entryUrl.href;
  return { id, entrypath, reqpath, outpath: join("dist", reqpath) };
};

const buildOutputFiles = async (
  manifest: Manifest,
  islands: Record<string, string>[],
  save: boolean
) => {
  const entryPoints = islands.map((i) => ({ in: i.entrypath, out: i.id }));
  const result = await esBuild(manifest, { entryPoints });
  if (save) {
    const folder = join("dist", manifest.prefix);
    await Deno.remove(folder, { recursive: true }).catch(() => null);
    await Deno.mkdir(folder, { recursive: true });
    await Promise.all(
      (result.outputFiles ?? []).map(({ path, contents }) =>
        Deno.writeFile(join("dist", path), contents)
      )
    );
  }
  return result;
};

class SuffixTransformStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(suffix: string) {
    super({
      flush(controller) {
        controller.enqueue(new TextEncoder().encode(suffix));
        controller.terminate();
      },
    });
  }
}

export const createRegister =
  (islands: any[]) => (vpath: string, props?: any, name?: string) => {
    const specifier = islands.find((v) =>
      v.entrypath?.includes(vpath)
    )?.reqpath;
    if (!specifier) {
      console.log(vpath, islands);
      throw Error(`[islands] Specifier for "${vpath}" not found.`);
    }
    return scripted(hydrate, specifier, name ?? "default", props ?? {});
  };

export const createRegisterComponent =
  ({ h, register }) =>
  ({
    h: h2,
    island,
    islandContainer = "div",
    islandName,
    islandProps,
    name,
    children,
    ...props
  }) => {
    const classNames = [register(islandName, props, name), props.className]
      .filter((v) => v)
      .join(" ");
    const hh = h ?? h2;
    return hh(
      islandContainer,
      islandProps,
      hh(island, { ...props, className: classNames }, children)
    );
  };

export interface Manifest {
  baseUrl: URL;
  islands: URL | URL[];
  prefix: string;
}

export const setup = async (manifest: Manifest, save = true) => {
  const islands = (
    await Promise.all(
      (Array.isArray(manifest.islands)
        ? manifest.islands
        : [manifest.islands].filter((v) => v)
      ).flatMap(async (island: URL) => {
        const islandPattern = new URLPattern({ pathname: "*.(t|j)s(x|)" });
        const paths = islandPattern.test(island)
          ? [island]
          : await asyncGlob(island, islandPattern).then((files) =>
              files.map(({ url }) => url)
            );
        return Promise.all(
          paths.map(
            async (path: URL) => await buildIsland(manifest.prefix, path)
          )
        );
      })
    )
  ).flat(1);

  const isSync = await Promise.all(
    islands.map(async (v) => !!(await Deno.stat(v.outpath)))
  ).catch(() => false);

  if (!isSync && readOnly) {
    throw Error("Islands not synced with source.\n" + JSON.stringify(islands));
  }

  const register = createRegister(islands);
  return {
    islands,
    register,
    createRegisterComponent: ({ h }) =>
      createRegisterComponent({ h, register }),
    inject: async (html: string | ReadableStream) => {
      const scripts = await dump(manifest);
      const script = `<script data-scripted>${scripts}</script>`;
      if (html instanceof ReadableStream) {
        return html.pipeThrough(new SuffixTransformStream(script));
      }
      return `${html.replace(
        html.includes("</body>") ? /(<\/body>)/ : /(.*)/,
        (_, $1) => `${script}${$1}`
      )}`;
    },
    ...(isSync
      ? {
          get: async (url: string) => {
            const island = getIsland(islands, url);
            const dist =
              island?.outpath ?? Deno.cwd() + "/dist" + new URL(url).pathname;
            return dist ? await Deno.readFile(dist) : null;
          },
        }
      : await buildOutputFiles(manifest, islands, save).then((result) => ({
          get: (url: string) => {
            const island = getIsland(islands, url);
            return (
              (result.outputFiles ?? []).find(
                (file) =>
                  file.path === island?.reqpath ||
                  file.path === new URL(url).pathname
              )?.contents ?? null
            );
          },
        }))),
  };
};
