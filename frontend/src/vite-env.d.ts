/// <reference types="vite/client" />

type SharedNodeEnv = import("@petec/shared").NodeEnv;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly MODE: SharedNodeEnv;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
