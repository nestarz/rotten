import { scripted } from "./shalimar.ts";
export { scripted, scriptedGet } from "./shalimar.ts";

export const hydrate = (...props) =>
  scripted((node, island, props, children) => {
    import(`/islands/${island}.js`).then(({ default: C, h, hydrate }) => {
      const wrapper = document.createElement("fragment");
      node.parentNode.insertBefore(wrapper, node);
      wrapper.appendChild(node);
      hydrate(h(C, props, children), wrapper);
      wrapper.childNodes.forEach((node) => wrapper.before(node));
      wrapper.remove();
    });
  }, ...props);

export default (
    Component,
    { render, transformBody = (app) => app.replace(/\n/g, "\n\t\t") }
  ) =>
  ({ Wrapper, ...props }) => {
    const key = "__BODY_INCLUDE__";
    const app = render(<Component data={props.data} />);
    const W = Wrapper ?? (({ children }) => <html>{children}</html>);
    return new Response(
      render(<W {...props}>{key}</W>).replace(key, transformBody(app)),
      { headers: { "content-type": "text/html" } }
    );
  };
