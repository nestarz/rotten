[Documentation](#-documentation) | [Getting started](#-getting-started)

### Warning

Do not use in production, prefer [fresh](https://github.com/denoland/fresh) from denoland if you need support

# rotten

<img align="right" src="./examples/counter/static/favicon.svg" height="150px" alt="the rotten logo: a rotten sliced lemon dripping with juice">

**Rotten** is a next generation web framework, built for speed, reliability, and
simplicity.

Some stand-out features:

- Just-in-time rendering on the edge.
- Island based client hydration for maximum interactivity.
- Zero runtime overhead: no JS is shipped to the client by default.
- No build step.
- No configuration necessary.
- TypeScript support out of the box.
- Scoped CSS support with opt-in api.
- SVG support support with opt-in api.

## Why ?

I loved _fresh_ but wanted a first-class CSS support, test other frameworks than preact, lower the cold start, a more simple api for islands and more. I ended doing a complete rewrite of fresh from scratch so I can tweak it myself but the same idea is here.

## Basic usage

```tsx
import { serve } from "https://deno.land/std/http/server.ts";
import { router } from "https://deno.land/rutt/mod.ts";
import { withRenderer, withCtx } from "https://deno.land/x/rotten/mod.ts";
import { islandsRot, staticRot } from "https://deno.land/x/rotten/routes.ts";

await serve(
  router({
    "GET@/": withRenderer({
      handler: (req: Request, ctx: Context) => ctx.render({ foo: 1 }),
      Wrapper: ({ children }) => <body>{children}</body>,
      default: ({ data: { foo } }) => <div>{foo}</div>,
    }),
    "GET@/islands/*": withCtx(islandsRot.handler)(
      await islandsRot.setup({
        importMapURL: new URL("./import_map.json", import.meta.url),
        origin: new URL("./islands/", import.meta.url),
      })
    ),
    "GET@/*": withCtx(staticRot.handler)({
      origin: new URL("./static/", import.meta.url),
    }),
  }),
  { port: 3000 }
);
```
