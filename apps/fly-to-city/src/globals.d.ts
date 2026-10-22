export {}

declare global {
  interface Window {
    __cityReady?: string
    __flyReady?: boolean
    __seek?: (frame: number) => Promise<void>
    __setFacade?: (value: number) => Promise<void>
    __showCity?: (id: string) => Promise<void>
    __CESIUM_ION_TOKEN?: string
    /** true 表示这一帧可以截图：实景已稳定，或这一帧本来就不是实景 */
    __photorealReady?: boolean
    __photorealVisible?: boolean
    __photorealRootLoads?: number
  }
}
