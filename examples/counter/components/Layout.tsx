import * as styles from "../styles.gen.ts";

export default ({ children, styles: css, scriptedGet }) => {
  styles.state.set(styles.Root.className);
  styles.state.set(styles.Layout.className);

  return (
    <html lang="en">
      <head>
        <title>Rotten - Counter</title>
        <style
          dangerouslySetInnerHTML={{
            __html: [...styles.state]
              .flatMap(([className]) =>
                css
                  .filter(({ className: v }) => className === v)
                  .map(({ css }) => css)
              )
              .join("\n"),
          }}
        />
      </head>
      <body class={styles.Layout.className}>
        {children}
        <div id="portal"></div>
        <script
          type="module"
          dangerouslySetInnerHTML={{ __html: scriptedGet() }}
        />
      </body>
    </html>
  );
};
