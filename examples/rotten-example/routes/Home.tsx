import Layout from "../components/Layout.tsx";

export const handler = (_, ctx) => ctx.render({ lol: 1 });
export const Wrapper = (props) => <Layout {...props} />;
export default ({ data }) => JSON.stringify(data);
