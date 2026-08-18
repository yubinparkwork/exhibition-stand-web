import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/exhibition-stand-web/",
  plugins: [react()],
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
    sourcemap: false,
  },
});
