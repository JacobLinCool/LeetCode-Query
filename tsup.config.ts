import { defineConfig } from "tsup";

export default defineConfig((options) => ({
    entry: ["src/index.ts"],
    outDir: "lib",
    target: "node18",
    format: ["cjs", "esm"],
    clean: true,
    splitting: false,
    dts: options.watch ? false : { resolve: true },
    esbuildOptions(opt) {
        opt.loader = {
            ".graphql": "text",
        };
    },
}));
