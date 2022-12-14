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
- **Scoped CSS support with opt-in api**.
- **SVG support support with opt-in api.**
- **Less opinionated than Fresh (preact isn't the standard)**

## Why ?

I loved _fresh_ but wanted a first-class CSS support, test other frameworks than preact, lower the cold start, a more simple api for islands and more. I ended doing a complete rewrite of fresh from scratch so I can tweak it myself but the same idea is here.

## Basic usage

```tsx
// ./islands/Counter.tsx
import { useState } from "https://esm.sh/preact@10.11.3/hooks";
import { h, hydrate } from "https://esm.sh/preact@10.11.3/preact.js";
export { h, hydrate };

export default (props) => {
  const [count, setCount] = useState(props.start);
  return (
    <div className={props.className}>
      <p>{count}</p>
      <button onClick={() => setCount(count - 1)}>-1</button>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
};

// main.ts
import { render } from "https://esm.sh/preact-render-to-string";
import { serve } from "https://deno.land/std/http/server.ts";
import { router } from "https://deno.land/rutt/mod.ts";
import { withRenderer, hydrate, } from "https://deno.land/x/rotten/mod.ts";
import { islandsRot, staticRot } from "https://deno.land/x/rotten/routes/index.ts";
import Counter from "./islands/Counter.tsx";

await serve(
  router({
    "GET@/": withRenderer({
      render,
      handler: (req: Request, ctx: Context) => ctx.render({ start: 1 }),
      Wrapper: ({ children }) => <body>{children}</body>,
      default: ({ data }) => (
        <Counter {...data} className={hydrate("Counter", data)} />
      ),
    }),
    "GET@/islands/*": (req: Request) =>
      islandsRot.handler(req, {
        importMapURL: new URL("./import_map.json", import.meta.url),
        origin: new URL("./islands/", import.meta.url),
      }),
    "GET@/*": (req: Request) =>
      staticRot.handler(req, { origin: new URL("./static/", import.meta.url) }),
  }),
  { port: 3000 }
);
```
