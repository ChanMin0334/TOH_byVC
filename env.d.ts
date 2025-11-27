interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ADOTX_API_KEY?: string;
  readonly VITE_ADOTX_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.png' {
  const value: string;
  export default value;
}
