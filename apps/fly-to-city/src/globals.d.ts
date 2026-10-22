export {}

declare global {
  interface Window {
    __cityReady?: string
    __flyReady?: boolean
    __seek?: (frame: number) => Promise<void>
    __setFacade?: (value: number) => Promise<void>
    __showCity?: (id: string) => Promise<void>
    __preloadPhotoreal?: () => Promise<void>
    __CESIUM_ION_TOKEN?: string
    /** true 表示这一帧可以截图：实景已稳定，或这一帧本来就不是实景 */
    __photorealReady?: boolean
    __photorealVisible?: boolean
    /** 可见瓦片里至少有一块网格真正落在当前镜头里 */
    __photorealOnScreen?: boolean
    __photorealRootLoads?: number
    /** 当前城市已经看到高细节建筑网格 */
    __photorealBuilding?: boolean
  }
}
