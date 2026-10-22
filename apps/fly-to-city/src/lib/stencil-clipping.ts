import * as THREE from 'three'

/** 在裁剪面上生成 stencil 标记（three.js clipping stencil 示例同款） */
export function createStencilGroup(
  geometry: THREE.BufferGeometry,
  plane: THREE.Plane,
  renderOrder = 1,
) {
  const group = new THREE.Group()
  const base = new THREE.MeshBasicMaterial({
    depthWrite: false,
    depthTest: false,
    colorWrite: false,
    stencilWrite: true,
    stencilFunc: THREE.AlwaysStencilFunc,
  })

  const back = base.clone()
  back.side = THREE.BackSide
  back.clippingPlanes = [plane]
  back.stencilZPass = THREE.IncrementWrapStencilOp

  const front = base.clone()
  front.side = THREE.FrontSide
  front.clippingPlanes = [plane]
  front.stencilZPass = THREE.DecrementWrapStencilOp

  const m0 = new THREE.Mesh(geometry, back)
  const m1 = new THREE.Mesh(geometry, front)
  m0.renderOrder = renderOrder
  m1.renderOrder = renderOrder
  group.add(m0, m1)
  return group
}

export function createCapMaterial(floorSpacing = 3.5, strata = false) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    stencilWrite: true,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilRef: 0,
    stencilZPass: THREE.ReplaceStencilOp,
    uniforms: {
      uFloor: { value: floorSpacing },
      uStrata: { value: strata ? 1 : 0 },
      uColor: { value: new THREE.Color('#e85d2a') },
      uLine: { value: new THREE.Color('#c44a1f') },
      uStrataColors: {
        value: [
          new THREE.Color('#c4a574'),
          new THREE.Color('#b8956a'),
          new THREE.Color('#9a8f7a'),
          new THREE.Color('#7a7d82'),
        ],
      },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uFloor;
      uniform float uStrata;
      uniform vec3 uColor;
      uniform vec3 uLine;
      uniform vec3 uStrataColors[4];
      varying vec3 vWorldPos;
      void main() {
        vec3 col = uColor;
        if (uStrata > 0.5) {
          float d = clamp(-vWorldPos.y, 0.0, 120.0);
          if (d < 18.0) col = uStrataColors[0];
          else if (d < 38.0) col = uStrataColors[1];
          else if (d < 62.0) col = uStrataColors[2];
          else col = uStrataColors[3];
        }
        float fy = abs(fract(vWorldPos.y / uFloor) - 0.5);
        if (fy < 0.04) col = mix(col, uLine, 0.85);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
}

export function capPlaneMesh(
  plane: THREE.Plane,
  extentM: number,
  maxHeight: number,
  material: THREE.Material,
  renderOrder = 2,
) {
  const size = Math.max(extentM * 1.2, maxHeight * 2)
  const geo = new THREE.PlaneGeometry(size, size)
  const mesh = new THREE.Mesh(geo, material)
  mesh.renderOrder = renderOrder

  const normal = plane.normal.clone()
  const point = normal.clone().multiplyScalar(-plane.constant)
  mesh.position.copy(point)

  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
  mesh.quaternion.copy(q)
  return mesh
}

export function clipPlaneFromAxis(axis: 'x' | 'z', pos: number) {
  if (axis === 'x') return new THREE.Plane(new THREE.Vector3(1, 0, 0), -pos)
  return new THREE.Plane(new THREE.Vector3(0, 0, 1), -pos)
}
