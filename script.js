import * as THREE from 'three';

/* ================= GLOBALS ================= */
let scene, camera, renderer, clock;
let car, sun, terrain;
let speed = 0, rot = 0;
const keys = { w:0, a:0, s:0, d:0 };
const wheels = [];

/* ================= INIT ================= */
init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87b5ff);
  scene.fog = new THREE.Fog(0x87b5ff, 400, 2200);

  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000);
  camera.position.set(0, 8, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  /* ================= LIGHTING ================= */
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));

  sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
  sun.position.set(400, 500, 300);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = -800;
  sun.shadow.camera.right = 800;
  sun.shadow.camera.top = 800;
  sun.shadow.camera.bottom = -800;
  scene.add(sun);

  createTerrain();
  createCar();

  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = 1);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = 0);
  window.addEventListener('resize', onResize);
}

/* ================= TEXTURES ================= */
const loader = new THREE.TextureLoader();

const grassTex = loader.load(
  'https://threejs.org/examples/textures/terrain/grasslight-big.jpg'
);
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
grassTex.repeat.set(60, 60);

/* ================= TERRAIN ================= */
function createTerrain() {
  const geo = new THREE.PlaneGeometry(3000, 3000, 240, 240);
  const p = geo.attributes.position;

  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const h =
      Math.sin(x * 0.003) * 40 +
      Math.cos(y * 0.004) * 35 +
      Math.sin((x + y) * 0.002) * 20;
    p.setZ(i, h);
  }
  geo.computeVertexNormals();

  terrain = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 1
    })
  );
  terrain.rotation.x = -Math.PI / 2;
  terrain.receiveShadow = true;
  scene.add(terrain);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 3000),
    new THREE.MeshStandardMaterial({
      color: 0xc2a07a,
      roughness: 0.9
    })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.8;
  road.receiveShadow = true;
  scene.add(road);
}

/* ================= CAR ================= */
function createCar() {
  car = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.6, 4.9),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.7,
      roughness: 0.25
    })
  );
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.7, 2.1),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3
    })
  );
  cabin.position.y = 0.65;
  cabin.castShadow = true;
  car.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 28);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  [[1.15,1.7],[-1.15,1.7],[1.15,-1.7],[-1.15,-1.7]].forEach(p => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(p[0], -0.3, p[1]);
    w.castShadow = true;
    wheels.push(w);
    car.add(w);
  });

  car.position.y = 1.4;
  scene.add(car);
}

/* ================= UPDATE ================= */
function update(dt) {
  speed += (keys.w ? 50 : keys.s ? -70 : -22) * dt;
  speed = THREE.MathUtils.clamp(speed, 0, 140);

  if (speed > 2) {
    rot += (keys.a ? 1 : keys.d ? -1 : 0) * dt * (1 - speed / 170);
  }

  car.position.x -= Math.sin(rot) * speed * dt;
  car.position.z -= Math.cos(rot) * speed * dt;
  car.rotation.y = rot;

  wheels.forEach(w => w.rotation.x -= speed * dt * 0.15);

  const targetCam = car.position.clone().add(
    new THREE.Vector3(
      Math.sin(rot) * 18,
      8,
      Math.cos(rot) * 18
    )
  );

  camera.position.lerp(targetCam, 0.06);
  camera.lookAt(car.position.x, car.position.y + 2, car.position.z);

  const speedEl = document.getElementById('speed');
  if (speedEl) speedEl.innerText = Math.round(speed).toString().padStart(2, '0');
}

/* ================= LOOP ================= */
function animate() {
  requestAnimationFrame(animate);
  update(clock.getDelta());
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
