// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://pedromorago.com",
  // The folder CI audits is the folder that gets deployed.
  outDir: "_site",
  trailingSlash: "always",
  // CSS goes inside each page: about 12 KB compressed, and the first paint
  // no longer waits for a separate stylesheet (about 0.6 s on slow mobile).
  build: { format: "directory", inlineStylesheets: "always" },
  devToolbar: { enabled: false },
});
