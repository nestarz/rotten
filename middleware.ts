import type {
  MatchHandler,
  HandlerContext,
} from "https://deno.land/x/rutt@0.1.0/mod.ts";

export type DeepObject = {
  [key: string]: unknown;
};
export const deepApplyFunction = (
  fn: (func: Function) => Function,
  obj: DeepObject
): DeepObject => {
  const applyFn = (value: unknown, key: string): unknown => {
    if (typeof value === "function") return fn(value, key);
    if (typeof value === "object" && value !== null && !Array.isArray(value))
      return deepApplyFunction(fn, value as DeepObject);
    return value;
  };
  const newObj: DeepObject = {};
  for (const key in obj) newObj[key] = applyFn(obj[key], key);
  return newObj;
};

export type MiddlewareFunction = (
  req: Request
) => Promise<Response | undefined> | Response | undefined;

export const middleware =
  <T>(...fns: MatchHandler<T>[]) =>
  async (
    req: Request,
    ctx: HandlerContext<T>,
    matcher: Record<string, string>
  ): Promise<Response> => {
    for (const fn of fns) {
      const result = await fn(req, ctx, matcher);
      if (result !== undefined) return result;
    }
    return new Response(null, { status: 404 });
  };

export type Next = { next: () => Response | Promise<Response> };

export const middlewareWithNext =
  (...fns: MatchHandler<Next>[]) =>
  async (
    req: Request,
    ctx: HandlerContext<Next>,
    matcher: Record<string, string>
  ): Promise<Response> => {
    const createNext = (ctx: HandlerContext<Next>, i: number) => ({
      ...(ctx ?? {}),
      next: (): Response | Promise<Response> =>
        fns[i](req, createNext(ctx, i + 1), matcher),
    });
    return await fns[0]?.(req, createNext(ctx, 1), matcher);
  };

export default middleware;
