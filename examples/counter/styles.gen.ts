export const Counter = {"id":"Counter","className":"_505328361"};
export const Layout = {"id":"Layout","className":"_508711974"};
export const Root = {"id":"Root","className":"_1691959736"};
export const state = new Map();
const classs = (...args)=>args.flatMap((object)=>{
                if (!object) return null;
                if (typeof object === "string") return object;
                return Object.entries(object).reduce((str, [name, bool])=>bool && name ? [
                        ...str,
                        name
                    ] : str, []);
            }).filter((v)=>v).join(" ");
export default (...args) => args.forEach(cn => state.set(cn)) ?? classs(...args);
