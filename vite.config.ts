import tailwindcss from "@tailwindcss/vite";
import process from "node:process";
import { defineConfig } from "vite-plus";

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [tailwindcss()],
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    ignorePatterns: ["dist/**"],
    options: { typeAware: true, typeCheck: true },
  },
});
