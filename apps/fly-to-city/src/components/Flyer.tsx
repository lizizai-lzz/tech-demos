import { PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  globeU: number
  arrive: number
  /** 小于 0 用实时时钟；离线渲染传入镜头时间，披风和待机可复现 */
  flightClock: number
}

function smooth(a: number, b: number, t: number) {
  const u = Math.min(1, Math.max(0, (t - a) / Math.max(0.0001, b - a)))
  return u * u * (3 - 2 * u)
}

function makeMats() {
  const suit = new THREE.MeshStandardMaterial({ color: '#2f74b8', roughness: 0.4, metalness: 0.08 })
  const cape = new THREE.MeshStandardMaterial({
    color: '#d6453a',
    roughness: 0.55,
    side: THREE.DoubleSide,
  })
  const scarf = new THREE.MeshStandardMaterial({
    color: '#f3e2c4',
    roughness: 0.5,
    side: THREE.DoubleSide,
  })
  const skin = new THREE.MeshStandardMaterial({ color: '#e4b898', roughness: 0.62 })
  const visor = new THREE.MeshStandardMaterial({
    color: '#b9ecff',
    emissive: '#7ec8ff',
    emissiveIntensity: 0.55,
    roughness: 0.12,
    metalness: 0.35,
  })
  const dark = new THREE.MeshStandardMaterial({ color: '#141820', roughness: 0.4 })
  const gold = new THREE.MeshStandardMaterial({ color: '#e2b15a', roughness: 0.35, metalness: 0.45 })
  return [suit, cape, scarf, skin, visor, dark, gold]
}

