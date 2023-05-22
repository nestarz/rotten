import { join, fromFileUrl } from "https://deno.land/std@0.189.0/path/mod.ts";
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
        contents: await Deno.readTextFile(args.path),
        loader: "tsx",
      })
    );
  },
});

const readOnly = !!Deno.env.get("DENO_DEPLOYMENT_ID");

console.time("init");
console.log(esbuild.version);
await esbuild.initialize({
  wasmURL: `https://raw.githubusercontent.com/esbuild/deno-esbuild/v${esbuild.version}/esbuild.wasm`,
  worker: false,
});
console.timeEnd("init");

const esBuild = async (manifest, config = {}) => {
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

export const dump = async (manifest) => {
  const contents = collectAndCleanScripts();
  const { outputFiles } = await esBuild(manifest, {
    splitting: false,
    stdin: { contents },
    sourcemap: false,
  });
  return outputFiles[0].text;
};

type Glob = (Deno.DirEntry & { path: string })[];

const readDir = async (dir: string | URL) => {
  const results: Deno.DirEntry[] = [];
  if (await Deno.stat(dir).catch(() => false)) {
    for await (const result of Deno.readDir(dir)) results.push(result);
  }
  return results;
};

const asynGlob = async (dir: string | URL, url: URLPattern): Promise<Glob> => {
  const entries = await readDir(dir);
  const results: Glob = [];
  for (const entry of entries) {
    if (entry.isDirectory) {
      const subResults = await asynGlob(`${dir}/${entry.name}`, url);
      results.push(...subResults);
    } else if (entry.name.match(url.pathname)) {
      results.push({ ...entry, path: `${dir}/${entry.name}` });
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

const buildIsland = async (prefix: string, entrypath: string) => {
  const id = `_${getHashSync(await Deno.readTextFile(fromFileUrl(entrypath)))}`;
  const reqpath = join(prefix, `${id}.js`);
  return { id, entrypath, reqpath, outpath: join("dist", reqpath) };
};

const buildOutputFiles = async (
  manifest,
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
      result.outputFiles.map(({ path, contents }) =>
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

export const setup = async (manifest, save = true) => {
  const islands = await Promise.all(
    await asynGlob(
      manifest.islands,
      new URLPattern("*.(t|j)s(x|)", "file://")
    ).then((files) =>
      files.map(async ({ path }) => await buildIsland(manifest.prefix, path))
    )
  );
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
              result.outputFiles.find(
                (file) =>
                  file.path === island?.reqpath ||
                  file.path === new URL(url).pathname
              )?.contents ?? null
            );
          },
        }))),
  };
};