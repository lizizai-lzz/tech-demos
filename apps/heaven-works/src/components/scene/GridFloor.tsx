import { Grid } from '@react-three/drei'

export function GridFloor() {
  return (
    <group position={[0, 0, 0]}>
      <Grid
        infiniteGrid
        cellSize={0.4}
        sectionSize={1.6}
        fadeDistance={16}
        fadeStrength={1.35}
        cellColor="#1e3a3f"
        sectionColor="#5eead4"
        position={[0, 0.001, 0]}
        args={[12, 12]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshBasicMaterial color="#052028" transparent opacity={0.25} />
      </mesh>
    </group>
  )
}
