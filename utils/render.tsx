import { render as renderSSR } from "preact-render-to-string";
import { scripted } from "./shalimar.ts";
export { scripted, scriptedGet } from "./shalimar.ts";

export const hydrate = (...props) =>
  scripted((node, island, props, children) => {
    import("/islands/preact.js").then(({ createElement: h, hydrate }) =>
      import(`/islands/${island}.js`).then(({ default: C }) => {
        const wrapper = document.createElement("fragment");
        node.parentNode.insertBefore(wrapper, node);
        wrapper.appendChild(node);
        hydrate(h(C, props, children), wrapper);
        wrapper.childNodes.forEach((node) => wrapper.before(node));
        wrapper.remove();
      })
    );
  }, ...props);

export default (Component) =>
  ({ Wrapper, ...props }) => {
    const key = "__BODY_INCLUDE__";
    const app = renderSSR(<Component data={props.data} />);
    const W = Wrapper ?? (({ children }) => <html>{children}</html>);
    return new Response(renderSSR(<W {...props}>{key}</W>).replace(key, app), {
      headers: { "content-type": "text/html" },
    });
  };
