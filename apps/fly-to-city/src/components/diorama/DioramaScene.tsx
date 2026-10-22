import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MapControls, PerspectiveCamera } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import * as THREE from 'three'
import { facadeUniform } from '@/lib/facade-material'
import { heroFocus } from '@/lib/heroes'
import type { CityData } from '@/lib/types'
import { cesiumIonToken } from '@/lib/photoreal-tiles'
import { orbitPose, roamPose, type LocalPose, type RoamMode } from '@/lib/view-pose'
import { Buildings } from './Buildings'
import { Ground } from './Ground'
import { Heroes } from './Heroes'
import { PhotorealTiles } from './PhotorealTiles'
import { Trees } from './Trees'

const ROAM_PERIOD: Record<RoamMode, number> = {
  flyover: 64,
  orbit: 36,
  tour: 56,
  rise: 40,
}

export type CitySceneControls = {
  driven: boolean
  /** 0 白模，1 贴面完全长出 */
  facadeReveal: number
  /** 0 刚落到城市上方，1 收到定稿机位。俯角不变。 */
  arrive: number
  /** 下降段和地图共用的机位。有值时不再用漫游公式。 */
  matched: LocalPose | null
  roamMode: RoamMode
  /** 离线成片的漫游进度。交互时由场景自己累加。 */
  roamU: number
  roaming: boolean
  onStopRoam?: () => void
}

type TileStatus = {
  visible: boolean
  credits: string[]
  failed: boolean
}

type Props = {
  data: CityData
  controls: CitySceneControls
  interactive: boolean
  /** 为真时隐藏程序化建筑、树和地面，改看流式实景。 */
  photoreal?: boolean
  onPhotorealStatus?: (status: TileStatus) => void
}

function shadowMapSize() {
  const n = Number(new URLSearchParams(window.location.search).get('shadow') ?? 4096)
  if (!Number.isFinite(n)) return 4096
  return Math.min(4096, Math.max(512, Math.round(n)))
}

