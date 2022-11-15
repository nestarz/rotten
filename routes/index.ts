const tm = Deno.makeTempDirSync;
Deno.makeTempDirSync = function (...props) {
  console.log(new Error().stack.split("\n")[2].trim().split(" ")[1]);
  console.log("Deno.makeTempDirSync", props);
  this.deno = Deno;
};

export * as islandsRot from "./islands.ts";
export * as staticRot from "./static.ts";
export * as stylesRot from "./styles.ts";
