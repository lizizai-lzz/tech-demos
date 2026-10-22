import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

type Props = {
  /** 0 在地球上待命，1 已经飞到目的地 */
  globeU: number
  /** 进城之后收到 1，速度线和云都收掉 */
  arrive: number
}

/**
 * 第一人称冲刺：没有角色。速度线从画面中心（目的地）散开，云层按 globeU 穿过。
 * 姿态只跟镜头进度走，离线逐帧可复现。
 */
function RushQuad({ globeU, arrive }: Props) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useRef({ uU: { value: globeU }, uArrive: { value: arrive } })

  useFrame(() => {
    uniforms.current.uU.value = globeU
    uniforms.current.uArrive.value = arrive
    const live = mat.current?.uniforms
    if (!live) return
    live.uU.value = globeU
    live.uArrive.value = arrive
  })

  return (
    <mesh frustumCulled={false} renderOrder={1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        depthTest={false}
        uniforms={uniforms.current}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uU;
          uniform float uArrive;
          void main() {
            float u = clamp(uU, 0.0, 1.0);
            float speed = sin(u * 3.14159) * (1.0 - clamp(uArrive, 0.0, 1.0));
            vec2 p = vUv * 2.0 - 1.0;
            vec2 d = p;
            float r = length(d);
            float ang = atan(d.y, d.x);
            float spokes = pow(abs(sin(ang * 36.0)), 48.0);
            float lines = spokes * smoothstep(0.12, 0.85, r) * speed * 0.32;

            float clouds = 0.0;
            float shift = (u - 0.3) * 0.55;
            for (int i = 0; i < 3; i++) {
              float fi = float(i);
              float ox = fi < 0.5 ? -0.62 : fi < 1.5 ? 0.22 : 0.64;
              float oy = fi < 0.5 ? 0.36 : fi < 1.5 ? 0.68 : -0.46;
              vec2 c = vec2(ox, oy - shift);
              vec2 q = (p - c) * vec2(3.1, 4.0);
              float lump = sin(q.x * 5.0 + fi * 2.0) * sin(q.y * 4.0 - fi);
              float body = exp(-dot(q, q) * (0.85 + 0.45 * lump));
              float cloud = smoothstep(0.3, 0.84, body);
              clouds = max(clouds, cloud);
            }
            clouds *= (0.72 + speed * 0.22) * (1.0 - clamp(uArrive, 0.0, 1.0));
            float a = clamp(max(lines * 0.9, clouds), 0.0, 0.8);
            gl_FragColor = vec4(0.97, 0.98, 1.0, a);
          }
        `}
      />
    </mesh>
  )
}

export function FlightRush(props: Props) {
  const moving = props.globeU > 0.04 && props.globeU < 0.96 && props.arrive < 0.9
  if (!moving) return null
  return (
    <Canvas
      dpr={1}
      gl={{ antialias: false, alpha: true, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0)
        scene.background = null
      }}
    >
      <RushQuad {...props} />
    </Canvas>
  )
}
