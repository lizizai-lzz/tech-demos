import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { SceneRoot } from '@/components/scene/SceneRoot'

export function WarRoomCanvas() {
  return (
    <div className="relative h-full w-full min-h-[320px]">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 42, near: 0.1, far: 40, position: [0, 2.8, 6.2] }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <SceneRoot />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-2 text-center text-[10px] tracking-[0.35em] text-cyan-200/70">
        MASTER SAT · 遥控卫星
      </div>
    </div>
  )
}
