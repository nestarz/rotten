export type DeepObject = {
  [key: string]: unknown;
};
export const deepApplyFunction = (
  fn: (func: Function) => Function,
  obj: DeepObject
): DeepObject => {
  const applyFn = (value: unknown): unknown => {
    if (typeof value === "function") return fn(value);
    if (typeof value === "object" && value !== null && !Array.isArray(value))
      return deepApplyFunction(fn, value as DeepObject);
    return value;
  };
  const newObj: DeepObject = {};
  for (const key in obj) newObj[key] = applyFn(obj[key]);
  return newObj;
};

export type MiddlewareFunction = (
  req: Request
) => Promise<Response | undefined> | Response | undefined;

export const middleware =
  (...fns: MiddlewareFunction[]) =>
  async (req: Request): Promise<Response> => {
    for (const fn of fns) {
      const result = await fn(req);
      if (result !== undefined) return result;
    }
    return new Response(null, { status: 404 });
  };

export default middleware;
