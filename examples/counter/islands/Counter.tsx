import {
  h,
  hydrate,
} from "https://esm.sh/stable/preact@10.11.3/es2022/preact.js";
export { h, hydrate };
import { useState } from "https://esm.sh/stable/preact@10.11.3/es2022/hooks.js";
import { Folder2Line } from "../svg.gen.ts";
import classs, { Counter } from "../styles.gen.ts";
const IS_BROWSER: boolean = !!globalThis?.Deno;

interface CounterProps {
  start: number;
}

export default (props: CounterProps) => {
  const [count, setCount] = useState(props.start);
  return (
    <div className={classs(props.className, Counter.className)}>
      <Folder2Line h={h} />
      <p>{count}</p>
      <button onClick={() => setCount(count - 1)} disabled={!IS_BROWSER}>
        -1
      </button>
      <button onClick={() => setCount(count + 1)} disabled={!IS_BROWSER}>
        +1
      </button>
    </div>
  );
};
