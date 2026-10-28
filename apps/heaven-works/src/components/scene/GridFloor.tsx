import { Grid } from '@react-three/drei'

export function GridFloor() {
  return (
    <group position={[0, -0.02, 0]} rotation={[0, 0, 0]}>
      <Grid
        infiniteGrid
        cellSize={0.35}
        sectionSize={1.4}
        fadeDistance={14}
        fadeStrength={1.2}
        cellColor="#0d3d44"
        sectionColor="#22d3ee"
        position={[0, 0, 0]}
        args={[10, 10]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[14, 10]} />
        <meshBasicMaterial
          color="#062a30"
          transparent
          opacity={0.35}
          blending={2}
        />
      </mesh>
    </group>
  )
}
