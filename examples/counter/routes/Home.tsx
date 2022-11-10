import { hydrate } from "rotten";
import Counter from "../islands/Counter.tsx";
import Layout from "../components/Layout.tsx";

export const handler = (_, ctx) => ctx.render({ start: 3 });
export const Wrapper = (props) => <Layout {...props} />;

export default function Home({ data: { start } }) {
  return (
    <div>
      <p>
        Welcome to Rotten. Try to update this message in the ./routes/index.tsx
        file, and refresh.
      </p>
      <Counter start={3} className={hydrate("Counter", { start })} />
    </div>
  );
}
