import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { SceneRoot } from '@/components/scene/SceneRoot'

export function WarRoomCanvas() {
  return (
    <div className="relative h-full w-full min-h-[320px] bg-[#030508]">
      <Canvas
        dpr={[1, 1.25]}
        camera={{ fov: 38, near: 0.1, far: 45, position: [0.15, 2.65, 7.4] }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        performance={{ min: 0.85 }}
      >
        <Suspense fallback={null}>
          <SceneRoot />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-1 text-center text-[9px] tracking-[0.4em] text-slate-400/90">
        MASTER SAT · 遥控卫星
      </div>
    </div>
  )
}
