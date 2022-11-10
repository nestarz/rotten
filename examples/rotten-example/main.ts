import { serve } from "std/http/server.ts";
import { router } from "rutt";
import { withRenderer, withCtx } from "rotten";
import { islandsRot, stylesRot, staticRot } from "rotten/routes";

import * as stylesGen from "./styles.gen.ts";
import * as Home from "./routes/Home.tsx";

const styles = await stylesRot.setup({
  stylesGen,
  base: new URL("./", import.meta.url),
});

await serve(
  router({
    "GET@/": withRenderer(Home, { styles }),
    "GET@/islands/*": withCtx(islandsRot.handler)(
      await islandsRot.setup({
        importMapURL: new URL("./import_map.json", import.meta.url),
        origin: new URL("./islands/", import.meta.url),
      })
    ),
    "GET@/styles/*": withCtx(stylesRot.handler)(styles),
    "GET@/*": withCtx(staticRot.handler)({
      origin: new URL("./static/", import.meta.url),
    }),
  }),
  { port: 3002 }
);
