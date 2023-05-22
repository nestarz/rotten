class SuffixTransformStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(suffix: string) {
    super({
      flush(controller) {
        controller.enqueue(new TextEncoder().encode(suffix));
        controller.terminate();
      },
    });
  }
}

export const injectStream = (stream: ReadableStream, suffix: string) =>
  stream.pipeThrough(new SuffixTransformStream(suffix));

export const doctype =
  (attrs: string[] = ["html"]) =>
  (htmlOrStream: string | ReadableStream) => {
    const suffix = `<!DOCTYPE ${attrs.join(" ")}>`;
    return htmlOrStream instanceof ReadableStream
      ? injectStream(htmlOrStream, suffix)
      : `${suffix}${htmlOrStream}`;
  };

export default doctype;
