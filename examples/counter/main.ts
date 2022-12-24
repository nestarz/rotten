import { serve } from "std/http/server.ts";
import { router } from "rutt";
import { withRenderer, withCtx, svgbuild, stylesbuild } from "rotten";
import { islandsRot, stylesRot, staticRot } from "rotten/routes";

import * as stylesGen from "./styles.gen.ts";
import * as Home from "./routes/Home.tsx";

if (!Deno.env.get("DENO_DEPLOYMENT_ID")) {
  await svgbuild({
    outdir: "./components/svg/",
    outfile: "./svg.gen.ts",
    entries: [
      {
        base: "https://esm.sh/remixicon@2.5.0/icons/",
        urls: ["Document/folder-2-line.svg"],
      },
    ],
  });
  await stylesbuild({
    entrydir: new URL("./styles/", import.meta.url),
    outfile: new URL("./styles.gen.ts", import.meta.url),
  });
}

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
    "GET@/styles/*": withCtx(stylesRot.handler)({
      origin: new URL("./styles/", import.meta.url),
      styles,
    }),
    "GET@/*": withCtx(staticRot.handler)({
      origin: new URL("./static/", import.meta.url),
    }),
  }),
  { port: 3003 }
);
