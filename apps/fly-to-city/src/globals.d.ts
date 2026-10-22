export {}

declare global {
  interface Window {
    __cityReady?: string
    __flyReady?: boolean
    __seek?: (frame: number) => Promise<void>
    __setFacade?: (value: number) => Promise<void>
  }
}
