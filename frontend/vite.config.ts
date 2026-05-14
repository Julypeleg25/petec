import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, searchForWorkspaceRoot } from "vite";

const sharedSourceRoot = path.resolve(__dirname, "../packages/shared/src");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@petec/shared",
        replacement: path.resolve(sharedSourceRoot, "index.ts"),
      },
      {
        find: /^@petec\/shared\/(.*)$/,
        replacement: `${sharedSourceRoot}/$1`,
      },
    ],
  },
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd())],
    },
  },
});