function FlyerScene({ globeU, arrive, flightClock }: Props) {
  const cam = useRef<THREE.PerspectiveCamera>(null)
  const body = useRef<THREE.Group>(null)
  const capes = useRef<Array<THREE.Mesh | null>>([])
  const lines = useRef<THREE.InstancedMesh>(null)
  const clouds = useRef<Array<THREE.Mesh | null>>([])
  const mats = useMemo(() => makeMats(), [])
  const streakUniforms = useMemo(() => ({ uSpeed: { value: 0 } }), [])
  const cloudUniforms = useMemo(
    () => [0, 1, 2, 3].map(() => ({ uAlpha: { value: 0 } })),
    [],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const lineSeeds = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const ang = (i / 36) * Math.PI * 2 + (i % 3) * 0.2
        const rad = 1.8 + (i % 6) * 0.42
        return {
          x: Math.cos(ang) * rad,
          y: Math.sin(ang) * rad * 0.62 + 0.4,
          z0: (i * 1.37) % 14,
          len: 1.4 + (i % 4) * 0.45,
        }
      }),
    [],
  )

  useEffect(() => {
    return () => {
      mats.forEach((m) => m.dispose())
    }
  }, [mats])

  const [suit, cape, scarf, skin, visor, dark, gold] = mats

  useFrame((state) => {
    const t = flightClock >= 0 ? flightClock : state.clock.elapsedTime
    const speed = Math.sin(Math.min(1, Math.max(0, globeU)) * Math.PI) * (1 - Math.min(1, arrive))
    const idle = 1 - Math.min(1, speed * 1.5 + arrive * 0.35)
    const bob = Math.sin(t * 1.7) * 0.09 * idle
    const roll = Math.sin(t * 1.15) * 0.08 * idle
    const bank = Math.sin(globeU * Math.PI) * 0.62 * (1 - arrive)
    const turn = globeU < 0.02 ? Math.sin(t * 0.6) * 0.1 : (1 - smooth(0, 0.24, globeU)) * 0.75
    const exit = smooth(0.18, 0.96, arrive)
    const opacity = 1 - smooth(0.64, 0.98, arrive)
    const fade = opacity < 0.995
    for (const m of mats) {
      if (m.transparent !== fade) m.transparent = fade
      m.opacity = opacity
      m.depthWrite = !fade
    }
    if (body.current) {
      body.current.position.set(exit * 5.2, bob + exit * 1.55, exit * 0.2)
      body.current.rotation.order = 'YXZ'
      body.current.rotation.y = turn
      body.current.rotation.z = bank + roll - exit * 0.45
      body.current.rotation.x = speed * 0.42 + Math.sin(Math.min(1, arrive) * Math.PI) * 0.32
    }
    capes.current.forEach((mesh, i) => {
      if (!mesh) return
      const side = i % 4
      const flap = Math.sin(t * 7.2 + side + i * 0.4) * (0.07 + speed * 0.2)
      const yaw = i < 4 ? 0.42 : i < 8 ? -0.42 : 0
      mesh.rotation.x = -0.95 + flap
      mesh.rotation.z = yaw + Math.sin(t * 5 + side) * 0.05
    })
    streakUniforms.uSpeed.value = speed
    const lineMesh = lines.current
    if (lineMesh) {
      const mat = lineMesh.material as THREE.MeshBasicMaterial
      mat.opacity = speed * 0.8
      lineSeeds.forEach((seed, i) => {
        const z = (((seed.z0 - globeU * 36) % 14) + 14) % 14 - 12
        dummy.position.set(seed.x, seed.y, z)
        dummy.scale.set(0.035, 0.035, seed.len * (0.6 + speed))
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        lineMesh.setMatrixAt(i, dummy.matrix)
      })
      lineMesh.instanceMatrix.needsUpdate = true
    }
    clouds.current.forEach((mesh, i) => {
      if (!mesh) return
      const pass = smooth(0.08, 0.9, globeU)
      mesh.position.z = 10 - pass * 18 - i * 1.6
      mesh.position.x = (i - 1.5) * 4.8
      mesh.position.y = 1.8 + (i % 2) * 0.8
      cloudUniforms[i].uAlpha.value = speed * 0.28
    })
    const camera = cam.current
    if (!camera) return
    camera.fov = 30 + speed * 12
    camera.position.set(
      bank * 0.22 + Math.sin(t * 37) * speed * 0.04,
      1.32 + Math.cos(t * 29) * speed * 0.03,
      5.15 - speed * 0.45,
    )
    camera.lookAt(exit * 0.7, 0.92, -0.15)
    camera.updateProjectionMatrix()
  })

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={30} near={0.1} far={40} position={[0, 1.32, 5.15]} />
      <ambientLight intensity={0.7} color="#f7f5f0" />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#fff2df" />
      <directionalLight position={[-3, 1.5, -2]} intensity={0.7} color="#9ec4ff" />
      <mesh renderOrder={-2} frustumCulled={false}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          depthTest={false}
          uniforms={streakUniforms}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position.xy, 0.0, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            uniform float uSpeed;
            void main() {
              vec2 p = vUv * 2.0 - 1.0;
              float ang = atan(p.y, p.x);
              float r = length(p);
              float spokes = pow(abs(sin(ang * 26.0)), 18.0);
              float mask = smoothstep(0.18, 0.95, r);
              float a = spokes * mask * uSpeed * 0.55;
              gl_FragColor = vec4(0.96, 0.98, 1.0, a);
            }
          `}
        />
      </mesh>
      <instancedMesh ref={lines} args={[undefined, undefined, lineSeeds.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#f7fbff" transparent opacity={0} depthWrite={false} />
      </instancedMesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(node) => {
            clouds.current[i] = node
          }}
          position={[0, 1, 12]}
          renderOrder={-1}
        >
          <planeGeometry args={[3.2, 1.5]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            uniforms={cloudUniforms[i]}
            vertexShader={`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              varying vec2 vUv;
              uniform float uAlpha;
              void main() {
                vec2 p = (vUv - 0.5) * vec2(1.5, 1.0);
                float d = length(p);
                float a = smoothstep(0.62, 0.18, d) * smoothstep(0.0, 0.2, d) * uAlpha;
                gl_FragColor = vec4(1.0, 1.0, 1.0, a);
              }
            `}
          />
        </mesh>
      ))}
      <group ref={body}>
        <mesh position={[0, 1.02, 0]} material={suit} castShadow>
          <capsuleGeometry args={[0.2, 0.48, 4, 10]} />
        </mesh>
        <mesh position={[0, 1.08, 0.2]} material={gold}>
          <circleGeometry args={[0.09, 14]} />
        </mesh>
        <mesh position={[0, 0.74, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}>
          <torusGeometry args={[0.2, 0.028, 6, 14]} />
        </mesh>
        <mesh position={[0, 1.52, -0.02]} material={skin}>
          <sphereGeometry args={[0.155, 16, 12]} />
        </mesh>
        <mesh position={[0, 1.58, 0.03]} material={suit}>
          <sphereGeometry args={[0.175, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        </mesh>
        <mesh position={[0, 1.52, -0.13]} material={visor}>
          <sphereGeometry args={[0.1, 12, 8]} />
        </mesh>
        <group position={[-0.26, 1.18, -0.02]} rotation={[1.35, 0.25, 0.45]}>
          <mesh position={[0, -0.34, 0]} material={suit}>
            <capsuleGeometry args={[0.07, 0.46, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.64, 0]} material={dark}>
            <sphereGeometry args={[0.085, 10, 8]} />
          </mesh>
        </group>
        <group position={[0.26, 1.18, -0.02]} rotation={[1.35, -0.25, -0.45]}>
          <mesh position={[0, -0.34, 0]} material={suit}>
            <capsuleGeometry args={[0.07, 0.46, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.64, 0]} material={dark}>
            <sphereGeometry args={[0.085, 10, 8]} />
          </mesh>
        </group>
        <group position={[-0.09, 0.58, 0.02]} rotation={[0.85, 0.04, 0.06]}>
          <mesh position={[0, -0.28, 0]} material={suit}>
            <capsuleGeometry args={[0.08, 0.34, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.5, 0.02]} material={dark}>
            <boxGeometry args={[0.12, 0.08, 0.2]} />
          </mesh>
        </group>
        <group position={[0.09, 0.58, 0.02]} rotation={[0.85, -0.04, -0.06]}>
          <mesh position={[0, -0.28, 0]} material={suit}>
            <capsuleGeometry args={[0.08, 0.34, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.5, 0.02]} material={dark}>
            <boxGeometry args={[0.12, 0.08, 0.2]} />
          </mesh>
        </group>
        {Array.from({ length: 4 }, (_, i) => (
          <mesh
            key={`cape-l-${i}`}
            ref={(node) => {
              capes.current[i] = node
            }}
            position={[-0.28 - i * 0.03, 1.02 - i * 0.04, 0.2 + i * 0.18]}
            material={cape}
          >
            <planeGeometry args={[0.36, 0.32]} />
          </mesh>
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <mesh
            key={`cape-r-${i}`}
            ref={(node) => {
              capes.current[4 + i] = node
            }}
            position={[0.28 + i * 0.03, 1.02 - i * 0.04, 0.2 + i * 0.18]}
            material={cape}
          >
            <planeGeometry args={[0.36, 0.32]} />
          </mesh>
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <mesh
            key={`scarf-${i}`}
            ref={(node) => {
              capes.current[8 + i] = node
            }}
            position={[0.02, 1.22 - i * 0.03, 0.16 + i * 0.16]}
            material={scarf}
          >
            <planeGeometry args={[0.16, 0.34]} />
          </mesh>
        ))}
      </group>
    </>
  )
}

/** 第三人称追逐层。透明画布盖在地球和城市上，截图能一起截到。 */
export function Flyer(props: Props) {
  return (
    <Canvas
      dpr={1}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0)
        scene.background = null
      }}
    >
      <FlyerScene {...props} />
    </Canvas>
  )
}
