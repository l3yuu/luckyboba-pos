/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'react-simple-keyboard/build/css/index.css' {
  const content: string;
  export default content;
}
