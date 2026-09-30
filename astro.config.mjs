// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://pedromorago.com",
  // The folder CI audits is the folder that gets deployed.
  outDir: "_site",
  trailingSlash: "always",
  // CSS goes inside each page (about 12 KB compressed), so the first paint
  // doesn't wait for a separate stylesheet. The hero fonts are preloaded in
  // Base.astro; without that, the earlier paint made the title jump.
  build: { format: "directory", inlineStylesheets: "always" },
  devToolbar: { enabled: false },
});
