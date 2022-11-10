export const pascalify = (str: string) =>
  str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match) =>
    +match === 0 ? "" : match.toUpperCase()
  );

export const memo = (fn) => {
  const ns = getHashSync(fn.toString());
  let cache = JSON.parse(globalThis?.Deno?.env?.get(ns) ?? "{}");
  let key;
  const set = (key, value) => (
    globalThis?.Deno?.env?.set?.(
      ns,
      JSON.stringify({ ...cache, [key]: value })
    ) ?? (cache[key] = value),
    value
  );
  return (...args) => {
    key = JSON.stringify(args);
    return cache[key] || set(key, fn.call(null, ...args));
  };
};

export const getHashSync = (str: string) =>
  String(
    str.split("").reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0)
  ).replace(/-/g, "");

const scriptStore = [new Map(), new Map()];
export const cleanShalimar = () => scriptStore.forEach((map) => map.clear());

export const scriptedGlobals = (globals = {}) =>
  Object.entries(globals)
    .map(([k, v]) => [
      k,
      typeof v === "function" ? v.toString() : JSON.stringify(v),
    ])
    .map(([k, v]) => scriptStore[0].set(k, `const ${k} = ${v};`));

export const scriptedGet = () =>
  scriptStore
    .flatMap((d) => d.values())
    .map((d) => [...d])
    .flat()
    .join("\n");

export const scripted = (fn, ...args) => {
  const setFn = (fn) => {
    const id = `_${getHashSync(fn.toString())}`;
    scriptStore[1].set(id, `const fn${id} = ${fn.toString()};`);
    return id;
  };
  const id = setFn(fn);
  const argsStrArr = args.map((v) =>
    typeof v === "function" ? `fn${setFn(v)}` : JSON.stringify(v)
  );
  const argsId = getHashSync(argsStrArr.join(""));
  const elId = [id, argsId].join("_");
  scriptStore[1].set(
    elId,
    `document.querySelectorAll(".${elId}").forEach(${
      argsStrArr.length > 0
        ? `(n) => fn${id}(${["n", ...argsStrArr].join(", ")})`
        : `fn${id}`
    });`
  );
  return elId;
};
