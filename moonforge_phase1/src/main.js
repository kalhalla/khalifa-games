import * as THREE from 'three';

const canvas = document.getElementById('game');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);
scene.fog = new THREE.Fog(0x05070d, 60, 220);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 800);
camera.position.set(38, 36, 48);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const root = new THREE.Group();
scene.add(root);

const moonGroup = new THREE.Group();
root.add(moonGroup);

const buildingsGroup = new THREE.Group();
root.add(buildingsGroup);

const payloadGroup = new THREE.Group();
root.add(payloadGroup);

const clock = new THREE.Clock();

const game = {
  resources: {
    power: 16,
    regolith: 0,
    ice: 0,
    oxygen: 0,
    aluminium: 0,
    funding: 900
  },
  buildings: {
    solar: 1,
    excavator: 0,
    ice: 0,
    refinery: 0,
    oxygen: 0,
    massDriver: 0
  },
  selectedBuild: null,
  launchComplete: false,
  launchedPayloads: [],
  cameraYaw: 0,
  cameraTarget: new THREE.Vector3(0, 0, 0),
  cameraDistance: 70,
  keys: {}
};

const BUILDINGS = {
  solar: {
    label: 'Solar Array',
    cost: { funding: 80 },
    powerDelta: 12,
    colour: 0x234c8f,
    footprint: 4
  },
  excavator: {
    label: 'Excavator',
    cost: { funding: 120, power: 4 },
    colour: 0xd1aa63,
    footprint: 4
  },
  ice: {
    label: 'Ice Harvester',
    cost: { funding: 140, power: 5 },
    colour: 0x7fd8ff,
    footprint: 4
  },
  refinery: {
    label: 'Aluminium Refinery',
    cost: { funding: 220, power: 8 },
    colour: 0xbfc9d9,
    footprint: 5
  },
  oxygen: {
    label: 'Oxygen Plant',
    cost: { funding: 180, power: 6 },
    colour: 0x9ce6ff,
    footprint: 5
  },
  massDriver: {
    label: 'Mass Driver',
    cost: { funding: 600, aluminium: 80, power: 20 },
    colour: 0x93a5c9,
    footprint: 12
  }
};

const hud = {
  power: document.getElementById('power'),
  regolith: document.getElementById('regolith'),
  ice: document.getElementById('ice'),
  oxygen: document.getElementById('oxygen'),
  aluminium: document.getElementById('aluminium'),
  funding: document.getElementById('funding'),
  message: document.getElementById('message'),
  launchBtn: document.getElementById('launchBtn')
};

function showMessage(text) {
  hud.message.textContent = text;
}

function lowPolyMaterial(colour, roughness = 0.95) {
  return new THREE.MeshStandardMaterial({
    color: colour,
    roughness,
    metalness: 0.03,
    flatShading: true
  });
}

function makeMoonSurface() {
  const size = 220;
  const segments = 72;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.sqrt(x * x + z * z);
    const bowl = Math.max(0, 1 - dist / 120) * -1.8;
    const noise =
      Math.sin(x * 0.13) * 0.9 +
      Math.cos(z * 0.12) * 0.75 +
      Math.sin((x + z) * 0.05) * 1.3 +
      Math.random() * 1.4;

    pos.setY(i, bowl + noise);
  }

  geometry.computeVertexNormals();

  const moon = new THREE.Mesh(geometry, lowPolyMaterial(0x7b7d83, 1));
  moon.receiveShadow = true;
  moonGroup.add(moon);

  // Crater rings and resource nodes
  for (let i = 0; i < 38; i++) {
    const radius = THREE.MathUtils.randFloat(2, 10);
    const x = THREE.MathUtils.randFloatSpread(190);
    const z = THREE.MathUtils.randFloatSpread(190);
    createCrater(x, z, radius);
  }

  createResourcePatch(-32, -18, 0x595b60, 'REGOLITH');
  createResourcePatch(38, -30, 0x92dcff, 'ICE');
  createResourcePatch(18, 34, 0xb5bdc9, 'METALS');
}

function createCrater(x, z, radius) {
  const ringGeo = new THREE.TorusGeometry(radius, 0.18, 5, 16);
  const ringMat = lowPolyMaterial(0x6b6e75, 1);
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, 0.35, z);
  ring.scale.y = THREE.MathUtils.randFloat(0.55, 0.9);
  ring.receiveShadow = true;
  moonGroup.add(ring);
}

