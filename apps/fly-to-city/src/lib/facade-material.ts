import * as THREE from 'three'

/** 0 办公幕墙 / 1 住宅窗+阳台 / 2 低层商业 / 3 玻璃地标 / 4 石材开窗 / 5 格构（铁塔） */
export const facadeUniform = { value: 1 }

const COLOR = /* glsl */ `
float facadeWin = 0.0;
float facadeRoof = 0.0;
float facadeMix = 0.0;
{
  vec3 plaster = vec3(0.957, 0.949, 0.933);
  float style = vStyle;
  float floorH = 3.5;
  float floors = max(vFloors, 1.0);
  float v = vWorldPos.y / floorH;
  float cell = style < 0.5 ? 2.35 : style < 1.5 ? 3.7 : style < 2.5 ? 4.4 : style < 3.5 ? 6.5 : style < 4.5 ? 4.8 : 9.0;
  float u = (abs(vWorldN.x) > abs(vWorldN.z) ? vWorldPos.z : vWorldPos.x) / cell;
  vec2 fuv = fract(vec2(u, v));
  float mx = style < 0.5 ? 0.07 : style < 1.5 ? 0.30 : 0.16;
  float my = style < 0.5 ? 0.12 : style < 1.5 ? 0.24 : 0.18;
  if (style > 2.5 && style < 3.5) { mx = 0.08; my = 0.10; }
  if (style > 3.5 && style < 4.5) { mx = 0.34; my = 0.30; }
  float win = step(mx, fuv.x) * step(fuv.x, 1.0 - mx) * step(my, fuv.y) * step(fuv.y, 1.0 - my);
  if (style > 1.5 && style < 2.5 && v < 1.05) {
    win = step(0.06, fuv.x) * step(fuv.x, 0.94) * step(0.05, fuv.y) * step(fuv.y, 0.90);
  }
  float balcony = 0.0;
  if (style > 0.5 && style < 1.5) {
    balcony = step(fuv.y, 0.14) * step(0.10, fuv.x) * step(fuv.x, 0.90);
  }
  float sep = smoothstep(0.055, 0.012, min(fuv.y, 1.0 - fuv.y));
  float onWall = step(0.2, vWorldPos.y) * step(v, floors - 0.02);
  if (style < 0.5) plaster = vec3(0.910, 0.925, 0.945);
  else if (style < 1.5) plaster = vec3(0.953, 0.941, 0.918);
  else if (style > 2.5 && style < 3.5) plaster = vec3(0.86, 0.90, 0.94);
  else if (style > 3.5 && style < 4.5) plaster = vec3(0.910, 0.890, 0.855);
  else if (style > 4.5) plaster = vec3(0.78, 0.76, 0.72);
  vec3 glass = vec3(0.58, 0.72, 0.82);
  vec3 facade = plaster;
  if (style > 4.5) {
    float lx = 1.0 - smoothstep(0.03, 0.09, abs(fract(vWorldPos.x * 0.12) - 0.5));
    float lz = 1.0 - smoothstep(0.03, 0.09, abs(fract(vWorldPos.z * 0.12) - 0.5));
    float ly = 1.0 - smoothstep(0.02, 0.08, abs(fract(v * 0.35) - 0.5));
    facade = mix(plaster, vec3(0.45, 0.44, 0.42), clamp(max(max(lx, lz) * 0.45, ly), 0.0, 1.0));
    win = 0.0;
  } else {
    facade = mix(facade, glass, win * onWall);
    facade = mix(facade, vec3(0.84, 0.82, 0.78), balcony * onWall * (1.0 - win));
    facade = mix(facade, plaster * 0.78, sep * onWall * 0.85);
  }
  float roof = smoothstep(0.42, 0.78, abs(vWorldN.y));
  facade = mix(facade, vec3(0.90, 0.89, 0.86), roof);
  float sweep = facadeUniformReveal * 760.0;
  float reveal = 1.0 - smoothstep(sweep - 42.0, sweep + 6.0, vWorldPos.y);
  facadeWin = win * (1.0 - roof);
  facadeRoof = roof;
  facadeMix = reveal;
  diffuseColor.rgb = mix(vec3(0.957, 0.949, 0.933), facade, reveal);
}
`

let shared: THREE.MeshStandardMaterial | null = null

export function facadeStyleForHeight(height: number, facade?: number) {
  if (facade != null && Number.isFinite(facade)) return facade
  if (height >= 48) return 0
  if (height <= 14) return 2
  return 1
}

export function getFacadeMaterial() {
  if (shared) return shared
  const mat = new THREE.MeshStandardMaterial({
    color: '#f4f2ee',
    roughness: 0.62,
    metalness: 0.04,
  })
  mat.customProgramCacheKey = () => 'facade-v1'
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.facadeUniformReveal = facadeUniform
    shader.vertexShader =
      'attribute float aFloors;\nattribute float aStyle;\nvarying vec3 vWorldPos;\nvarying vec3 vWorldN;\nvarying float vFloors;\nvarying float vStyle;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vWorldN = normalize(mat3(modelMatrix) * normal);
        vFloors = aFloors;
        vStyle = aStyle;`,
      )
    shader.fragmentShader =
      'varying vec3 vWorldPos;\nvarying vec3 vWorldN;\nvarying float vFloors;\nvarying float vStyle;\nuniform float facadeUniformReveal;\n' +
      shader.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>\n${COLOR}`)
        .replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, 0.16, facadeWin * facadeMix);
          roughnessFactor = mix(roughnessFactor, 0.92, facadeRoof * facadeMix);`,
        )
        .replace(
          '#include <opaque_fragment>',
          `float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.8);
          outgoingLight += rim * mix(vec3(0.16, 0.18, 0.22), vec3(0.20, 0.24, 0.30), facadeWin) * (0.35 + 0.65 * facadeMix);
          #include <opaque_fragment>`,
        )
  }
  shared = mat
  return mat
}

export function setFacadeAttrs(geo: THREE.BufferGeometry, floors: number, style: number) {
  const pos = geo.getAttribute('position')
  const n = pos?.count ?? 0
  if (!n) return
  const f = new Float32Array(n)
  const s = new Float32Array(n)
  f.fill(Math.max(1, floors))
  s.fill(style)
  geo.setAttribute('aFloors', new THREE.BufferAttribute(f, 1))
  geo.setAttribute('aStyle', new THREE.BufferAttribute(s, 1))
}
