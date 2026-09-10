import * as THREE from '../vendor/three.module.js';

// A lightweight, self-contained interpretation of the UZMA-Sat 1 spacecraft.
// The product photograph remains the fallback if WebGL cannot start.
export async function initSpaceScene({ container, reducedMotion = false, variant = 'hero' }) {
  if (!(container instanceof HTMLElement)) throw new Error('A scene container is required.');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x050c14, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  const canvas = renderer.domElement;
  canvas.className = 'space-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';

  const textures = new Set();
  let environmentTarget;
  function canvasTexture(width, height, paint) {
    const source = document.createElement('canvas');
    source.width = width;
    source.height = height;
    const ctx = source.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable.');
    paint(ctx, width, height);
    const texture = new THREE.CanvasTexture(source);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture);
    return texture;
  }

  let seed = 17;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  // An in-memory studio environment gives the metal real reflections without
  // downloading an HDR image or adding a post-processing pipeline.
  const environment = canvasTexture(512, 256, (ctx, width, height) => {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#a9bfce');
    sky.addColorStop(0.28, '#445968');
    sky.addColorStop(0.51, '#152332');
    sky.addColorStop(0.73, '#0b1119');
    sky.addColorStop(1, '#283440');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e8f4f9';
    ctx.fillRect(70, 26, 70, 102);
    ctx.fillStyle = '#bed1e1';
    ctx.fillRect(340, 52, 26, 140);
    ctx.fillStyle = '#a77850';
    ctx.fillRect(212, 145, 105, 40);
  });
  environment.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  environmentTarget = pmrem.fromEquirectangular(environment);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.8;
  pmrem.dispose();

  const light = (color, intensity, x, y, z) => {
    const source = new THREE.DirectionalLight(color, intensity);
    source.position.set(x, y, z);
    scene.add(source);
  };
  scene.add(new THREE.HemisphereLight(0xb6d6e8, 0x080c17, 2));
  light(0xf3f5ec, 4.2, 3, 6, 7);
  light(0xadd0df, 1.8, -4, 2, -4);
  light(0xf3b886, 1.2, 3, -2, 4);

  const silver = new THREE.MeshStandardMaterial({ color: 0x9ba9b3, metalness: 0.85, roughness: 0.29 });
  const brightSilver = new THREE.MeshStandardMaterial({ color: 0xd2dbe0, metalness: 0.86, roughness: 0.23 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x262728, metalness: 0.68, roughness: 0.34 });
  const copper = new THREE.MeshStandardMaterial({ color: 0x80594e, metalness: 0.78, roughness: 0.3 });
  const black = new THREE.MeshStandardMaterial({ color: 0x080d14, metalness: 0.42, roughness: 0.37 });
  const foilMap = canvasTexture(128, 128, (ctx, width, height) => {
    ctx.fillStyle = '#a5a5a5';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 160; i++) {
      const x = random() * width;
      const y = random() * height;
      const value = Math.floor(65 + random() * 170);
      ctx.fillStyle = `rgb(${value},${value},${value})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + random() * 33, y + random() * 18);
      ctx.lineTo(x - random() * 19, y + random() * 22);
      ctx.fill();
    }
  });
  foilMap.colorSpace = THREE.NoColorSpace;
  const gold = new THREE.MeshStandardMaterial({ color: 0xc6b478, metalness: 0.82, roughness: 0.34, bumpMap: foilMap, bumpScale: 0.065 });
  const solarMap = canvasTexture(128, 128, (ctx, width, height) => {
    ctx.fillStyle = '#141516';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#303131';
    ctx.lineWidth = 0.75;
    for (let y = 8; y < height; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#73756d';
    ctx.fillRect(31, 0, 1.5, height);
    ctx.fillRect(95, 0, 1.5, height);
  });
  const solar = new THREE.MeshStandardMaterial({ color: 0xc7c8c2, map: solarMap, metalness: 0.25, roughness: 0.55 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x071323, metalness: 0.75, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.06 });

  const satellite = new THREE.Group();
  scene.add(satellite);
  const craft = new THREE.Group();
  satellite.add(craft);
  let assembly = craft;

  function mesh(geometry, material, x = 0, y = 0, z = 0, parent = assembly) {
    const result = new THREE.Mesh(geometry, material);
    result.position.set(x, y, z);
    parent.add(result);
    return result;
  }
  function box(width, height, depth, material, x = 0, y = 0, z = 0, parent = assembly) {
    return mesh(new THREE.BoxGeometry(width, height, depth), material, x, y, z, parent);
  }
  function cylinder(radius, length, material, x, y, z, parent = assembly) {
    return mesh(new THREE.CylinderGeometry(radius, radius, length, 48), material, x, y, z, parent);
  }
  function ring(radius, tube, material, y) {
    const result = mesh(new THREE.TorusGeometry(radius, tube, 8, 64), material, 0, y, 0);
    result.rotation.x = Math.PI / 2;
    return result;
  }

  // Proportions and component placement follow the supplied spacecraft views.
  // The optical barrel occupies most of the exposed lower body; the rear bus
  // is wrapped in thin solar plates rather than heavy external rails.
  box(1.42, 1.45, 1.38, graphite, 0, 0.785, 0);
  box(1.45, 0.045, 1.41, silver, 0, 1.535, 0);
  box(1.42, 0.05, 1.38, copper, 0, 0.065, 0);

  const cellShape = new THREE.Shape();
  const cellWidth = 0.274;
  const cellHeight = 0.249;
  const cut = 0.046;
  cellShape.moveTo(-cellWidth / 2 + cut, -cellHeight / 2);
  cellShape.lineTo(cellWidth / 2 - cut, -cellHeight / 2);
  cellShape.lineTo(cellWidth / 2, -cellHeight / 2 + cut);
  cellShape.lineTo(cellWidth / 2, cellHeight / 2 - cut);
  cellShape.lineTo(cellWidth / 2 - cut, cellHeight / 2);
  cellShape.lineTo(-cellWidth / 2 + cut, cellHeight / 2);
  cellShape.lineTo(-cellWidth / 2, cellHeight / 2 - cut);
  cellShape.lineTo(-cellWidth / 2, -cellHeight / 2 + cut);
  cellShape.closePath();
  const cellGeometry = new THREE.ShapeGeometry(cellShape);
  const uv = cellGeometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + cellWidth / 2) / cellWidth, (uv.getY(i) + cellHeight / 2) / cellHeight);
  uv.needsUpdate = true;

  const panelTransforms = [
    { position: [0, 0.76, 0.767], rotation: 0 },
    { position: [0, 0.76, -0.767], rotation: Math.PI },
    { position: [-0.767, 0.76, 0], rotation: -Math.PI / 2 },
    { position: [0.767, 0.76, 0], rotation: Math.PI / 2 },
  ];
  const panelBacking = new THREE.MeshStandardMaterial({ color: 0x999b92, metalness: 0.7, roughness: 0.52 });
  const connectorGeometry = new THREE.BoxGeometry(0.016, 0.028, 0.004);
  for (const panel of panelTransforms) {
    const group = new THREE.Group();
    group.position.set(...panel.position);
    group.rotation.y = panel.rotation;
    craft.add(group);
    box(1.48, 1.66, 0.023, panelBacking, 0, 0, -0.016, group);
    const cells = new THREE.InstancedMesh(cellGeometry, solar, 30);
    const connectors = new THREE.InstancedMesh(connectorGeometry, brightSilver, 60);
    const transform = new THREE.Matrix4();
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const index = row * 5 + col;
        const x = (col - 2) * 0.286;
        const y = (row - 2.5) * 0.264;
        transform.makeTranslation(x, y, 0);
        cells.setMatrixAt(index, transform);
        for (let side = 0; side < 2; side++) {
          transform.makeTranslation(x + (side ? 0.094 : -0.094), y + 0.127, 0.005);
          connectors.setMatrixAt(index * 2 + side, transform);
        }
      }
    }
    group.add(cells, connectors);
    // Small foil patch and perimeter fasteners visible in the source images.
    box(0.2, 0.15, 0.005, gold, 0.6, 0.74, 0.004, group);
    const panelBolts = new THREE.InstancedMesh(new THREE.SphereGeometry(0.01, 6, 4), silver, 12);
    let index = 0;
    for (const x of [-0.726, 0.726]) {
      for (let row = 0; row < 6; row++) {
        transform.makeTranslation(x, -0.76 + row * 0.304, 0.007);
        panelBolts.setMatrixAt(index++, transform);
      }
    }
    group.add(panelBolts);
  }

  // Shorter optical assembly follows the latest physical-model reference.
  // Scale about the bus interface so the aperture, cavity and electronics stay aligned.
  const optics = new THREE.Group();
  optics.scale.y = 0.72;
  optics.position.y = 0.065 * (1 - 0.72);
  craft.add(optics);
  assembly = optics;
  // Subtle machining texture follows the barrel without adding a download.
  const brushedMap = canvasTexture(128, 256, (ctx, width, height) => {
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      const value = Math.floor(115 + random() * 24);
      ctx.fillStyle = `rgb(${value},${value},${value})`;
      ctx.fillRect(0, y, width, 1);
    }
  });
  brushedMap.colorSpace = THREE.NoColorSpace;
  const barrelMaterial = copper.clone();
  barrelMaterial.bumpMap = brushedMap;
  barrelMaterial.bumpScale = 0.007;
  barrelMaterial.roughness = 0.4;
  // Open cylinders and a recessed mirror create an actual optical cavity.
  mesh(new THREE.CylinderGeometry(0.735, 0.735, 1.79, 64, 1, true), barrelMaterial, 0, -0.795, 0);
  const cavityMaterial = new THREE.MeshStandardMaterial({ color: 0x111213, metalness: 0.25, roughness: 0.72, side: THREE.DoubleSide });
  mesh(new THREE.CylinderGeometry(0.675, 0.675, 1.0, 64, 1, true), cavityMaterial, 0, -1.175, 0);
  ring(0.733, 0.018, copper, -1.6);
  // A flat, machined flange replaces the previous thick rounded lens bezel.
  const flange = mesh(new THREE.RingGeometry(0.668, 0.79, 64), silver, 0, -1.706, 0);
  flange.rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.789, 0.789, 0.038, 64, 1, true), graphite, 0, -1.687, 0);
  ring(0.751, 0.006, brightSilver, -1.711);
  ring(0.68, 0.009, graphite, -1.709);
  for (let i = 0; i < 9; i++) {
    ring(0.659 - i * 0.007, 0.011, black, -1.635 + i * 0.085);
  }
  const mirror = mesh(new THREE.CircleGeometry(0.6, 64), glass, 0, -0.88, 0);
  mirror.rotation.x = Math.PI / 2;
  const mirrorFace = new THREE.MeshStandardMaterial({ color: 0x9b9c96, metalness: 0.3, roughness: 0.67 });
  cylinder(0.225, 0.075, graphite, 0, -1.425, 0);
  const secondary = mesh(new THREE.CircleGeometry(0.225, 48), mirrorFace, 0, -1.465, 0);
  secondary.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const angle = i * Math.PI * 2 / 3 + 0.2;
    const strut = box(0.49, 0.022, 0.013, graphite, Math.cos(angle) * 0.422, -1.448, Math.sin(angle) * 0.422);
    strut.rotation.y = -angle;
  }

  // Copper service bay alongside the telescope, with asymmetric electronics.
  box(1.54, 1.02, 0.14, copper, 0, -0.83, -0.82);
  box(0.045, 1.25, 1.2, copper, -0.772, -0.64, -0.25);
  box(0.045, 1.25, 1.2, copper, 0.772, -0.64, -0.25);
  const instrument = new THREE.Group();
  instrument.position.set(0.08, -0.65, 0.732);
  optics.add(instrument);
  box(0.62, 0.65, 0.047, graphite, 0, 0, 0, instrument);
  const patchShape = new THREE.Shape();
  patchShape.moveTo(-0.018, -0.018);
  patchShape.lineTo(0.011, -0.022);
  patchShape.lineTo(0.024, -0.008);
  patchShape.lineTo(0.018, 0.019);
  patchShape.lineTo(-0.01, 0.023);
  patchShape.lineTo(-0.022, 0.007);
  patchShape.closePath();
  const contacts = new THREE.InstancedMesh(new THREE.ShapeGeometry(patchShape), gold, 64);
  const contactTransform = new THREE.Object3D();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      contactTransform.position.set((col - 3.5) * 0.071, (row - 3.5) * 0.071, 0.027);
      contactTransform.rotation.z = random() * 0.4 - 0.2;
      contactTransform.updateMatrix();
      contacts.setMatrixAt(row * 8 + col, contactTransform.matrix);
    }
  }
  instrument.add(contacts);
  const sensorPlate = new THREE.Group();
  sensorPlate.position.set(0.04, -1.36, 0.741);
  optics.add(sensorPlate);
  box(0.44, 0.36, 0.036, graphite, 0, 0, 0, sensorPlate);
  for (const x of [-0.127, 0.127]) {
    for (const y of [-0.09, 0.09]) box(0.09, 0.084, 0.006, gold, x, y, 0.021, sensorPlate);
  }
  box(0.062, 0.062, 0.02, black, 0, 0, 0.03, sensorPlate);

  // Reverse-side electronics remain visible during a complete scroll rotation.
  const rearBay = new THREE.Group();
  rearBay.position.set(0, -0.72, -0.9);
  rearBay.rotation.y = Math.PI;
  optics.add(rearBay);
  box(0.8, 0.59, 0.029, silver, 0, 0.03, 0, rearBay);
  box(0.39, 0.43, 0.022, graphite, -0.48, -0.08, 0.02, rearBay);
  box(0.36, 0.045, 0.15, gold, -0.17, 0.41, 0.065, rearBay);
  const electronicsMap = canvasTexture(128, 128, (ctx, width, height) => {
    ctx.fillStyle = '#838b8b'; ctx.fillRect(0, 0, width, height);
    for (let y = 4; y < height; y += 7) {
      for (let x = 4; x < width; x += 7) {
        ctx.fillStyle = '#b5bdb9'; ctx.fillRect(x, y, 2, 2);
      }
    }
    ctx.fillStyle = '#8d7652';
    for (let y = 29; y < height; y += 32) ctx.fillRect(0, y, width, 2);
  });
  const electronics = new THREE.MeshStandardMaterial({ map: electronicsMap, metalness: 0.45, roughness: 0.6 });
  box(0.4, 0.68, 0.008, electronics, -0.13, -0.045, 0.025, rearBay);
  box(0.34, 0.4, 0.008, electronics, 0.265, -0.04, 0.025, rearBay);
  assembly = craft;
  // Star sensor on the adjacent right-hand panel in the supplied view.
  const starTracker = new THREE.Group();
  starTracker.name = 'star-tracker';
  starTracker.position.set(0.18, 1.22, 0.8);
  starTracker.rotation.x = Math.PI / 2;
  craft.add(starTracker);
  box(0.34, 0.035, 0.32, silver, 0, 0, 0, starTracker);
  cylinder(0.115, 0.14, gold, 0, 0.08, 0, starTracker);
  mesh(new THREE.CylinderGeometry(0.19, 0.125, 0.24, 40, 1, true), silver, 0, 0.25, 0, starTracker);
  mesh(new THREE.CylinderGeometry(0.172, 0.11, 0.205, 40, 1, true), cavityMaterial, 0, 0.25, 0, starTracker);
  const trackerRim = mesh(new THREE.TorusGeometry(0.182, 0.012, 8, 40), brightSilver, 0, 0.37, 0, starTracker);
  trackerRim.rotation.x = Math.PI / 2;
  const trackerLens = mesh(new THREE.CircleGeometry(0.105, 40), glass, 0, 0.19, 0, starTracker);
  trackerLens.rotation.x = -Math.PI / 2;
  // Exactly two matching instruments: retain the requested panel and mirror
  // it onto the facing panel. The former pair on the X sides is removed.
  const facingTracker = starTracker.clone(true);
  facingTracker.name = 'star-tracker-facing';
  facingTracker.position.set(0.18, 1.22, -0.8);
  facingTracker.rotation.x = -Math.PI / 2;
  craft.add(facingTracker);
  box(0.25, 0.006, 0.25, gold, 0.38, 1.563, -0.33);


  // Earth is intentionally an atmospheric horizon rather than a geographic
  // data map. Noise is computed on the sphere, so it has no texture downloads.
  const earthUniforms = { uSun: { value: new THREE.Vector3(-0.5, 0.75, 0.6).normalize() }, uBright: { value: variant === 'planet' ? 1 : 0 } };
  const earthVertex = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorld;
    void main() {
      vNormal = normalize(mat3(modelMatrix) * normal);
      vPosition = position;
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: earthUniforms,
    vertexShader: earthVertex,
    fragmentShader: `
      uniform vec3 uSun;
      uniform float uBright;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vWorld;
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1, 0.3, 0.7));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 view = normalize(cameraPosition - vWorld);
        float day = max(dot(normal, uSun), 0.0);
        float edge = pow(1.0 - max(dot(normal, view), 0.0), 3.3);
        float clouds = noise(vPosition * 4.0) * 0.55 + noise(vPosition * 11.0) * 0.3 + noise(vPosition * 24.0) * 0.15;
        float wisps = smoothstep(0.5, 0.8, clouds);
        vec3 surface = mix(vec3(0.009,0.03,0.052), vec3(0.033,0.082,0.12), clouds);
        // Satin navy globe: broad relief and fine cartographic lines, not clouds.
        surface = mix(vec3(0.012,0.024,0.036), vec3(0.018,0.055,0.085), smoothstep(0.34,0.72,clouds));
        float latitude = asin(normalize(vPosition).y);
        float longitude = atan(vPosition.z,vPosition.x);
        float parallels = 1.0-smoothstep(0.008,0.02,abs(sin(latitude*18.0)));
        float meridians = 1.0-smoothstep(0.008,0.02,abs(sin(longitude*18.0)));
        surface += vec3(0.025,0.035,0.043)*max(parallels,meridians)*0.3;
        surface *= 0.22 + day * 0.85;
        surface += vec3(0.09, 0.115, 0.135) * edge * (0.3 + day * 0.7);
        // A brighter illustrative globe for the peach contact section.
        float land = smoothstep(0.51, 0.56, noise(vPosition * 0.6));
        vec3 brightSurface = mix(vec3(0.035, 0.3, 0.48), vec3(0.26, 0.48, 0.26), land);
        brightSurface = mix(brightSurface, vec3(0.82, 0.9, 0.91), wisps * 0.5);
        brightSurface *= 0.5 + day * 0.6;
        surface = mix(surface, brightSurface, uBright);
        gl_FragColor = vec4(surface, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const earth = new THREE.Group();
  earth.position.set(1.6, -7.05, -4.0);
  scene.add(earth);
  const earthGeometry = new THREE.SphereGeometry(6.05, 64, 40);
  mesh(earthGeometry, earthMaterial, 0, 0, 0, earth);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: earthVertex,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vec3 view = normalize(cameraPosition - vWorld);
        float rim = pow(1.0 - max(dot(normalize(vNormal), view), 0.0), 5.8);
        gl_FragColor = vec4(0.55, 0.64, 0.7, rim * 0.22);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const atmosphere = mesh(earthGeometry, atmosphereMaterial, 0, 0, 0, earth);
  atmosphere.scale.setScalar(1.016);

  const orbit = new THREE.Group();
  orbit.position.set(0.08, -0.15, -1.8);
  orbit.rotation.set(0.36, -0.14, -0.4);
  scene.add(orbit);
  function arc(radiusX, radiusY, start, end, color, opacity, parent = orbit) {
    const points = [];
    const steps = Math.ceil((end - start) * 40);
    for (let i = 0; i <= steps; i++) {
      const t = start + (end - start) * i / steps;
      points.push(new THREE.Vector3(Math.cos(t) * radiusX, Math.sin(t) * radiusY, 0));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    parent.add(line);
    return line;
  }
  arc(3.68, 1.52, 0, Math.PI * 2, 0x7593a5, 0.19);
  arc(3.71, 1.54, 0.7, 1.75, 0xe57d50, 0.75);
  arc(4.14, 1.87, -0.6, 3.55, 0x547785, 0.11);
  const marker = mesh(new THREE.SphereGeometry(0.036, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf48d5d }), Math.cos(0.7) * 3.71, Math.sin(0.7) * 1.54, 0, orbit);

  const starPositions = [];
  for (let i = 0; i < 90; i++) starPositions.push((random() - 0.5) * 22, (random() - 0.2) * 15, -8 - random() * 10);
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xb9d0df, size: 0.027, transparent: true, opacity: 0.45, sizeAttenuation: true, depthWrite: false }));
  scene.add(stars);

  if (variant !== 'hero') stars.visible = false;
  if (variant === 'product') earth.visible = false;
  if (variant === 'planet') {
    satellite.visible = false;
    earth.position.set(0, 0, 0);
    earth.scale.setScalar(0.38);
    orbit.position.set(0, 0, 0);
    orbit.rotation.x = 0.8;
  }

  let disposed = false;
  let contextUnavailable = false;
  let paused = false;
  let intersecting = true;
  let frame = 0;
  let elapsed = 0;
  let previousTime = 0;
  let targetProgress = 0;
  let progress = 0;
  let manualPose = false;
  let pointerX = 0;
  let pointerY = 0;
  let cameraX = 0;
  let cameraY = 0;
  let cameraDistance = 10;
  let width = 0;
  let height = 0;
  let focusKey = 'overview';
  let focusAnimating = false;
  let focusImmediate = true;
  const focusLook = new THREE.Vector3(0.08, 0.25, 0);
  const focusPositions = {
    camera: { point: [0, -1.02, 0], normal: [0, -1, 0], distance: 3.8 },
    'star-left': { point: [0.18, 1.22, 1.03], normal: [0, 0.12, 1], distance: 2.4 },
    'star-right': { point: [0.18, 1.22, -1.03], normal: [0, 0.12, -1], distance: 2.4 },
    solar: { point: [-0.77, 0.76, 0], normal: [-1, 0.2, 0.2], distance: 4.6 },
    aperture: { point: [0, -1.21, 0], normal: [0.12, -1, 0.12], distance: 2.9 },
    barrel: { point: [0, -0.55, 0.55], normal: [0.3, -0.1, 1], distance: 3.4 },
    body: { point: [0, 0.55, 0], normal: [-1, 0.2, -0.4], distance: 4.6 },
    'patch-panel': { point: [0.08, -0.45, 0.76], normal: [0, 0, 1], distance: 2.2 },
    'small-panel': { point: [0.04, -0.96, 0.77], normal: [0, -0.1, 1], distance: 1.9 },
    'rear-bay': { point: [0, -0.5, -0.92], normal: [0, 0, -1], distance: 2.8 },
  };

  function applyPose(delta) {
    const moving = !paused && !reducedMotion;
    const smoothing = 1 - Math.exp(-delta * 5);
    if (moving) {
      progress += (targetProgress - progress) * smoothing;
      cameraX += (pointerX - cameraX) * smoothing;
      cameraY += (pointerY - cameraY) * smoothing;
    }
    const scroll = manualPose ? progress : reducedMotion ? 0 : progress;
    craft.rotation.set(-0.77 + scroll * 0.22, 0.39 + scroll * Math.PI * 1.82, 0.58 - scroll * 0.32);
    satellite.position.set(0.15, -0.12 + (!reducedMotion ? Math.sin(elapsed * 0.45) * 0.064 : 0), 0);
    satellite.rotation.y = !reducedMotion ? Math.sin(elapsed * 0.22) * 0.045 : 0;
    earth.rotation.y = scroll * 0.18;
    if (variant === 'planet') earth.rotation.y = scroll + elapsed * 0.04;
    orbit.rotation.z = -0.4 + scroll * 0.16;
    marker.scale.setScalar(!reducedMotion ? 1 + Math.sin(elapsed * 1.6) * 0.12 : 1);
    camera.position.set(cameraX * 0.24, 0.3 + cameraY * 0.13, cameraDistance - scroll * 0.35);
    camera.lookAt(0.08, 0.25, 0);
  }

  function applyFocus(delta) {
    craft.rotation.set(-0.77, 0.39, 0.58);
    satellite.position.set(0.15, 0.2, 0);
    satellite.rotation.set(0, 0, 0);
    orbit.visible = false;
    scene.updateMatrixWorld(true);
    const selected = focusPositions[focusKey];
    const target = selected ? craft.localToWorld(new THREE.Vector3(...selected.point)) : new THREE.Vector3(0.08, 0.25, 0);
    const destination = selected
      ? target.clone().add(new THREE.Vector3(...selected.normal).transformDirection(craft.matrixWorld).multiplyScalar(selected.distance * Math.max(1, 0.9 / camera.aspect)))
      : new THREE.Vector3(0, 0.3, cameraDistance);
    const step = focusImmediate ? 1 : 1 - Math.exp(-delta * 7);
    camera.position.lerp(destination, step);
    focusLook.lerp(target, step);
    camera.lookAt(focusLook);
    focusAnimating = camera.position.distanceTo(destination) > 0.002 || focusLook.distanceTo(target) > 0.002;
    container.dataset.focus = focusKey;
    container.dataset.focusMoving = String(focusAnimating);
    focusImmediate = false;
  }

  function render(time) {
    frame = 0;
    if (disposed || contextUnavailable || !intersecting || document.hidden) return;
    // Component focus follows elapsed time even when software WebGL draws only
    // a few frames per second. The hero keeps its tighter simulation clamp.
    const delta = previousTime ? Math.min((time - previousTime) / 1000, variant === 'product' ? 1 : 0.05) : 1 / 60;
    previousTime = time;
    if (!paused && !reducedMotion) elapsed += delta;
    if (variant === 'product') applyFocus(delta);
    else applyPose(delta);
    renderer.render(scene, camera);
    if (variant === 'product' ? focusAnimating : !paused && !reducedMotion) frame = requestAnimationFrame(render);
  }
  function requestRender() {
    if (!frame && !disposed && !contextUnavailable && intersecting && !document.hidden) frame = requestAnimationFrame(render);
  }
  function stopRender() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }
  function resize() {
    if (disposed) return;
    const rect = container.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    if (width === nextWidth && height === nextHeight) return;
    width = nextWidth;
    height = nextHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Keep the satellite at a useful size on portrait and landscape stages.
    cameraDistance = Math.max(8.2, 8.9 / Math.max(camera.aspect, 0.82));
    camera.updateProjectionMatrix();
    if (variant === 'product') focusImmediate = true;
    requestRender();
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  function pointerMove(event) {
    if (variant === 'product' || !finePointer.matches || reducedMotion || paused) return;
    const rect = container.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }
  function pointerLeave() { pointerX = 0; pointerY = 0; }
  function visibilityChange() {
    if (document.hidden) stopRender();
    else requestRender();
  }
  function contextLost(event) {
    event.preventDefault();
    contextUnavailable = true;
    stopRender();
    canvas.style.visibility = 'hidden';
    container.classList.remove('scene-ready');
    container.dispatchEvent(new CustomEvent('space-scene-error'));
  }
  function contextRestored() {
    contextUnavailable = false;
    canvas.style.visibility = 'visible';
    container.classList.add('scene-ready');
    container.dispatchEvent(new CustomEvent('space-scene-ready'));
    requestRender();
  }

  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    if (intersecting) requestRender();
    else stopRender();
  }, { rootMargin: '80px' });

  function dispose() {
    if (disposed) return;
    disposed = true;
    stopRender();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    container.removeEventListener('pointermove', pointerMove);
    container.removeEventListener('pointerleave', pointerLeave);
    document.removeEventListener('visibilitychange', visibilityChange);
    canvas.removeEventListener('webglcontextlost', contextLost);
    canvas.removeEventListener('webglcontextrestored', contextRestored);
    const geometries = new Set();
    const materials = new Set();
    scene.traverse((object) => {
      if (object.isInstancedMesh) object.dispose();
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) {
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach((material) => materials.add(material));
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    environmentTarget?.dispose();
    renderer.dispose();
    canvas.remove();
    container.classList.remove('scene-ready');
  }

  try {
    resize();
    if (variant === 'product') applyFocus(1);
    else applyPose(1);
    // Compile and render before replacing the photograph, so a failed graphics
    // driver never leaves the landing page with an empty product visual.
    await renderer.compileAsync(scene, camera);
    renderer.render(scene, camera);
    container.appendChild(canvas);
    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    container.addEventListener('pointermove', pointerMove, { passive: true });
    container.addEventListener('pointerleave', pointerLeave, { passive: true });
    document.addEventListener('visibilitychange', visibilityChange);
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.addEventListener('webglcontextrestored', contextRestored);
    requestRender();
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    focusComponent(key) {
      if (disposed || variant !== 'product' || (key !== 'overview' && !focusPositions[key])) return;
      focusKey = key;
      focusImmediate = paused || reducedMotion;
      previousTime = 0;
      requestRender();
    },
    setProgress(value, immediate = false) {
      if (disposed || !Number.isFinite(value)) return;
      targetProgress = THREE.MathUtils.clamp(value, 0, 1);
      if (immediate) {
        manualPose = true;
        progress = targetProgress;
        applyPose(0);
        renderer.render(scene, camera);
      }
      if (!paused) requestRender();
    },
    setPaused(value) {
      paused = Boolean(value);
      if (paused) {
        stopRender();
        if (variant === 'product') { focusImmediate = true; requestRender(); }
      }
      else requestRender();
    },
    dispose,
  };
}