function createResourcePatch(x, z, colour, label) {
  const group = new THREE.Group();
  group.position.set(x, 0.5, z);

  for (let i = 0; i < 14; i++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(0.7, 1.8), 0),
      lowPolyMaterial(colour, 1)
    );
    rock.position.set(THREE.MathUtils.randFloatSpread(10), 0.4, THREE.MathUtils.randFloatSpread(10));
    rock.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    rock.castShadow = true;
    group.add(rock);
  }

  const marker = createLabel(label, colour);
  marker.position.set(0, 4.2, 0);
  group.add(marker);

  moonGroup.add(group);
}

function createLabel(text, colour) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `#${colour.toString(16).padStart(6, '0')}`;
  ctx.font = 'bold 28px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 42);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(12, 3, 1);
  return sprite;
}

function makeSky() {
  // Earth
  const earth = new THREE.Mesh(
    new THREE.IcosahedronGeometry(8, 2),
    new THREE.MeshStandardMaterial({
      color: 0x2f7eea,
      roughness: 0.7,
      metalness: 0,
      flatShading: true,
      emissive: 0x062651,
      emissiveIntensity: 0.18
    })
  );
  earth.position.set(-76, 58, -110);
  scene.add(earth);

  const earthCloud = new THREE.Mesh(
    new THREE.IcosahedronGeometry(8.3, 1),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      roughness: 1,
      flatShading: true
    })
  );
  earthCloud.position.copy(earth.position);
  scene.add(earthCloud);

  // Stars
  const starGeo = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < 850; i++) {
    positions.push(
      THREE.MathUtils.randFloatSpread(520),
      THREE.MathUtils.randFloat(45, 260),
      THREE.MathUtils.randFloatSpread(520)
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xeaf2ff, size: 0.62, sizeAttenuation: true })
  );
  scene.add(stars);
}

function makeLights() {
  const hemi = new THREE.HemisphereLight(0xbfd3ff, 0x22202a, 1.2);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 3.2);
  sun.position.set(-60, 90, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 260;
  scene.add(sun);
}

function createBaseStarter() {
  const habitat = new THREE.Group();
  habitat.position.set(0, 1, 0);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(4, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    lowPolyMaterial(0xd6dde9)
  );
  dome.castShadow = true;
  habitat.add(dome);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(4.4, 4.8, 1.2, 8),
    lowPolyMaterial(0x9099aa)
  );
  base.position.y = -0.35;
  base.castShadow = true;
  habitat.add(base);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 6, 5),
    lowPolyMaterial(0xcfd7e6)
  );
  antenna.position.set(2.5, 3.2, 1.8);
  antenna.castShadow = true;
  habitat.add(antenna);

  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 0.5, 8, 1, true),
    lowPolyMaterial(0xb7c5de)
  );
  dish.position.set(2.5, 6.3, 1.8);
  dish.rotation.x = Math.PI;
  habitat.add(dish);

  buildingsGroup.add(habitat);

  placeBuildingMesh('solar', -8, 2, true);
}

function canAfford(type) {
  const cost = BUILDINGS[type].cost;
  return Object.entries(cost).every(([res, amount]) => game.resources[res] >= amount);
}

function payFor(type) {
  const cost = BUILDINGS[type].cost;
  for (const [res, amount] of Object.entries(cost)) {
    game.resources[res] -= amount;
  }

  if (type === 'solar') {
    game.resources.power += BUILDINGS[type].powerDelta;
  }
}

