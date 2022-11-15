const tm = Deno.makeTempDirSync;
Deno.makeTempDirSync = (...props) => {
  console.log(new Error().stack.split("\n")[2].trim().split(" ")[1]);
  console.log("Deno.makeTempDirSync", props);
  return tm(...props);
};

export * as islandsRot from "./islands.ts";
export * as staticRot from "./static.ts";
export * as stylesRot from "./styles.ts";