function SkyDome() {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vPos;
          void main() {
            float h = normalize(vPos).y;
            vec3 haze = vec3(0.835, 0.878, 0.918);
            vec3 warm = vec3(0.97, 0.90, 0.78);
            vec3 sky = vec3(0.53, 0.72, 0.88);
            vec3 top = vec3(0.36, 0.58, 0.84);
            float warmBand = smoothstep(0.0, 0.06, h) * (1.0 - smoothstep(0.06, 0.2, h));
            vec3 col = mix(haze, warm, warmBand);
            col = mix(col, sky, smoothstep(0.02, 0.42, h));
            col = mix(col, top, smoothstep(0.38, 1.0, h));
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    [],
  )
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position)
  })
  return (
    <mesh ref={ref} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[9000, 32, 18]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

function applyPose(cam: THREE.PerspectiveCamera, pose: LocalPose) {
  cam.position.set(pose.x, pose.y, pose.z)
  cam.lookAt(pose.lookX, pose.lookY, pose.lookZ)
  if (Math.abs(cam.fov - pose.fov) > 0.05) {
    cam.fov = pose.fov
    cam.updateProjectionMatrix()
  }
  cam.updateMatrixWorld()
}

function SceneContent({ data, controls, interactive, photoreal = false, onPhotorealStatus }: Props) {
  const cam = useRef<THREE.PerspectiveCamera>(null)
  const light = useRef<THREE.DirectionalLight>(null)
  const roamLive = useRef(0)
  const mapRig = useRef<ComponentRef<typeof MapControls>>(null)
  const stopRef = useRef(controls.onStopRoam)
  const { gl } = useThree()
  const focus = heroFocus(data.id, data.center.lng, data.center.lat)
  const token = photoreal ? cesiumIonToken() : ''
  stopRef.current = controls.onStopRoam

  useEffect(() => {
    window.__cityReady = data.id
    roamLive.current = 0
  }, [data.id, controls.roamMode])

  useEffect(() => {
    const el = gl.domElement
    const stop = (event: Event) => {
      if (event.type === 'keydown' && (event as KeyboardEvent).key !== 'Escape') return
      if (controls.driven || !controls.roaming) return
      const camNow = cam.current
      const rig = mapRig.current
      if (camNow && rig) {
        const dir = new THREE.Vector3()
        camNow.getWorldDirection(dir)
        const dist = Math.min(4000, Math.max(80, camNow.position.y / Math.max(0.2, -dir.y)))
        rig.target.copy(camNow.position).addScaledVector(dir, dist)
        rig.target.y = Math.max(0, rig.target.y)
        rig.enabled = true
        rig.update()
      }
      stopRef.current?.()
    }
    const blockMenu = (event: Event) => event.preventDefault()
    el.addEventListener('pointerdown', stop, true)
    el.addEventListener('wheel', stop, { capture: true, passive: true })
    el.addEventListener('contextmenu', blockMenu)
    window.addEventListener('keydown', stop)
    return () => {
      el.removeEventListener('pointerdown', stop, true)
      el.removeEventListener('wheel', stop, { capture: true })
      el.removeEventListener('contextmenu', blockMenu)
      window.removeEventListener('keydown', stop)
    }
  }, [gl, controls.driven, controls.roaming])

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = photoreal ? 1 : 1.16
    gl.shadowMap.enabled = !photoreal
    gl.shadowMap.type = THREE.PCFSoftShadowMap
  }, [gl, photoreal])

  useFrame((_, dt) => {
    if (!cam.current || !light.current) return
    facadeUniform.value = controls.facadeReveal
    const free = interactive && !controls.driven && !controls.roaming
    if (controls.matched) applyPose(cam.current, controls.matched)
    else if (!free) {
      let roamU = controls.roamU
      if (!controls.driven && controls.roaming && controls.arrive >= 0.999) {
        roamLive.current += dt / ROAM_PERIOD[controls.roamMode]
        roamU = roamLive.current
      }
      const pose =
        controls.arrive < 0.999
          ? orbitPose(data.id, 0, 0, controls.arrive, focus)
          : roamPose(data.id, controls.roamMode, roamU, focus)
      applyPose(cam.current, pose)
    }
    const alt = Math.max(30, cam.current.position.y)
    const near = photoreal ? Math.min(20, Math.max(0.4, alt / 400)) : 2
    const far = photoreal ? Math.max(80000, alt * 30) : 14000
    if (cam.current.near !== near || cam.current.far !== far) {
      cam.current.near = near
      cam.current.far = far
      cam.current.updateProjectionMatrix()
    }
    const look = new THREE.Vector3(focus.x, 80, focus.z)
    const sun = new THREE.Vector3(0.72, 1.35, 0.28).normalize()
    light.current.position.copy(look).addScaledVector(sun, 1600)
    light.current.target.position.copy(look)
    light.current.target.updateMatrixWorld()
    const sh = light.current.shadow.camera
    const span = 1600
    sh.left = -span
    sh.right = span
    sh.top = span
    sh.bottom = -span
    sh.near = 400
    sh.far = 3200
    sh.updateProjectionMatrix()
  })

  // 不设正优先级。正优先级会关掉自动 gl.render，而这个回调不负责绘制。
  // MapControls 自己是 -1，默认 0 仍然排在它后面，能把镜头抬回地面以上。
  useFrame(() => {
    if (!cam.current || controls.driven || controls.roaming) return
    if (cam.current.position.y < 36) cam.current.position.y = 36
    const rig = mapRig.current
    if (rig && rig.target.y < 0) rig.target.y = 0
  })

  return (
    <>
      <SkyDome />
      <color attach="background" args={['#d5e0ea']} />
      {!photoreal && <fog attach="fog" args={['#d5e0ea', 3800, 9200]} />}
      <PerspectiveCamera ref={cam} makeDefault fov={42} near={2} far={photoreal ? 800000 : 14000} position={[1600, 780, 1600]} />
      {interactive && !controls.driven && (
        <MapControls
          ref={mapRig}
          enabled={!controls.roaming}
          enableDamping
          dampingFactor={0.08}
          zoomToCursor
          minDistance={40}
          maxDistance={12000}
          minPolarAngle={0.08}
          maxPolarAngle={Math.PI / 2.02}
          target={[focus.x, 40, focus.z]}
        />
      )}
      <ambientLight intensity={0.42} color="#fff3e4" />
      <hemisphereLight args={['#d5e7f8', '#6f8f62', 0.34]} />
      <directionalLight
        ref={light}
        color="#ffe2b0"
        intensity={2.7}
        castShadow={!photoreal}
        shadow-mapSize={[shadowMapSize(), shadowMapSize()]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-800, 300, -400]} intensity={0.16} color="#d7e4f2" />
      {photoreal && token ? (
        <PhotorealTiles
          token={token}
          lng={data.center.lng}
          lat={data.center.lat}
          onStatus={onPhotorealStatus ?? (() => {})}
        />
      ) : (
        <>
          <Ground data={data} />
          <Trees data={data} />
          <Buildings data={data} />
          <Heroes data={data} />
        </>
      )}
      {!photoreal && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={12} intensity={1.15} distanceFalloff={0.6} halfRes />
          <Bloom luminanceThreshold={0.86} luminanceSmoothing={0.28} intensity={0.32} mipmapBlur radius={0.45} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  )
}

export function CityScene(props: Props) {
  return (
    <Canvas
      shadows
      dpr={1}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent {...props} />
    </Canvas>
  )
}