function placeBuildingMesh(type, x, z, free = false) {
  if (!free) {
    if (!canAfford(type)) {
      showMessage(`Not enough resources for ${BUILDINGS[type].label}.`);
      return false;
    }
    payFor(type);
  }

  game.buildings[type] += 1;

  const group = new THREE.Group();
  group.position.set(x, 0.7, z);
  group.userData.type = type;

  if (type === 'solar') {
    for (let i = 0; i < 3; i++) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.16, 2.1),
        new THREE.MeshStandardMaterial({
          color: 0x214b91,
          roughness: 0.4,
          metalness: 0.15,
          flatShading: true,
          emissive: 0x031a4c,
          emissiveIntensity: 0.22
        })
      );
      panel.position.set((i - 1) * 4.2, 1.1, 0);
      panel.rotation.x = -0.35;
      panel.castShadow = true;
      group.add(panel);
    }

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.8, 5), lowPolyMaterial(0xa4adbc));
    mast.position.y = 0.2;
    group.add(mast);
  }

  if (type === 'excavator') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.7, 2.5), lowPolyMaterial(0xd1aa63));
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.45, 0.45), lowPolyMaterial(0xb98534));
    arm.position.set(3.1, 1.8, 0);
    arm.rotation.z = -0.35;
    arm.castShadow = true;
    group.add(arm);

    const bucket = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.5), lowPolyMaterial(0x9b6b2e));
    bucket.position.set(5.4, 0.7, 0);
    bucket.castShadow = true;
    group.add(bucket);
  }

  if (type === 'ice') {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 3.6, 8), lowPolyMaterial(0x9be5ff));
    tank.position.y = 2;
    tank.rotation.z = Math.PI / 2;
    tank.castShadow = true;
    group.add(tank);

    const base = new THREE.Mesh(new THREE.BoxGeometry(4, 0.7, 3), lowPolyMaterial(0x536b7a));
    base.position.y = 0.55;
    group.add(base);
  }

  if (type === 'refinery') {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.9, 5, 7), lowPolyMaterial(0xbfc9d9));
    tower.position.y = 2.8;
    tower.castShadow = true;
    group.add(tower);

    const pipe = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.12, 5, 12), lowPolyMaterial(0x8792a7));
    pipe.position.set(0, 1.9, 0);
    pipe.rotation.x = Math.PI / 2;
    group.add(pipe);
  }

  if (type === 'oxygen') {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(2.1, 8, 6), lowPolyMaterial(0x9ce6ff));
    sphere.position.y = 2.3;
    sphere.castShadow = true;
    group.add(sphere);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 0.9, 8), lowPolyMaterial(0x6d8294));
    base.position.y = 0.65;
    group.add(base);
  }

  if (type === 'massDriver') {
    for (let i = 0; i < 13; i++) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 1.1), lowPolyMaterial(0x93a5c9));
      rail.position.set(i * 2.2 - 12, 0.65 + i * 0.03, 0);
      rail.castShadow = true;
      group.add(rail);

      const glow = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.08, 0.1),
        new THREE.MeshStandardMaterial({
          color: 0x80e8ff,
          emissive: 0x35d7ff,
          emissiveIntensity: 0.8,
          roughness: 0.5,
          flatShading: true
        })
      );
      glow.position.set(i * 2.2 - 12, 1.04 + i * 0.03, 0);
      group.add(glow);
    }
    group.rotation.y = -0.26;
  }

  // Foundation pad
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(BUILDINGS[type].footprint, BUILDINGS[type].footprint * 1.1, 0.28, 8),
    lowPolyMaterial(0x4f535d, 1)
  );
  pad.position.y = -0.05;
  pad.receiveShadow = true;
  group.add(pad);

  buildingsGroup.add(group);
  showMessage(`${BUILDINGS[type].label} constructed.`);
  updateHUD();
  return true;
}

function generatePlacement(type) {
  const count = game.buildings[type];
  if (type === 'massDriver') return { x: 30, z: 12 };

  const angle = (buildingsGroup.children.length * 0.83) % (Math.PI * 2);
  const radius = 12 + count * 4 + Math.random() * 8;
  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius
  };
}

function updateProduction(delta) {
  const seconds = delta;

  game.resources.regolith += game.buildings.excavator * 2.1 * seconds;
  game.resources.ice += game.buildings.ice * 1.1 * seconds;

  const refineryRate = game.buildings.refinery * 0.65 * seconds;
  const possibleAl = Math.min(refineryRate, game.resources.regolith / 3);
  game.resources.regolith -= possibleAl * 3;
  game.resources.aluminium += possibleAl;

  const oxygenRate = game.buildings.oxygen * 0.8 * seconds;
  const possibleO2 = Math.min(oxygenRate, game.resources.ice / 2);
  game.resources.ice -= possibleO2 * 2;
  game.resources.oxygen += possibleO2;

  // Data/funding tick for a working base.
  if (game.resources.oxygen > 10 && game.resources.power >= 30) {
    game.resources.funding += 2.2 * seconds;
  }
}

