let enc;
let initPromise;

export async function tokenizeText(text) {
  if (!initPromise) {
    initPromise = (async () => {
      const { init, encoding_for_model } = await import("@dqbd/tiktoken/lite/init");
      // Fetch wasm at runtime to avoid bundler parse of .wasm
      const wasm = await fetch("https://unpkg.com/@dqbd/tiktoken@1.0.7/lite/tiktoken_bg.wasm").then(r => r.arrayBuffer());
      await init((imports) => WebAssembly.instantiate(wasm, imports));
      enc = encoding_for_model("gpt-3.5-turbo");
    })();
  }
  await initPromise;

  const ids = enc.encode(text || "");
  return ids.map((id) => ({
    id,
    token: enc.decode([id]),
  }));
}