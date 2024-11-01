/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
    readonly VITE_SUPPRESS_PYTHON_WARNINGS: string
    readonly VITE_SUPPRESS_PYTHON_ERRORS: string
    // more env variables...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }