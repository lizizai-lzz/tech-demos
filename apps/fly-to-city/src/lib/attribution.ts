/**
 * 署名默认关闭，开发和预览保持干净画面。
 * 地址栏 `?attribution=1` 优先于环境变量；`?attribution=0` 可以强制关掉。
 * 公开发布的视频和对外部署必须打开。
 */
export function showAttribution() {
  const flag = new URLSearchParams(window.location.search).get('attribution')
  if (flag === '1' || flag === 'true' || flag === 'on') return true
  if (flag === '0' || flag === 'false' || flag === 'off') return false
  return import.meta.env.VITE_SHOW_ATTRIBUTION === '1'
}
