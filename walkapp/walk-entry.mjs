// vgallery · 第三人称游客行走 demo（three-player-controller 集成）
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { playerController } from "three-player-controller";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";

// three-mesh-bvh 原型补丁（同步建 BVH；绕开控制器异步 Worker 路径）
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

window.__reportError = (e) => {
  window.__err = String((e && e.stack) || e);
  const el = document.getElementById("loading");
  if (el) {
    el.classList.remove("done");
    el.textContent = "ERROR: " + String((e && e.message) || e).slice(0, 160);
  }
};

async function main() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0c);
  scene.fog = new THREE.Fog(0x0a0a0c, 26, 58);

  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffe8c8, 0.55));
  const key = new THREE.DirectionalLight(0xfff0d8, 0.9);
  key.position.set(6, 12, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8899bb, 0.25);
  fill.position.set(-8, 6, -6);
  scene.add(fill);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.2, 0);

  let loadedCount = 0;
  function tick() {
    loadedCount += 1;
    const bar = document.getElementById("bar-fill");
    if (bar) bar.style.width = Math.round((loadedCount / 2) * 100) + "%";
    if (loadedCount >= 2) document.getElementById("loading")?.classList.add("done");
  }

  const loader = new GLTFLoader();
  const [gallery, tourist] = await Promise.all([
    loader.loadAsync("assets/models/gallery-v3.glb").then((g) => { tick(); return g; }),
    loader.loadAsync("assets/models/characters/tourist.glb").then((g) => { tick(); return g; }),
  ]);

  scene.add(gallery.scene);
  gallery.scene.traverse((o) => { if (o.isLight) o.intensity *= 1.2; });

  const doorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 4.2, 3.4),
    new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1 })
  );
  doorPanel.position.set(12.9, 2.1, 0);
  scene.add(doorPanel);

  // 地板换厚盒子（Blender 导出的单面 plane 会被胶囊碰撞穿透）
  let floorMesh = null;
  gallery.scene.traverse((o) => { if (o.isMesh && o.name === "floor") floorMesh = o; });
  if (floorMesh) {
    const solidFloor = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.6, 13.4), floorMesh.material);
    solidFloor.position.set(0, -0.3, 0);
    solidFloor.name = "floor_solid";
    gallery.scene.add(solidFloor);
    floorMesh.visible = false;
  }

  const clips = tourist.animations;
  const find = (kw) => clips.find((c) => c.name.toLowerCase().includes(kw))?.name || clips[0].name;

  const solids = [];
  gallery.scene.traverse((o) => { if (o.isMesh && o.visible) solids.push(o); });
  solids.push(doorPanel);

  const player = new playerController();
  await player.init({
    scene,
    camera,
    controls,
    playerModelConfig: {
      model: tourist.scene,
      animations: clips,
      // 控制器为厘米制游戏单位（人高=180）：米制场景用 scale 0.01，
      // 速度/重力/相机距离全用默认值（自动按 scale 换算）
      scale: 0.01,
      idleAnim: find("idle"),
      walkAnim: find("walk"),
      runAnim: find("run"),
      jumpAnim: find("idle"),
      rotateY: -Math.PI / 2,
    },
    initPos: new THREE.Vector3(10, 1.5, 0),
    mouseSensitivity: 4,
    enableZoom: true,
    enableSpringCamera: true,
    isShowMobileControls: true,
  });

  // init 的 colliders 参数不生效（实测注册数为 0），改用公开 API 逐件注册；
  // 且必须预计算 boundsTree（控制器的 Worker 异步构建在打包环境失效）
  for (const m of solids) {
    if (!m.geometry.boundsTree) m.geometry.computeBoundsTree();
  }
  for (const m of solids) {
    player.addCollider({ motion: "static", shape: { kind: "mesh", mesh: m } });
  }
  player.onAllEvent();

  window.__player = player;
  window.__scene = scene;
  window.__camera = camera;
  if (new URLSearchParams(location.search).has("debug")) {
    player.setColliderDebug(true);
    player.setPlayerCapsuleDebug(true);
  }

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  (function animate() {
    requestAnimationFrame(animate);
    player.update();
    renderer.render(scene, camera);
  })();
}

main().catch((e) => { window.__reportError(e); console.error(e); });
