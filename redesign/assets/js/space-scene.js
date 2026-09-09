import * as THREE from '../vendor/three.module.js';

// A lightweight, self-contained interpretation of the UZMA-Sat 1 spacecraft.
// The product photograph remains the fallback if WebGL cannot start.
export async function initSpaceScene({ container, reducedMotion = false }) {
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
  light(0x87cee7, 3.5, -4, 2, -4);
  light(0xf3b886, 1.2, 3, -2, 4);

  const silver = new THREE.MeshStandardMaterial({ color: 0x9ba9b3, metalness: 0.85, roughness: 0.29 });
  const brightSilver = new THREE.MeshStandardMaterial({ color: 0xd2dbe0, metalness: 0.86, roughness: 0.23 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x15212a, metalness: 0.68, roughness: 0.34 });
  const copper = new THREE.MeshStandardMaterial({ color: 0x9a6951, metalness: 0.78, roughness: 0.3 });
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
  const gold = new THREE.MeshStandardMaterial({ color: 0xc1a05b, metalness: 0.82, roughness: 0.34, bumpMap: foilMap, bumpScale: 0.065 });
  const solarMap = canvasTexture(128, 128, (ctx, width, height) => {
    ctx.fillStyle = '#071624';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#24404e';
    ctx.lineWidth = 0.75;
    for (let y = 8; y < height; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#647984';
    ctx.fillRect(31, 0, 1.5, height);
    ctx.fillRect(95, 0, 1.5, height);
  });
  const solar = new THREE.MeshStandardMaterial({ color: 0x8da9bd, map: solarMap, metalness: 0.48, roughness: 0.28 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x071323, metalness: 0.75, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.06 });

  const satellite = new THREE.Group();
  scene.add(satellite);
  const craft = new THREE.Group();
  satellite.add(craft);

  function mesh(geometry, material, x = 0, y = 0, z = 0, parent = craft) {
    const result = new THREE.Mesh(geometry, material);
    result.position.set(x, y, z);
    parent.add(result);
    return result;
  }
  function box(width, height, depth, material, x = 0, y = 0, z = 0, parent = craft) {
    return mesh(new THREE.BoxGeometry(width, height, depth), material, x, y, z, parent);
  }
  function cylinder(radius, length, material, x, y, z, parent = craft) {
    return mesh(new THREE.CylinderGeometry(radius, radius, length, 48), material, x, y, z, parent);
  }
  function ring(radius, tube, material, y) {
    const result = mesh(new THREE.TorusGeometry(radius, tube, 8, 64), material, 0, y, 0);
    result.rotation.x = Math.PI / 2;
    return result;
  }

  box(1.46, 1.8, 1.28, graphite, 0, 0.46, 0);
  box(1.49, 0.085, 1.32, silver, 0, 1.37, 0);
  box(1.43, 0.13, 1.27, silver, 0, -0.45, 0);
  // Structural edge rails stay visible as the spacecraft turns.
  for (const x of [-0.744, 0.744]) {
    for (const z of [-0.647, 0.647]) box(0.045, 1.82, 0.045, brightSilver, x, 0.47, z);
  }
  for (const y of [-0.35, 1.25]) {
    box(1.48, 0.035, 0.028, brightSilver, 0, y, 0.674);
    box(1.48, 0.035, 0.028, brightSilver, 0, y, -0.674);
  }

  const cellShape = new THREE.Shape();
  const cellWidth = 0.248;
  const cellHeight = 0.209;
  const cut = 0.026;
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
  // ShapeGeometry uses world-unit UVs; normalize so each cell has fine busbars.
  const uv = cellGeometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + cellWidth / 2) / cellWidth, (uv.getY(i) + cellHeight / 2) / cellHeight);
  uv.needsUpdate = true;
  const panelTransforms = [
    { position: [0, 0.5, 0.67], rotation: 0, columns: 5 },
    { position: [0, 0.5, -0.67], rotation: Math.PI, columns: 5 },
    { position: [-0.766, 0.5, 0], rotation: -Math.PI / 2, columns: 4 },
    { position: [0.766, 0.5, 0], rotation: Math.PI / 2, columns: 4 },
  ];
  // Instancing keeps all 126 solar cells to one draw call per face.
  for (const panel of panelTransforms) {
    const group = new THREE.Group();
    group.position.set(...panel.position);
    group.rotation.y = panel.rotation;
    craft.add(group);
    const cells = new THREE.InstancedMesh(cellGeometry, solar, panel.columns * 7);
    const transform = new THREE.Matrix4();
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < panel.columns; col++) {
        transform.makeTranslation((col - (panel.columns - 1) / 2) * 0.272, (row - 3) * 0.225, 0);
        cells.setMatrixAt(row * panel.columns + col, transform);
      }
    }
    group.add(cells);
  }

  // Fasteners and service panels add scale without a heavy imported model.
  const boltGeometry = new THREE.SphereGeometry(0.019, 6, 4);
  const bolts = new THREE.InstancedMesh(boltGeometry, brightSilver, 24);
  const boltMatrix = new THREE.Matrix4();
  let boltIndex = 0;
  for (const z of [-0.689, 0.689]) {
    for (const x of [-0.704, 0.704]) {
      for (let row = 0; row < 6; row++) {
        boltMatrix.makeTranslation(x, -0.31 + row * 0.315, z);
        bolts.setMatrixAt(boltIndex++, boltMatrix);
      }
    }
  }
  craft.add(bolts);
  box(0.5, 0.026, 0.45, gold, 0.36, 1.425, -0.2);
  box(0.44, 0.018, 0.36, graphite, -0.31, 1.428, 0.26);
  box(1.23, 0.28, 1.15, gold, 0, -0.64, 0);
  cylinder(0.575, 0.95, copper, 0, -1.065, 0);
  ring(0.568, 0.023, silver, -0.77);
  ring(0.57, 0.02, copper, -1.14);
  cylinder(0.624, 0.115, graphite, 0, -1.566, 0);
  ring(0.613, 0.027, brightSilver, -1.635);
  ring(0.523, 0.027, black, -1.65);
  const lens = mesh(new THREE.CircleGeometry(0.509, 64), glass, 0, -1.646, 0);
  lens.rotation.x = Math.PI / 2;
  ring(0.448, 0.012, graphite, -1.657);
  const aperture = mesh(new THREE.CircleGeometry(0.224, 48), black, 0, -1.662, 0);
  aperture.rotation.x = Math.PI / 2;
  const reflection = mesh(new THREE.CircleGeometry(0.11, 32), new THREE.MeshBasicMaterial({ color: 0x6d9ab4, transparent: true, opacity: 0.13 }), -0.15, -1.666, 0.17);
  reflection.rotation.x = Math.PI / 2;
  reflection.scale.set(1, 0.35, 1);

  for (const x of [-0.57, 0.57]) {
    box(0.055, 0.87, 0.055, silver, x, -1.06, 0.42);
    box(0.17, 0.11, 0.15, graphite, x, -1.48, 0.42);
  }
  const instrument = box(0.4, 0.46, 0.065, graphite, 0.04, -1.04, 0.559);
  instrument.rotation.x = -0.025;
  const contacts = new THREE.InstancedMesh(new THREE.CircleGeometry(0.012, 6), gold, 42);
  const contactMatrix = new THREE.Matrix4();
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 6; col++) {
      contactMatrix.makeTranslation(-0.12 + col * 0.059, -1.22 + row * 0.057, 0.6);
      contacts.setMatrixAt(row * 6 + col, contactMatrix);
    }
  }
  craft.add(contacts);
  box(0.045, 0.72, 0.045, graphite, -0.855, 0.66, 0.12);
  box(0.2, 0.08, 0.08, silver, -0.81, 0.34, 0.12);
  cylinder(0.012, 0.52, gold, -0.85, 1.23, 0.12);
  cylinder(0.008, 0.43, silver, 0.45, 1.62, -0.28);

  const labelMap = canvasTexture(512, 100, (ctx, width, height) => {
    ctx.fillStyle = '#14202a';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f7f7ee';
    ctx.font = '700 58px Arial, sans-serif';
    ctx.fillText('UZMA', 26, 71);
    ctx.fillStyle = '#ff794b';
    ctx.fillRect(226, 22, 6, 56);
    ctx.fillStyle = '#d6e2e9';
    ctx.font = '400 36px Arial, sans-serif';
    ctx.fillText('SAT 1', 258, 64);
  });
  const label = new THREE.MeshBasicMaterial({ map: labelMap });
  mesh(new THREE.PlaneGeometry(1.14, 0.222), label, 0, -0.393, 0.705);

  // Earth is intentionally an atmospheric horizon rather than a geographic
  // data map. Noise is computed on the sphere, so it has no texture downloads.
  const earthUniforms = { uSun: { value: new THREE.Vector3(-0.5, 0.75, 0.6).normalize() } };
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
        surface += vec3(0.1, 0.16, 0.18) * wisps * day * 0.45;
        surface *= 0.22 + day * 0.85;
        surface += vec3(0.025, 0.2, 0.31) * edge * (0.3 + day * 0.7);
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
        gl_FragColor = vec4(0.13, 0.55, 0.8, rim * 0.39);
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

  let disposed = false;
  let contextUnavailable = false;
  let paused = false;
  let intersecting = true;
  let frame = 0;
  let elapsed = 0;
  let previousTime = 0;
  let targetProgress = 0;
  let progress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let cameraX = 0;
  let cameraY = 0;
  let cameraDistance = 10;
  let width = 0;
  let height = 0;

  function applyPose(delta) {
    const moving = !paused && !reducedMotion;
    const smoothing = 1 - Math.exp(-delta * 5);
    if (moving) {
      progress += (targetProgress - progress) * smoothing;
      cameraX += (pointerX - cameraX) * smoothing;
      cameraY += (pointerY - cameraY) * smoothing;
    }
    const scroll = reducedMotion ? 0 : progress;
    craft.rotation.set(-0.77 + scroll * 0.22, 0.39 + scroll * Math.PI * 1.82, 0.58 - scroll * 0.32);
    satellite.position.set(0.15, 0.63 + (!reducedMotion ? Math.sin(elapsed * 0.45) * 0.064 : 0), 0);
    satellite.rotation.y = !reducedMotion ? Math.sin(elapsed * 0.22) * 0.045 : 0;
    earth.rotation.y = scroll * 0.18;
    orbit.rotation.z = -0.4 + scroll * 0.16;
    marker.scale.setScalar(!reducedMotion ? 1 + Math.sin(elapsed * 1.6) * 0.12 : 1);
    camera.position.set(cameraX * 0.24, 0.3 + cameraY * 0.13, cameraDistance - scroll * 0.35);
    camera.lookAt(0.08, 0.25, 0);
  }

  function render(time) {
    frame = 0;
    if (disposed || contextUnavailable || !intersecting || document.hidden) return;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60;
    previousTime = time;
    if (!paused && !reducedMotion) elapsed += delta;
    applyPose(delta);
    renderer.render(scene, camera);
    if (!paused && !reducedMotion) frame = requestAnimationFrame(render);
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
    requestRender();
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  function pointerMove(event) {
    if (!finePointer.matches || reducedMotion || paused) return;
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
    applyPose(1);
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
    setProgress(value) {
      if (disposed || !Number.isFinite(value)) return;
      targetProgress = THREE.MathUtils.clamp(value, 0, 1);
      if (!paused) requestRender();
    },
    setPaused(value) {
      paused = Boolean(value);
      if (paused) stopRender();
      else requestRender();
    },
    dispose,
  };
}
