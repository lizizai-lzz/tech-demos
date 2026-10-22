import * as THREE from 'three'

/** 0 办公幕墙 / 1 住宅窗+阳台 / 2 低层商业 / 3 玻璃地标 / 4 石材开窗 / 5 格构（铁塔） */
export const facadeUniform = { value: 1 }

const COLOR = /* glsl */ `
float facadeWin = 0.0;
float facadeRoof = 0.0;
float facadeMix = 0.0;
float facadeGlow = 0.0;
float facadeWarm = 0.0;
{
  float style = vStyle;
  float floorH = 3.5;
  float floors = max(vFloors, 1.0);
  float v = vWorldPos.y / floorH;
  float cell = style < 0.5 ? 2.2 : style < 1.5 ? 3.4 : style < 2.5 ? 4.2 : style < 3.5 ? 5.5 : style < 4.5 ? 4.6 : 8.0;
  float u = (abs(vWorldN.x) > abs(vWorldN.z) ? vWorldPos.z : vWorldPos.x) / cell;
  vec2 fuv = fract(vec2(u, v));
  float mx = 0.08;
  float my = 0.12;
  if (style >= 0.5 && style < 1.5) { mx = 0.32; my = 0.26; }
  else if (style >= 1.5 && style < 2.5) { mx = 0.16; my = 0.16; }
  else if (style >= 2.5 && style < 3.5) { mx = 0.05; my = 0.07; }
  else if (style >= 3.5 && style < 4.5) { mx = 0.30; my = 0.26; }
  float win = step(mx, fuv.x) * step(fuv.x, 1.0 - mx) * step(my, fuv.y) * step(fuv.y, 1.0 - my);
  float onWall = step(0.15, vWorldPos.y) * step(v, floors - 0.05);
  vec3 body = vec3(0.48, 0.58, 0.68);
  vec3 glass = vec3(0.07, 0.15, 0.24);
  if (style >= 0.5 && style < 1.5) {
    body = vec3(0.74, 0.48, 0.32);
    glass = vec3(0.09, 0.11, 0.14);
    float course = smoothstep(0.08, 0.0, abs(fract(vWorldPos.y * 2.2) - 0.5));
    body = mix(body, body * vec3(0.78, 0.74, 0.70), course * 0.65);
  } else if (style >= 1.5 && style < 2.5) {
    body = vec3(0.55, 0.53, 0.49);
    glass = vec3(0.10, 0.14, 0.18);
  } else if (style >= 2.5 && style < 3.5) {
    body = vec3(0.40, 0.56, 0.68);
    glass = vec3(0.10, 0.22, 0.34);
  } else if (style >= 3.5 && style < 4.5) {
    body = vec3(0.70, 0.64, 0.52);
    glass = vec3(0.11, 0.13, 0.15);
  } else if (style >= 4.5) {
    body = vec3(0.30, 0.31, 0.33);
    win = 0.0;
  }
  float salt = fract(sin(dot(floor(vWorldPos.xz / 70.0), vec2(12.9898, 78.233))) * 43758.5453);
  body *= mix(vec3(0.90, 0.94, 0.98), vec3(1.08, 1.0, 0.92), salt);
  float fres = pow(1.0 - abs(dot(normalize(vWorldN), normalize(vec3(0.35, 0.86, 0.28)))), 1.45);
  vec3 pane = mix(glass, vec3(0.80, 0.90, 1.0), 0.22 + 0.72 * fres);
  vec3 facade = body;
  if (style < 4.5) {
    facade = mix(body, pane, win * onWall);
    if (style >= 0.5 && style < 1.5) {
      float balcony = step(fuv.y, 0.16) * step(0.12, fuv.x) * step(fuv.x, 0.88);
      facade = mix(facade, body * 1.15, balcony * onWall * (1.0 - win));
    }
    float sep = smoothstep(0.055, 0.0, min(fuv.y, 1.0 - fuv.y));
    facade = mix(facade, body * 0.55, sep * onWall * 0.95);
  } else {
    float lx = 1.0 - smoothstep(0.02, 0.08, abs(fract(vWorldPos.x * 0.11) - 0.5));
    float lz = 1.0 - smoothstep(0.02, 0.08, abs(fract(vWorldPos.z * 0.11) - 0.5));
    float ly = 1.0 - smoothstep(0.015, 0.06, abs(fract(v * 0.32) - 0.5));
    facade = mix(body, vec3(0.14, 0.15, 0.16), clamp(max(max(lx, lz), ly), 0.0, 1.0));
  }
  float shopBand = step(0.5, style) * step(style, 2.5) * step(0.2, v) * step(v, 1.05);
  float shop = shopBand * step(0.05, fuv.x) * step(fuv.x, 0.95) * step(0.06, fuv.y);
  facade = mix(facade, vec3(1.0, 0.68, 0.28), shop);
  float parapet = onWall * smoothstep(floors - 0.72, floors - 0.08, v);
  facade = mix(facade, facade * 0.48, parapet * (1.0 - step(0.5, abs(vWorldN.y))));
  float roof = smoothstep(0.5, 0.84, abs(vWorldN.y));
  vec2 rc = fract(vWorldPos.xz * 0.055);
  float ac = step(0.56, rc.x) * step(rc.x, 0.92) * step(0.16, rc.y) * step(rc.y, 0.55);
  float pad = step(0.62, rc.x) * step(rc.x, 0.86) * step(0.24, rc.y) * step(rc.y, 0.48);
  vec3 roofCol = vec3(0.11, 0.11, 0.12);
  roofCol = mix(roofCol, vec3(0.12, 0.13, 0.14), ac);
  roofCol = mix(roofCol, vec3(0.55, 0.60, 0.64), pad);
  facade = mix(facade, roofCol, roof);
  float sweep = facadeUniformReveal * 760.0;
  float reveal = 1.0 - smoothstep(sweep - 42.0, sweep + 6.0, vWorldPos.y);
  facadeWin = win * onWall * (1.0 - roof);
  facadeRoof = roof;
  facadeMix = reveal;
  facadeGlow = facadeWin * (0.16 + 0.7 * fres);
  facadeGlow = max(facadeGlow, shop * 1.2);
  facadeWarm = shop;
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
    roughness: 0.78,
    metalness: 0.02,
  })
  mat.customProgramCacheKey = () => 'facade-v2'
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
          roughnessFactor = mix(roughnessFactor, 0.07, facadeWin * facadeMix);
          roughnessFactor = mix(roughnessFactor, 0.95, facadeRoof * facadeMix);`,
        )
        .replace(
          '#include <metalnessmap_fragment>',
          `#include <metalnessmap_fragment>
          metalnessFactor = mix(metalnessFactor, 0.66, facadeWin * facadeMix);`,
        )
        .replace(
          '#include <opaque_fragment>',
          `vec3 glowCol = mix(vec3(0.42, 0.60, 0.86), vec3(1.0, 0.52, 0.16), facadeWarm);
          outgoingLight += glowCol * facadeGlow * facadeMix;
          float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.55);
          outgoingLight += rim * mix(vec3(0.04, 0.05, 0.07), vec3(0.38, 0.52, 0.68), facadeWin) * (0.2 + 0.8 * facadeMix);
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
