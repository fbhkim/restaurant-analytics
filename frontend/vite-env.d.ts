/// <reference types="vite/client" />

declare module '*.tsx' {
  const content: React.ComponentType<any>
  export default content
}

declare module '*.ts' {
  const content: any
  export default content
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Adicione outras variáveis de ambiente aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}