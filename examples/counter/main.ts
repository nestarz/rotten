import { serve } from "std/http/server.ts";
import { router } from "rutt";
import { withRenderer, readdir } from "rotten";
import { islandsRot, stylesRot, staticRot } from "rotten/routes";

import * as Home from "./routes/Home.tsx";

const styles = await stylesRot.setup({
  entryPoints: await readdir(new URL("./styles/", import.meta.url)),
});

const islands = await islandsRot.setup({
  importMapURL: new URL("./import_map.json", import.meta.url),
  origin: new URL("./islands/", import.meta.url),
});

await serve(
  router({
    "GET@/": withRenderer(Home, { styles }),
    "GET@/islands/*": (req: Request) => islandsRot.handler(req, islands),
    "GET@/styles/*": (req: Request) => stylesRot.handler(req, styles),
    "GET@/*": (req: Request) =>
      staticRot.handler(req, { origin: new URL("./static/", import.meta.url) }),
  }),
  { port: 3003 }
);
