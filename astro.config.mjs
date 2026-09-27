// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://pedromorago.com",
  // The folder CI audits is the folder that gets deployed.
  outDir: "_site",
  trailingSlash: "always",
  build: { format: "directory" },
  devToolbar: { enabled: false },
});
