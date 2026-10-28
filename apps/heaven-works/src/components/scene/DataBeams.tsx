import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type BeamLink = {
  agent: THREE.Vector3
  card: THREE.Vector3
  target: THREE.Vector3
}

type Props = {
  links: BeamLink[]
}

export function DataBeams({ links }: Props) {
  return (
    <group>
      {links.map((link, i) => (
        <BeamPair key={i} link={link} phase={i * 0.35} />
      ))}
    </group>
  )
}

function BeamPair({ link, phase }: { link: BeamLink; phase: number }) {
  const upper = useMemo(
    () => new THREE.Vector3().lerpVectors(link.agent, link.card, 0.5),
    [link.agent, link.card],
  )
  const lowerMid = useMemo(
    () => new THREE.Vector3().lerpVectors(link.card, link.target, 0.45),
    [link.card, link.target],
  )

  return (
    <>
      <AnimatedBeam from={link.agent} to={link.card} color="#a5f3fc" phase={phase} />
      <AnimatedBeam
        from={link.card}
        to={link.target}
        color="#e879f9"
        phase={phase + 1.2}
        thin
      />
      <PulseDot position={upper} phase={phase} color="#22d3ee" />
      <PulseDot position={lowerMid} phase={phase + 0.5} color="#facc15" />
    </>
  )
}

function AnimatedBeam({
  from,
  to,
  color,
  phase,
  thin,
}: {
  from: THREE.Vector3
  to: THREE.Vector3
  color: string
  phase: number
  thin?: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  const dir = useMemo(() => new THREE.Vector3().subVectors(to, from), [from, to])
  const length = dir.length()
  const mid = useMemo(
    () => new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5),
    [from, to],
  )
  const quat = useMemo(() => {
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    q.setFromUnitVectors(up, dir.clone().normalize())
    return q
  }, [dir])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.25 + Math.sin(clock.elapsedTime * 2 + phase) * 0.15
  })

  return (
    <mesh ref={ref} position={mid} quaternion={quat}>
      <cylinderGeometry args={[thin ? 0.008 : 0.014, thin ? 0.004 : 0.008, length, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} blending={2} />
    </mesh>
  )
}

function PulseDot({
  position,
  phase,
  color,
}: {
  position: THREE.Vector3
  phase: number
  color: string
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.elapsedTime + phase) % 1
    ref.current.position.lerpVectors(
      position,
      position.clone().add(new THREE.Vector3(0, -0.5, 0)),
      t,
    )
    ref.current.visible = t < 0.85
  })

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} blending={2} />
    </mesh>
  )
}
