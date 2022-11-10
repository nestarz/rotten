export const Layout = {"name":"Layout.css","id":"Layout","path":"./styles/Layout.css","className":"_1577581701"};
export const Root = {"name":"Root.css","id":"Root","path":"./styles/Root.css","className":"_1174077373"};
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