function updateHUD() {
  for (const key of Object.keys(game.resources)) {
    hud[key].textContent = Math.floor(game.resources[key]);
  }

  const objectives = {
    power: game.resources.power >= 30,
    regolith: game.resources.regolith >= 100 || game.resources.aluminium >= 30,
    oxygen: game.resources.oxygen >= 40,
    aluminium: game.resources.aluminium >= 80,
    massDriver: game.buildings.massDriver > 0,
    launch: game.launchComplete
  };

  for (const [key, done] of Object.entries(objectives)) {
    const node = document.querySelector(`[data-obj="${key}"]`);
    if (node) node.classList.toggle('done', done);
  }

  hud.launchBtn.disabled = !(game.buildings.massDriver > 0 && game.resources.aluminium >= 25 && game.resources.oxygen >= 20 && !game.launchComplete);
}

function launchPayload() {
  if (hud.launchBtn.disabled) return;

  game.resources.aluminium -= 25;
  game.resources.oxygen -= 20;

  const payload = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.2, 0),
    new THREE.MeshStandardMaterial({
      color: 0xf3f4ff,
      metalness: 0.25,
      roughness: 0.4,
      flatShading: true,
      emissive: 0x14365d,
      emissiveIntensity: 0.2
    })
  );
  payload.position.set(18, 2, 8);
  payload.castShadow = true;
  payload.userData = {
    t: 0,
    start: new THREE.Vector3(18, 2, 8),
    end: new THREE.Vector3(-18, 38, -50),
    control: new THREE.Vector3(8, 42, -22)
  };

  payloadGroup.add(payload);
  game.launchedPayloads.push(payload);
  game.launchComplete = true;
  showMessage('Payload launched. Orbital construction yard has confirmed capture.');
  updateHUD();
}

function updatePayloads(delta) {
  for (const payload of game.launchedPayloads) {
    payload.userData.t = Math.min(1, payload.userData.t + delta * 0.18);
    const t = payload.userData.t;
    const a = payload.userData.start.clone().lerp(payload.userData.control, t);
    const b = payload.userData.control.clone().lerp(payload.userData.end, t);
    payload.position.copy(a.lerp(b, t));
    payload.rotation.x += delta * 2.6;
    payload.rotation.y += delta * 3.1;
  }
}

function setupInput() {
  window.addEventListener('keydown', (e) => {
    game.keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener('keyup', (e) => {
    game.keys[e.key.toLowerCase()] = false;
  });

  window.addEventListener('wheel', (e) => {
    game.cameraDistance = THREE.MathUtils.clamp(game.cameraDistance + e.deltaY * 0.035, 34, 115);
  }, { passive: true });

  document.querySelectorAll('[data-build]').forEach(button => {
    button.addEventListener('click', () => {
      const type = button.dataset.build;
      const p = generatePlacement(type);
      placeBuildingMesh(type, p.x, p.z);
    });
  });

  hud.launchBtn.addEventListener('click', launchPayload);
}

function updateCamera(delta) {
  const speed = 22 * delta;
  const forward = new THREE.Vector3(Math.sin(game.cameraYaw), 0, Math.cos(game.cameraYaw));
  const right = new THREE.Vector3(Math.cos(game.cameraYaw), 0, -Math.sin(game.cameraYaw));

  if (game.keys.w) game.cameraTarget.addScaledVector(forward, -speed);
  if (game.keys.s) game.cameraTarget.addScaledVector(forward, speed);
  if (game.keys.a) game.cameraTarget.addScaledVector(right, -speed);
  if (game.keys.d) game.cameraTarget.addScaledVector(right, speed);
  if (game.keys.q) game.cameraYaw += delta * 1.5;
  if (game.keys.e) game.cameraYaw -= delta * 1.5;

  game.cameraTarget.x = THREE.MathUtils.clamp(game.cameraTarget.x, -75, 75);
  game.cameraTarget.z = THREE.MathUtils.clamp(game.cameraTarget.z, -75, 75);

  const offset = new THREE.Vector3(
    Math.sin(game.cameraYaw) * game.cameraDistance,
    game.cameraDistance * 0.62,
    Math.cos(game.cameraYaw) * game.cameraDistance
  );

  const targetCameraPos = game.cameraTarget.clone().add(offset);
  camera.position.lerp(targetCameraPos, 0.08);
  camera.lookAt(game.cameraTarget);
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);

  updateProduction(delta);
  updatePayloads(delta);
  updateCamera(delta);

  moonGroup.rotation.y += delta * 0.002;
  updateHUD();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onResize);

makeLights();
makeSky();
makeMoonSurface();
createBaseStarter();
setupInput();
updateHUD();
animate();
