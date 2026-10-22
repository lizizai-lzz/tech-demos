import * as THREE from 'three'

export function createWhiteMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: '#f4f2ee',
    roughness: 0.5,
    metalness: 0.02,
  })
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <output_fragment>',
      `
      float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.7);
      outgoingLight += rim * vec3(0.18, 0.2, 0.24);
      #include <output_fragment>
      `,
    )
  }
  return mat
}
