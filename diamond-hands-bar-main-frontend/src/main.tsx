import { Buffer } from "buffer";
import { createRoot } from "react-dom/client";
import "./index.css";

const globalObj: typeof globalThis & { Buffer?: typeof Buffer } = globalThis as never;
if (!globalObj.Buffer) {
  globalObj.Buffer = Buffer;
}

const rootElement = document.getElementById("root");

const loadApp = async () => {
  const { default: App } = await import("./App");
  createRoot(rootElement!).render(<App />);
};

loadApp();
