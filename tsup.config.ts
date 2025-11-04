import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  clean: true,
  format: ["esm", "cjs"],
  sourcemap: true,
  treeshake: true,
  target: "node20",
  platform: "node",
  outDir: "dist",
  minify: false,
  splitting: false,
  shims: false,
  esbuildOptions(options) {
    // Ensure .ts extension imports are handled correctly
    options.resolveExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];
  },
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".js",
    };
  },
});
