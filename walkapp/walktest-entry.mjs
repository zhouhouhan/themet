// vgallery · 功能测试台 v3：三种展品交互
//   type0 图文面板（所有展品的基础层）
//   type1 video  — 全屏播放视频（活画 / 进入画中世界的影片）
//   type2 object — 360° 拖动赏析（皇冠）
//   type3 world  — 进入画中 3D 世界（占位世界，可走动）
import * as THREE from "three";
import { addPiazzaFigures, softenPiazza, detailVitrine } from "./visual-polish.mjs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { playerController } from "three-player-controller";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";

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

// （原占位视频 placeholder-loop 已退役：《托莱多风景》已换成正式活画 toledo-loop.mp4）

// ── v5 展厅 10 幅画：功能绑定 + 图文元数据（Met API 核验） ──
// key = Met objectID（与 GLB 节点 extras.met_object_url 对应）
const ART_BY_MET_ID = {
  "435809": { id: "harvesters", tex: "harvesters", title: "The Harvesters", artist: "Pieter Bruegel the Elder", date: "1565", medium: "Oil on oak", gallery: "Gallery 638", dims: "119 × 162 cm", credit: "Rogers Fund, 1919",
    desc: "A summer day in the wheat fields: workers cut and bundle grain while others rest under a pear tree — among the first Western paintings to treat landscape as the main subject.",
    experience: { kind: "video", src: "assets/video/harvesters-loop.mp4", cropWatermark: true } },
  "436535": { id: "wheat", tex: "wheat", title: "Wheat Field with Cypresses", artist: "Vincent van Gogh", date: "1889", medium: "Oil on canvas", gallery: "Gallery 822", dims: "73.2 × 93.4 cm", credit: "Purchase, The Annenberg Foundation Gift, 1993",
    desc: "Painted during Van Gogh's stay at the asylum of Saint-Rémy, this field of ripe wheat under a swirling sky shows his thick, rhythmic brushwork at full force.",
    experience: { kind: "video", src: "assets/video/wheat-loop.mp4" } },
  "436575": { id: "toledo", tex: "toledo", title: "View of Toledo", artist: "El Greco", date: "ca. 1599–1600", medium: "Oil on canvas", gallery: "Gallery 619", dims: "121.3 × 108.6 cm", credit: "H. O. Havemeyer Collection, Bequest of Mrs. H. O. Havemeyer, 1929",
    desc: "A stormy sky rolls over the city of Toledo — one of the earliest and most dramatic pure landscapes in Spanish painting.",
    experience: { kind: "video", src: "assets/video/toledo-loop.mp4" } },
  "437394": { id: "aristotle", tex: "aristotle", title: "Aristotle with a Bust of Homer", artist: "Rembrandt", date: "1653", medium: "Oil on canvas", gallery: "Gallery 616", dims: "143.5 × 136.5 cm", credit: "Purchase, special contributions and funds given or bequeathed by friends of the Museum, 1961",
    desc: "The philosopher rests his hand on a bust of Homer, wearing a golden chain — Rembrandt's meditation on knowledge, fame and the passage of time.",
    experience: { kind: "video", src: "assets/video/aristotle-loop.mp4" } },
  "436105": { id: "socrates", tex: null, title: "The Death of Socrates", artist: "Jacques Louis David", date: "1787", medium: "Oil on canvas", gallery: "Gallery 634", dims: "129.5 × 196.2 cm", credit: "Catharine Lorillard Wolfe Collection, Wolfe Fund, 1931",
    desc: "Condemned by the Athenian court, Socrates reaches calmly for the cup of hemlock while his friends break down around him — David's image of reason at the moment of death.",
    experience: { kind: "video", src: "assets/video/socrates-loop.mp4", cropV: 0.92 } },
  // 435882 画位挂《Piazza San Marco》（Met 435839）：走进画中的可进入世界
  "435882": { id: "piazza", tex: null, title: "Piazza San Marco", artist: "Canaletto (Giovanni Antonio Canal)", date: "late 1720s", medium: "Oil on canvas", gallery: "Gallery 644", dims: "27 × 44 1/4 in. (68.6 × 112.4 cm)", credit: "Purchase, Mrs. Charles Wrightsman Gift, 1988",
    desc: "Canaletto looks across Venice's grandest square toward the basilica — the procuracies winging away on either side, the campanile piercing a clear morning sky. Step through the frame and walk onto the sunlit pavement.", 
    experience: { kind: "world", src: "assets/models/worlds/piazza-san-marco-v2/piazza-san-marco.glb" } },
  "436524": { id: "sunflowers", tex: null, title: "Sunflowers", artist: "Vincent van Gogh", date: "1887", medium: "Oil on canvas", gallery: "Gallery 825", dims: "43.2 × 61 cm", credit: "Rogers Fund, 1949",
    desc: "Painted in Paris in 1887, before the famous Arles series — cut sunflowers lie on a table like a small fire." },
  "436965": { id: "manet", tex: null, title: "The Monet Family in Their Garden at Argenteuil", artist: "Edouard Manet", date: "1874", medium: "Oil on canvas", gallery: "European Paintings", dims: "61 × 99.7 cm", credit: "Bequest of Joan Whitney Payson, 1975",
    desc: "Manet spent the summer of 1874 with the Monet family at Argenteuil and painted them in the garden — Camille, Jean and Claude, with a rooster in the shade.",
    experience: { kind: "video", src: "assets/video/manet-loop.mp4" } },
  "437869": { id: "pareja", tex: null, title: "Juan de Pareja", artist: "Velázquez", date: "1650", medium: "Oil on canvas", gallery: "Gallery 625", dims: "81.3 × 69.9 cm", credit: "Purchase, Fletcher and Rogers Funds, and Bequest of Miss Adelaide Milton de Groot, 1967",
    desc: "In Rome in 1650 Velázquez painted his assistant Juan de Pareja — and freed him the same year. The portrait was exhibited publicly and made the painter famous.",
    experience: { kind: "video", src: "assets/video/pareja-loop.mp4" } },
  "436122": { id: "degas-collector", tex: null, title: "The Collector of Prints", artist: "Edgar Degas", date: "1866", medium: "Oil on canvas", gallery: "Gallery 815", dims: "53 × 40 cm", credit: "H. O. Havemeyer Collection, Bequest of Mrs. H. O. Havemeyer, 1929",
    desc: "An early Degas: a collector stands in his cabinet, a print in one hand, surrounded by portfolios — a portrait of looking itself.",
    experience: { kind: "video", src: "assets/video/collector-loop.mp4" } },
};

const CROWN = {
  id: "crown",
  title: "Crown of the Virgin of the Immaculate Conception",
  subtitle: "known as the Crown of the Andes",
  artist: "Popayán, Colombia — diadem c. 1660, arches c. 1770",
  desc: "Gold and emerald crown made for a statue of the Virgin; its emeralds include the famous gem said to have been cut for the last Inca emperor, Atahualpa.",
  dims: "H 34.3 cm · W 33.7 cm",
  credit: "Purchase, Lila Acheson Wallace Gift, 2015",
  experience: { kind: "object" },
};

const CTA_TEXT = {
  video: "▶  PLAY THE FILM",
  object: "◉  VIEW IN 360°  —  drag to rotate",
  cinematic: "→  ENTER THE PAINTING",
  world: "→  ENTER THE PAINTING",
};

async function main() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fa3b8);

  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 800);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(innerWidth, innerHeight);
  let dprCap = Math.min(devicePixelRatio, 1.25);         // 高分屏限 1.25：流畅优先，G 键可手动升
  renderer.setPixelRatio(dprCap);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // 阴影总开关常开：画廊灯不投影（零开销），广场世界的太阳灯投影
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // ── 渲染与光照（移植 index.html 的 v5 配方，替换而非叠加平地测试灯光） ──
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0xaaa49a);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    panel.position.y = 8;
    envScene.add(panel);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(envScene, 0.08);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.55;
    pmrem.dispose();
    panel.geometry.dispose();
    panel.material.dispose();
  }
  const ambLight = new THREE.AmbientLight(0xffe8c8, 0.55);
  scene.add(ambLight);
  const key = new THREE.DirectionalLight(0xfff0d8, 0.9);
  key.position.set(6, 12, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8899bb, 0.25);
  fill.position.set(-8, 6, -6);
  scene.add(fill);

  camera.position.set(0, 2.45, 10.7);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.5, 4.5);
  controls.maxPolarAngle = Math.PI * 0.52;

  // ── 加载进度（按字节加权；48MB 的展厅模型占大头） ──
  const loading = document.getElementById("loading") || (() => {
    const d = document.createElement("div");
    d.id = "loading";
    document.body.appendChild(d);
    return d;
  })();
  loading.innerHTML = '<div id="ld-label">LOADING GALLERY</div><div id="bar"><div id="bar-fill"></div></div>';
  const labelEl = document.getElementById("ld-label");
  const fillEl = document.getElementById("bar-fill");

  const ASSETS = [
    { url: "assets/models/gallery-v6.glb", est: 53.0 },
    { url: "assets/models/characters/josh.glb", est: 11.4 },
    { url: "assets/models/objects/crown-opt.glb", est: 2.8 },
  ];
  const progress = new Map();
  let loadedAll = false;
  function pumpProgress() {
    let done = 0, total = 0;
    for (const a of ASSETS) {
      const rec = progress.get(a.url);
      const t = rec && rec.total ? rec.total : a.est * 1024 * 1024;
      const l = rec ? Math.min(rec.loaded, t) : 0;
      done += loadedAll ? t : l;
      total += t;
    }
    const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
    if (fillEl) fillEl.style.width = pct + "%";
    if (labelEl) labelEl.textContent = loadedAll ? "PREPARING SCENE" : `LOADING GALLERY — ${pct}%`;
    return pct;
  }
  pumpProgress();

  const gltfLoader = new GLTFLoader();
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);

  const loadOne = (a) =>
    gltfLoader.loadAsync(a.url, (ev) => {
      progress.set(a.url, { loaded: ev.loaded, total: ev.total || a.est * 1024 * 1024 });
      pumpProgress();
    });

  const [gallery, tourist, crownGltf] = await Promise.all(ASSETS.map(loadOne));
  loadedAll = true;
  pumpProgress();
  // v5 已是米制 / Y-up：原样入场，不旋转、不缩放、不居中
  scene.add(gallery.scene);
  const hemiLight = new THREE.HemisphereLight(0xd5e5ff, 0x765038, 1.6);
  scene.add(hemiLight);

  // 材质与灯光：parquet 运行时修正 + 贴图各向异性；有界灯架（8 射灯 + 皇冠点光）
  {
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const glbLights = [];
    gallery.scene.traverse((o) => {
      if (o.isLight) glbLights.push(o);
      if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; }   // 画廊不用阴影；阴影只在广场世界
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (m.name === "V5 waxed oak parquet") { m.color.setRGB(0.52, 0.40, 0.31); m.roughnessMap = null; m.roughness = 0.22; }
          // 透射玻璃代价极高（three 每帧额外整场景渲染一遍）→ 换成廉价透明材质，视觉近似
          if (m.transmission > 0) {
            m.transmission = 0;
            m.transparent = true;
            m.opacity = 0.18;
            m.roughness = 0.06;
            m.depthWrite = false;
            m.needsUpdate = true;
          }
          // 展柜玻璃单面渲染：走近时玻璃铺满屏幕，双面透明纯烧填充率
          if (m.name === "Museum low iron glass") { m.side = THREE.FrontSide; m.needsUpdate = true; }
          if (m.map) m.map.anisotropy = Math.min(8, maxAniso);
        }
      }
    });
    glbLights.forEach((o) => o.removeFromParent());
    for (const x of [-4.4, 4.4]) for (const z of [-8, 2.5]) {
      const lamp = new THREE.SpotLight(0xffd5a0, 100, 14, Math.PI / 3, 0.7, 2);
      lamp.position.set(x, 5.6, z);
      lamp.target.position.set(Math.sign(x) * 5.95, 2.8, z);
      scene.add(lamp, lamp.target);
    }
    const crownLight = new THREE.PointLight(0xffddb0, 30, 7, 2);
    crownLight.position.set(0, 3.9, -0.7);
    scene.add(crownLight);

    // ── 皇冠展柜重建为真实博物馆尺度（参照 Met 拉美画廊的独立玻璃柜：基座 ~1m + 玻璃罩 ~0.9m） ──
    {
      gallery.scene.updateMatrixWorld(true);
      let glassMesh = null, crownNode = null;
      const merged = {};                       // 全馆合并网格：旧巨座/立柱/顶架都埋在这些里面
      gallery.scene.traverse((o) => {
        if (crownNode === null && !o.isMesh && o.name && o.name.toUpperCase().includes("CROWN")) crownNode = o;
        if (!o.isMesh) return;
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        if (!m || !m.name) return;
        if (m.name === "Museum low iron glass" && !glassMesh) glassMesh = o;
        merged[m.name] = merged[m.name] || o;
      });

      // 1) 旧 4.3m 巨座与鎏金柱架的几何埋在全馆合并网格里 → 盒内三角外科切除（旧玻璃罩直接下线）
      //    切割盒先变换到各网格本地空间再做逐顶点判断，避免百万级矩阵运算阻塞主线程
      const cutBoxesW = [
        new THREE.Box3(new THREE.Vector3(-0.9, -0.05, -1.5), new THREE.Vector3(0.9, 1.8, 0.08)),    // 黑大理石巨座
        new THREE.Box3(new THREE.Vector3(-1.05, 1.5, -1.65), new THREE.Vector3(1.05, 5.3, 0.25)),   // 白衬台 + 鎏金立柱 + 顶架
        new THREE.Box3(new THREE.Vector3(-1.6, -0.05, -2.1), new THREE.Vector3(1.6, 0.3, 0.5)),     // 地面宽底板
      ];
      const cutNames = ["Portoro marble", "Ivory collection cards", "Cream veined marble", "Polished gilt highlights", "Aged gilt moulding", "Recessed antique bronze", "Carved walnut furniture"];
      const inv = new THREE.Matrix4(), tv = new THREE.Vector3(), tmn = new THREE.Vector3(), tmx = new THREE.Vector3();
      for (const name of cutNames) {
        const mesh = merged[name];
        if (!mesh) continue;
        const g = mesh.geometry, pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, idx = g.index;
        if (!pos || !idx || !nor) continue;
        inv.copy(mesh.matrixWorld).invert();
        const localBoxes = cutBoxesW.map((b) => {
          tmn.set(1e9, 1e9, 1e9); tmx.set(-1e9, -1e9, -1e9);
          for (let i = 0; i < 8; i++) {
            tv.set((i & 1) ? b.max.x : b.min.x, (i & 2) ? b.max.y : b.min.y, (i & 4) ? b.max.z : b.min.z).applyMatrix4(inv);
            tmn.min(tv); tmx.max(tv);
          }
          return new THREE.Box3(tmn.clone(), tmx.clone());
        });
        const inAnyCut = (i) => {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          for (const b of localBoxes) if (x >= b.min.x && x <= b.max.x && y >= b.min.y && y <= b.max.y && z >= b.min.z && z <= b.max.z) return true;
          return false;
        };
        const remap = new Map(), p = [], n = [], u = [], ix = [];
        for (let t = 0; t < idx.count / 3; t++) {
          const vi = [idx.getX(t * 3), idx.getX(t * 3 + 1), idx.getX(t * 3 + 2)];
          if (inAnyCut(vi[0]) && inAnyCut(vi[1]) && inAnyCut(vi[2])) continue;
          for (const v0 of vi) {
            if (!remap.has(v0)) {
              remap.set(v0, p.length / 3);
              p.push(pos.getX(v0), pos.getY(v0), pos.getZ(v0));
              n.push(nor.getX(v0), nor.getY(v0), nor.getZ(v0));
              if (uv) u.push(uv.getX(v0), uv.getY(v0));
            }
          }
          ix.push(remap.get(vi[0]), remap.get(vi[1]), remap.get(vi[2]));
        }
        const ng = new THREE.BufferGeometry();
        ng.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
        ng.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3));
        if (uv) ng.setAttribute("uv", new THREE.Float32BufferAttribute(u, 2));
        ng.setIndex(ix);
        mesh.geometry = ng;
      }
      if (glassMesh) glassMesh.visible = false;

      // 2) 程序化新展柜：黑色大理石基座 + 低铁玻璃罩（复用原材质）
      const CX = 0, CZ = -0.7, PED_W = 0.95, PED_H = 1.02, PED_D = 0.95, GW = 0.86, GH = 0.92, GD = 0.86, T = 0.012;
      const pedMat = merged["Portoro marble"] ? merged["Portoro marble"].material : new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.35 });
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(PED_W, PED_H, PED_D), pedMat);
      pedestal.position.set(CX, PED_H / 2, CZ);
      gallery.scene.add(pedestal);
      const glassMat = new THREE.MeshPhysicalMaterial({ name: "Refined low iron vitrine", color: 0xf1faf7, transparent: true, opacity: 0.12, roughness: 0.075, metalness: 0, transmission: 0, ior: 1.46, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.65, depthWrite: false, side: THREE.FrontSide });
      const hood = new THREE.Group();
      const pane = (w, h, d, x, y, z) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat);
        m.position.set(x, y, z); hood.add(m);
      };
      pane(GW, GH, T, CX, PED_H + GH / 2, CZ - GD / 2);
      pane(GW, GH, T, CX, PED_H + GH / 2, CZ + GD / 2);
      pane(T, GH, GD, CX - GW / 2, PED_H + GH / 2, CZ);
      pane(T, GH, GD, CX + GW / 2, PED_H + GH / 2, CZ);
      pane(GW, T, GD, CX, PED_H + GH, CZ);
      gallery.scene.add(hood);
      detailVitrine(gallery.scene, CX, CZ, PED_W, PED_H, PED_D);
      crownLight.position.set(CX, PED_H + GH + 0.4, CZ);

      // 3) 皇冠落到新基座顶面（后续"真实尺寸"逻辑保持该底面）
      if (crownNode) {
        const bb = new THREE.Box3().setFromObject(crownNode);
        crownNode.position.y += PED_H - bb.min.y;
        crownNode.updateMatrix();
        gallery.scene.updateMatrixWorld(true);
      }
    }
  }

  // 静态布景：冻结矩阵自动更新（约 50 个网格，每帧省一次矩阵遍历）
  gallery.scene.updateMatrixWorld(true);
  gallery.scene.traverse((o) => { o.matrixAutoUpdate = false; });

  // ── 碰撞代理（隐藏；不为主体精细 GLB 建 BVH） ──
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  const proxies = [];
  function addProxy(name, sx, sy, sz, px, py, pz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), proxyMat);
    m.name = name;
    m.position.set(px, py, pz);
    scene.add(m);
    proxies.push(m);
    return m;
  }
  addProxy("proxy_floor", 12.6, 0.6, 24.6, 0, -0.3, 0);                 // 大厅地板（顶面 Y=0）
  addProxy("proxy_wall_w", 0.4, 10, 24.6, -6.2, 5, 0);                   // 西墙
  addProxy("proxy_wall_e", 0.4, 10, 24.6, 6.2, 5, 0);                    // 东墙
  addProxy("proxy_wall_back", 12.6, 6, 0.4, 0, 3, -12.2);               // 后墙（画墙）
  addProxy("proxy_wall_front", 12.6, 6, 0.4, 0, 3, 12.2);               // 前墙（门洞暂全封，后续按需开门）
  addProxy("proxy_vitrine", 1.08, 2.0, 1.08, 0, 1.0, -0.7);             // 皇冠展柜（重建后 ~0.95×1.95×0.95）

  // Passage views extend beyond the visitor boundary; the velvet ropes mark it.
  for (const z of [-11.4, 11.4]) addProxy('proxy_rope_boundary_' + z, 3.1, 10, .18, 0, 5, z);

  // Piazza San Marco 画中世界的物理：地面代理（顶面 Y=0，角色落地）+ 活动边界墙。
  // 区域 z∈[45, 64]、x∈[-8, 8]（墙体内缘留出胶囊半径余量），远离画廊碰撞体（画廊 z≤±12.2）互不干扰。
  addProxy("proxy_piazza_floor", 20, 0.6, 26, 0, -0.3, 54.5);
  addProxy("proxy_piazza_wall_xn", 0.4, 12, 26, -8.4, 5, 54.5);
  addProxy("proxy_piazza_wall_xp", 0.4, 12, 26, 8.4, 5, 54.5);
  addProxy("proxy_piazza_wall_zn", 20, 12, 0.4, 0, 5, 44.6);
  addProxy("proxy_piazza_wall_zp", 20, 12, 0.4, 0, 5, 64.4);
  // One dim pool per portal preserves the sightline; deeper pools cost shader time
  // on every fragment of the whole hall (point lights are global in three.js).
  for (const sign of [-1, 1]) for (const distance of [15]) {
    const pool = new THREE.PointLight(0xffdcac, 18, 9, 2);
    pool.position.set(0, 3.9, sign * distance); scene.add(pool);
  }

  // ── 皇冠改为真实尺寸（Crown of the Andes 高 34.3cm），底面保持落在原台座上 ──
  let crownCenterWorld = new THREE.Vector3(0, 2.6, -0.7);
  {
    let crownNode = null;
    gallery.scene.traverse((o) => { if (/CROWN/i.test(o.name || "")) crownNode = crownNode || o; });
    if (crownNode) {
      const b0 = new THREE.Box3().setFromObject(crownNode);
      const size0 = b0.getSize(new THREE.Vector3());
      const sReal = 0.343 / size0.y;
      crownNode.scale.multiplyScalar(sReal);
      crownNode.updateMatrix();
      gallery.scene.updateMatrixWorld(true);
      const b1 = new THREE.Box3().setFromObject(crownNode);
      const c0 = b0.getCenter(new THREE.Vector3());
      const c1 = b1.getCenter(new THREE.Vector3());
      crownNode.position.x += c0.x - c1.x;
      crownNode.position.z += c0.z - c1.z;
      crownNode.position.y += b0.min.y - b1.min.y;
      crownNode.updateMatrix();      // 底面对齐
      gallery.scene.updateMatrixWorld(true);
      const b2 = new THREE.Box3().setFromObject(crownNode);
      crownCenterWorld = b2.getCenter(new THREE.Vector3());
      console.log("[v5] crown real size:", b2.getSize(new THREE.Vector3()).toArray().map((v) => +v.toFixed(3)));
    }
  }

  // Entrance architecture is authored in v6; do not add another blocking red panel.
  const entranceRecords = await fetch('assets/paintings/met-originals/entrance-v6.json').then(r => { if (!r.ok) throw new Error('Entrance collection metadata failed'); return r.json(); });
  for (const rec of entranceRecords) ART_BY_MET_ID[String(rec.objectID)] = {
    id: 'met-' + rec.objectID, tex: null, title: rec.title, artist: rec.artistDisplayName,
    date: rec.objectDate, gallery: rec.department,
    desc: rec.desc || `${rec.title} — ${rec.artistDisplayName}, ${rec.objectDate}. From the Metropolitan Museum of Art’s ${rec.department} collection.`,
    medium: rec.medium || '', credit: rec.creditLine || '', dims: rec.dimensions || ''
  };
  // 《特洛伊妇女》：点"进入这个世界"→ 全屏播放走近画中的演示片（E 随时退出）
  if (ART_BY_MET_ID['435908']) ART_BY_MET_ID['435908'].experience = { kind: 'cinematic', src: 'assets/video/trojan-women.mp4' };
  // 《乐师》：与《收获者》同款画框内活画
  if (ART_BY_MET_ID['435844']) ART_BY_MET_ID['435844'].experience = { kind: 'video', src: 'assets/video/musicians-loop.mp4' };
  // ── 展品：从 GLB 画布节点绑定（世界空间 Box3 取中心 + 轴向定法线） ──
  const exhibits = [];
  gallery.scene.updateMatrixWorld(true);
  gallery.scene.traverse((o) => {
    if (!o.isMesh || !/^ART/i.test(o.name || "")) return;
    const metId = (o.name.match(/(\d{6})/) || [])[1];
    const rec = metId && ART_BY_MET_ID[metId];
    const box = new THREE.Box3().setFromObject(o);
    const center = box.getCenter(new THREE.Vector3());
    // 法线：侧墙（|x| 大）指向厅内；后墙（z 很负）指向 +Z
    let normal;
    if (Math.abs(center.x) > 5.5) normal = new THREE.Vector3(center.x > 0 ? -1 : 1, 0, 0);
    else normal = new THREE.Vector3(0, 0, center.z > 0 ? -1 : 1);
    const trigger = new THREE.Vector3(
      center.x + normal.x * 1.7,
      0,
      center.z + normal.z * 1.7
    );
    const size = box.getSize(new THREE.Vector3());
    exhibits.push({
      data: rec || { id: "met-" + metId, title: o.name, artist: "", date: "", desc: "", gallery: "" },
      metId,
      type: "painting",
      center,
      normal,
      size,
      pos: trigger,
      radius: 2.0,
    });
  });
  exhibits.push({
    data: CROWN, type: "crown",
    center: crownCenterWorld.clone(),
    normal: new THREE.Vector3(0, 0, 1),
    pos: new THREE.Vector3(0, 0, 0.9),
    radius: 2.4,
  });
  window.__exhibits = exhibits;

  // ── 435882 画位换挂《Piazza San Marco》：原塞尚画布下线，原画框（合并网格）保留，
  //    画面铺满整个框内口（无衬边）；横纵比差异用纹理左偏裁切消化（保住左侧钟楼） ──
  {
    const piazzaRec = exhibits.find((x) => x.metId === "435882");
    let canvasMesh = null;
    gallery.scene.traverse((o) => {
      if (!canvasMesh && o.isMesh && (o.name || "").includes("435882")) canvasMesh = o;
    });
    if (piazzaRec && canvasMesh) {
      const c = piazzaRec.center.clone();
      const n = piazzaRec.normal.clone();
      const openW = Math.abs(n.x) > 0.5 ? piazzaRec.size.z : piazzaRec.size.x;
      const openH = piazzaRec.size.y;
      const aspect = 3971 / 2448;                       // 本地原画像素比（Met 435839）
      const pw = openW + 0.02;                          // 铺满框内口并压住框唇 1cm
      const ph = openH + 0.02;
      canvasMesh.visible = false;
      const mount = (w, h, off, mat) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        m.position.copy(c).addScaledVector(n, off);
        m.lookAt(m.position.clone().add(n));
        gallery.scene.add(m);
        return m;
      };
      mount(pw, ph, 0.012,
        new THREE.MeshStandardMaterial({ color: 0x4d1218, roughness: 0.95, metalness: 0 }));
      const tex = await new THREE.TextureLoader().loadAsync("assets/paintings/piazza-san-marco.jpg");
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      // cover 裁切：平面比原画"更方"，横向只显示左侧部分（钟楼/主教座堂都在左半），右侧连排拱廊裁掉
      tex.repeat.set(Math.min(1, (pw / ph) / aspect), 1);
      tex.offset.set(0, 0);
      mount(pw, ph, 0.022,
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0 }));
      // 展品记录同步为新画幅（锁定机位距离、Pip 栖息偏移都读这里）
      if (Math.abs(n.x) > 0.5) piazzaRec.size.set(0.02, ph, pw);
      else piazzaRec.size.set(pw, ph, 0.02);
      console.log("[v6] 435882 → Piazza San Marco mounted", pw.toFixed(3), "x", ph.toFixed(3));
    }
  }

  // ── 画框内视频层：视频以原画尺寸精确覆盖在画布上（"画活过来"） ──
  const videoPlanes = new Map();     // exhibit.id -> { mesh, video }
  function ensureVideoPlane(e, src) {
    if (videoPlanes.has(e.data.id)) return videoPlanes.get(e.data.id);
    const v = document.createElement("video");
    v.src = src;
    v.loop = true;
    v.muted = true;                  // 与 Audio Guide 并存，默认静音
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    // 尺寸适配：按视频真实宽高比做 cover 裁切 —— 不变形，铺满画布（16:9 源顺带裁掉水印）
    const planeAspect = (Math.abs(e.normal.x) > 0.5 ? e.size.z : e.size.x) / e.size.y;
    const applyCoverFit = () => {
      const va = (v.videoWidth && v.videoHeight) ? v.videoWidth / v.videoHeight : 16 / 9;
      if (va > planeAspect) {
        const r = planeAspect / va;
        tex.repeat.set(r, 1); tex.offset.set((1 - r) / 2, 0);
      } else {
        const r = va / planeAspect;
        tex.repeat.set(1, r); tex.offset.set(0, (1 - r) / 2);
      }
      const cv = (e.data.experience || {}).cropV || 1;   // 额外垂直居中裁切：遮掉源视频自带的上下黑边
      if (cv < 1) { tex.repeat.y *= cv; tex.offset.y = (1 - tex.repeat.y) / 2; }
    };
    if (v.videoWidth) applyCoverFit();
    else v.addEventListener("loadedmetadata", applyCoverFit, { once: true });
    // 画布尺寸 → 平面宽高（侧墙用 z 向宽度，后墙用 x 向宽度）
    const horizontal = Math.abs(e.normal.x) > 0.5 ? e.size.z : e.size.x;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(horizontal, e.size.y),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    // 朝向与画布法线一致
    plane.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), e.normal);
    plane.position.copy(e.center).addScaledVector(e.normal, 0.03);
    plane.visible = false;
    scene.add(plane);
    const rec = { plane, video: v };
    videoPlanes.set(e.data.id, rec);
    return rec;
  }
  function playInFrame(e) {
    const xp = e.data.experience;
    if (!xp || xp.kind !== "video") return;
    const rec = ensureVideoPlane(e, xp.src);
    rec.plane.visible = false;
    rec.video.currentTime = 0;
    rec.video.play().then(()=>{if(current===e && uiOpen==="focus")rec.plane.visible=true;}).catch(()=>{rec.plane.visible=false;toast("Video could not play. The original painting remains on display.");});
  }
  function stopAllInFrame() {
    for (const rec of videoPlanes.values()) {
      rec.video.pause();
      rec.plane.visible = false;
    }
  }

  // 360° 赏析使用的皇冠副本（原始未变换）
  const crownForViewer = crownGltf.scene.clone(true);

  // ── 交互 UI（占位样式） ──
  const css = document.createElement("style");
  css.textContent = `
    #hint { position:fixed; left:50%; bottom:64px; transform:translateX(-50%); z-index:30;
      color:#fff; background:rgba(10,10,14,.72); padding:10px 18px; border-radius:6px;
      font:15px/1.4 Georgia,serif; letter-spacing:.04em; display:none; pointer-events:none; }
    .close { position:absolute; top:22px; right:30px; cursor:pointer; color:#c9b47e;
      font-size:14px; letter-spacing:.1em; z-index:60; }
    .tag { position:absolute; top:24px; left:30px; color:#c9b47e; border:1px solid #c9b47e55;
      padding:4px 10px; font:11px/1 Georgia,serif; letter-spacing:.14em; z-index:60; }
    #dim { position:fixed; inset:0; z-index:44; display:none; background:rgba(8,8,12,.22); pointer-events:none; }
    /* 苹果式磨砂玻璃卡片：backdrop-filter 实时模糊背后场景 */
    #card { position:fixed; left:22px; top:22px; max-height:calc(100vh - 44px); z-index:45; display:none;
      width:min(540px, 44vw); overflow:auto; color:#1d1a17; scrollbar-width:none;
      background:linear-gradient(160deg, rgba(253,251,247,.66), rgba(243,238,230,.58) 55%, rgba(238,233,224,.68));
      -webkit-backdrop-filter:blur(30px) saturate(170%) brightness(1.06);
      backdrop-filter:blur(30px) saturate(170%) brightness(1.06);
      border:1px solid rgba(255,255,255,.62);
      border-radius:20px; padding:30px 34px 26px;
      box-shadow:0 24px 70px rgba(0,0,0,.42), 0 2px 10px rgba(0,0,0,.2),
        inset 0 1px 0 rgba(255,255,255,.75), inset 0 0 46px rgba(255,255,255,.16);
      font-family:Georgia,'Times New Roman',serif; }
    #card::-webkit-scrollbar { width:0; height:0; }
    #card::before { content:""; position:absolute; inset:0; border-radius:20px; pointer-events:none;
      background:linear-gradient(115deg, rgba(255,255,255,.22), rgba(255,255,255,.05) 38%, transparent 60%);
      mix-blend-mode:screen; }
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      #card { background:rgba(249,246,241,.97); }
    }
    #card .close { position:absolute; top:18px; right:20px; color:#7a746c; font-size:16px; cursor:pointer; }
    #card .eyebrow { font:11px/1 Georgia,serif; letter-spacing:.2em; text-transform:uppercase;
      color:#7c2a34; margin-bottom:10px; text-shadow:0 1px 5px rgba(255,255,255,.5); }
    #card h1 { font-size:30px; text-shadow:0 1px 8px rgba(255,255,255,.45); line-height:1.15; font-weight:400; letter-spacing:.01em; margin-bottom:8px; }
    #card .clinemeta { font:11px/1 Georgia,serif; letter-spacing:.16em; text-transform:uppercase;
      color:#5d574f; margin-bottom:14px; text-shadow:0 1px 5px rgba(255,255,255,.5); }
    #card .desc { font-size:14.5px; line-height:1.7; color:#2b2721; margin-bottom:12px; text-shadow:0 1px 6px rgba(255,255,255,.55); }
    #card .btns { display:flex; flex-wrap:wrap; gap:10px; margin:20px 0 16px; }
    #card .btns button { font:14px Georgia,serif; padding:13px 20px; border-radius:12px; cursor:pointer;
      border:1px solid rgba(255,255,255,.7); background:rgba(255,255,255,.5); color:#2c2823;
      letter-spacing:.03em; box-shadow:0 1px 3px rgba(0,0,0,.08); }
    #card .btns button:active { transform:scale(.985); }
    #card .btns .piphint { flex-basis:100%; font-size:10.5px; letter-spacing:.13em; color:#7a5f24; padding:0 2px; text-shadow:0 1px 4px rgba(255,255,255,.55); }
    #card .btns button.primary { background:#7c2029; border-color:#7c2029; color:#f7f1e6; }
    #card .btns button:hover { filter:brightness(1.06); }
    #card .stats { border-top:1px solid rgba(0,0,0,.1); border-bottom:1px solid rgba(0,0,0,.1);
      padding:13px 0; display:grid; grid-template-columns:1fr 1fr; gap:12px 20px; }
    #card .stats .k { font:10px/1 Georgia,serif; letter-spacing:.16em; text-transform:uppercase; color:#736e64; margin-bottom:5px; text-shadow:0 1px 4px rgba(255,255,255,.5); }
    #card .stats .v { font-size:13px; line-height:1.5; color:#26221c; text-shadow:0 1px 5px rgba(255,255,255,.55); }
    #card .foot { display:flex; justify-content:space-between; gap:12px; margin-top:14px;
      font:9.5px/1.5 Georgia,serif; letter-spacing:.13em; text-transform:uppercase; color:#847d72; text-shadow:0 1px 4px rgba(255,255,255,.5); }
    #toast { position:fixed; left:50%; bottom:56px; transform:translateX(-50%); z-index:70; display:none;
      background:rgba(16,16,20,.92); color:#e8e2d6; padding:12px 22px; border-radius:8px;
      font:14px Georgia,serif; letter-spacing:.05em; }
    /* Pip AI 问答面板（磨砂，与信息卡同语言） */
    #pipchat { position:fixed; right:22px; bottom:44px; width:min(400px, 42vw); z-index:55; display:none;
      background:rgba(20,18,24,.72); backdrop-filter:blur(24px) saturate(140%); -webkit-backdrop-filter:blur(24px) saturate(140%);
      border:1px solid rgba(201,180,126,.35); border-radius:14px; padding:14px; color:#efe9dc;
      font-family:Georgia,serif; box-shadow:0 18px 50px rgba(0,0,0,.5); }
    #pipchat .pchead { font-size:12px; letter-spacing:.22em; color:#c9b47e; display:flex; justify-content:space-between; margin-bottom:10px; }
    #pipchat .pchead span { letter-spacing:.1em; color:#8f8672; }
    #pipchat .pcmsgs { max-height:34vh; overflow-y:auto; display:flex; flex-direction:column; gap:8px; margin-bottom:10px; }
    #pipchat .pcmsg { padding:9px 12px; border-radius:10px; font-size:13.5px; line-height:1.55; white-space:pre-wrap; }
    #pipchat .pcmsg.user { align-self:flex-end; background:rgba(201,180,126,.18); border:1px solid rgba(201,180,126,.3); }
    #pipchat .pcmsg.pip { align-self:flex-start; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); }
    #pipchat .pcrow { display:flex; gap:8px; }
    #pipchat input { flex:1; background:rgba(255,255,255,.08); border:1px solid rgba(201,180,126,.3); border-radius:8px; padding:9px 12px; color:#fff; font:14px Georgia,serif; outline:none; }
    #pipchat input:focus { border-color:#c9b47e; }
    #pipchat button { background:#7a1f2b; color:#f3e9d2; border:none; border-radius:8px; padding:0 14px; cursor:pointer; font-size:15px; }
    #vid { position:fixed; inset:0; z-index:50; display:none; background:#0b0a09; }
    #vid .wrap { position:absolute; inset:3vmin; overflow:hidden; }
    #vid video { width:100%; height:100%; object-fit:contain; display:block; }
    /* 鎏金画框：压在视频边缘之上，把源视频边角的工具水印挡在画框外 */
    #vid .gilt { position:absolute; inset:3vmin; pointer-events:none;
      border: 3.4vmin solid transparent;
      border-image: linear-gradient(135deg, #e2c274, #8a6a24 20%, #f4dd96 38%, #6b4f16 55%, #d0ac52 76%, #7c5e1e) 1;
      box-shadow: inset 0 0 0 .5vmin rgba(58,42,10,.9), inset 0 0 2.8vmin rgba(0,0,0,.6), 0 0 5vmin rgba(0,0,0,.85); }
    #vid .cap { position:absolute; left:50%; bottom:44px; transform:translateX(-50%); text-align:center;
      color:#e8e8e8; font-family:Georgia,serif; text-shadow:0 1px 6px #000; }
    #vid h1 { font-size:19px; letter-spacing:.05em; font-weight:400; }
    #vid h2 { font-size:12px; color:#c9b47e; letter-spacing:.1em; margin-top:4px; font-weight:400; }
    #vid p { font-size:13px; line-height:1.65; color:#cdcdcd; margin-top:12px; max-width:760px; }
    #vid .cap, #vid .close, #vid .tag { transition: opacity .4s; }
    #obj { position:fixed; inset:0; z-index:50; display:none; pointer-events:none; }
    #obj .close { pointer-events:auto; }
    #obj .cap { position:absolute; left:50%; bottom:60px; transform:translateX(-50%); width:min(660px,86vw);
      text-align:center; color:#eee; font-family:Georgia,serif; text-shadow:0 1px 6px #000; }
    #obj h1 { font-size:21px; letter-spacing:.05em; font-weight:400; }
    #obj h2 { font-size:12px; color:#c9b47e; letter-spacing:.08em; margin:5px 0 14px; font-weight:400; }
    #obj p { font-size:14px; line-height:1.7; color:#d6d6d6; }
    #obj .grab { font-size:12px; color:#c9b47e; letter-spacing:.16em; margin-top:14px; }
  `;
  css.textContent += `
    @media(max-width:700px){
      #card{left:10px;right:10px;top:10px;bottom:100px;width:auto;padding:24px 20px;}
      #card h1{font-size:25px;}#card .btns button{padding:11px 14px;}
      #pipchat{left:10px;right:10px;bottom:100px;width:auto;}
      #pipchat input{min-width:0;}#hint,#worldload{max-width:92vw;font-size:12px;text-align:center;}
      #title{max-width:90vw;font-size:13px;}#hud{font-size:10px;max-width:95vw;}
    }
  `;
  document.head.appendChild(css);

  const hintEl = document.createElement("div");
  hintEl.id = "hint";
  document.body.appendChild(hintEl);

  const dimEl = document.createElement("div");
  dimEl.id = "dim";
  document.body.appendChild(dimEl);

  const card = document.createElement("div");
  card.id = "card";
  card.innerHTML = `
    <div class="close" id="cd-close">✕</div>
    <div class="eyebrow" id="cd-eyebrow"></div>
    <h1 id="cd-title"></h1>
    <div class="clinemeta" id="cd-meta"></div>
    <p class="desc" id="cd-desc"></p>
    <div class="btns" id="cd-btns"></div>
    <div class="stats" id="cd-stats"></div>
    <div class="foot"><span>⏎ SELECT · A AUDIO · Q PIP · E CLOSE</span><span>THE MET · UNOFFICIAL TRIBUTE</span></div>`;
  document.body.appendChild(card);

  const toastEl = document.createElement("div");
  toastEl.id = "toast";
  document.body.appendChild(toastEl);
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.style.display = "none"; }, 2200);
  }

  const vidEl = document.createElement("div");
  vidEl.id = "vid";
  vidEl.innerHTML = `<div class="tag" id="vid-tag">PLACEHOLDER FOOTAGE</div><div class="close">CLOSE — E</div><div class="wrap"><video id="vid-player" loop playsinline></video></div><div class="gilt"></div><div class="cap"><h1 id="vid-title"></h1><h2 id="vid-sub"></h2><p id="vid-desc"></p></div>`;
  document.body.appendChild(vidEl);

  const objEl = document.createElement("div");
  objEl.id = "obj";
  objEl.innerHTML = `<div class="close">CLOSE — E</div><div class="cap"><h1 id="obj-title"></h1><h2 id="obj-sub"></h2><p id="obj-desc"></p><div class="grab">DRAG TO ROTATE</div></div>`;
  document.body.appendChild(objEl);

  // ── 360° 赏析专用场景（皇冠）——背景透明，叠加在压暗的实时展厅画面上 ──
  const objScene = new THREE.Scene();
  objScene.background = null;
  const objCamera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 50);
  objCamera.position.set(0, 0.06, 1.25);
  objCamera.lookAt(0, 0, 0);
  objScene.add(new THREE.HemisphereLight(0xffffff, 0x333344, 1.4));
  const objKey = new THREE.DirectionalLight(0xfff0d0, 2.2);
  objKey.position.set(1.5, 2, 2.5);
  objScene.add(objKey);
  const objRim = new THREE.DirectionalLight(0x88aaff, 0.8);
  objRim.position.set(-2, 1, -2);
  objScene.add(objRim);
  const objCrown = crownForViewer;
  objCrown.scale.setScalar(1);
  objCrown.position.set(0, 0, 0);
  objCrown.rotation.set(0, 0, 0);
  {
    const box = new THREE.Box3().setFromObject(objCrown);
    const size = box.getSize(new THREE.Vector3());
    const s = 0.75 / Math.max(size.x, size.y, size.z);
    objCrown.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(objCrown);
    const c = box2.getCenter(new THREE.Vector3());
    objCrown.position.sub(c);
  }
  const objPivot = new THREE.Group();
  objPivot.add(objCrown);
  objScene.add(objPivot);

  let drag = { active: false, x: 0, y: 0, rotY: 0, rotX: 0, tRotY: 0, tRotX: 0 };
  let vidUiTimer = null;
  function pokeVideoUi() {
    const els = vidEl.querySelectorAll(".cap,.close,.tag");
    els.forEach((el) => { el.style.opacity = "1"; });
    clearTimeout(vidUiTimer);
    vidUiTimer = setTimeout(() => els.forEach((el) => { el.style.opacity = "0"; }), 3000);
  }
  addEventListener("mousemove", () => { if (uiOpen === "video") pokeVideoUi(); });

  // ── 玩家 ──
  // 鼠标控制运行时开关（合并自 vgallery-merge-20260915 的 drag-look 重写，保持同名约定）
  window.__vgLookScale = 2.5e-4;        // 拖拽灵敏度系数（- / = 键在此之上再乘 lookSens）
  window.__vgAutoSpin = false;          // 看画模式"停手 2 秒自动旋转"默认关
  window.__vgAllowOrbitDrag = false;    // 恢复 OrbitControls 左键旋转的开关（默认关）
  window.__vgForceMobileUI = false;     // 强制显示移动端虚拟摇杆/按钮
  const player = new playerController();
  await player.init({
    scene,
    camera,
    controls,
    playerModelConfig: {
      model: tourist.scene,
      animations: tourist.animations,
      scale: 0.001,
      idleAnim: "idle1",
      walkAnim: "walk",
      runAnim: "run",
      jumpAnim: ["jump", "Jump_Loop", "Jump_Land"],
      flyAnim: "fly",
      flyIdleAnim: "flyIdle",
      speed: 150,
      runSpeed: 600,
      rotateY: Math.PI,   // 面向 -Z（大厅纵深）
    },
    initPos: new THREE.Vector3(0, 0.15, 6.3),
    mouseSensitivity: 4,
    minCamDistance: 1200,
    maxCamDistance: 3200,
    camLookAtHeightRatio: 0.65,
    enableZoom: true,
    enableSpringCamera: false,
    // 移动端触摸层只在触屏设备创建：它原本无条件盖住桌面右半屏（z-index 998），
    // 把桌面鼠标事件截走，左右半屏手感不一致。__vgForceMobileUI 可强制显示。
    isShowMobileControls: (typeof matchMedia === "function" && matchMedia("(pointer:coarse)").matches) || window.__vgForceMobileUI === true,
  });
  if (player.getPlayerModel()) player.getPlayerModel().scale.multiplyScalar(10);
  player.setPlayerSpeed(1600);
  player.setPlayerRunSpeed(5000);
  player.setGravity(-9800);     // -9.8 m/s²（真实重力；默认 -2400×0.001=-2.4 太飘）
  player.setJumpHeight(4650);   // 起跳初速 4.65 m/s → 约 1.1m 跳高（配 gravity -9.8）

  for (const m of proxies) if (!m.geometry.boundsTree) m.geometry.computeBoundsTree();
  scene.updateMatrixWorld(true);
  for (const m of proxies) player.addCollider({ motion: "static", shape: { kind: "mesh", mesh: m } });
  player.input.buildKeyMap({toggleVehicle:null});
  player.onAllEvent();
  const cameraBlockers = proxies.filter((m) => !m.name.includes("floor"));
  const camRay = new THREE.Raycaster();
  const camRayDir = new THREE.Vector3();
  const camRayOrigin = new THREE.Vector3();
  player.setInput({ moveY: 0 });

  // ── GTA 式拖拽视角（源码层移植自另一台电脑验证过的 drag-look 重写）──
  // 原指针锁定方案的问题：鼠标一动就转；movementX 随硬件 DPI / 系统指针加速放大
  // （跨机器手感不一），指针锁定瞬间的累积位移会直接乘进转向（视角猛跳）。
  // 现方案：彻底禁用 pointer lock；按住左键拖动才转；增量取 clientX 差值，
  // 单事件钳制 ±140px；松开/左键丢失/失焦自动复位。灵敏度统一用 - / = 调整。
  let lookSens = Math.min(2, Math.max(0.25, parseFloat(localStorage.getItem("vg-look-sens")) || 1));
  function adjustLookSens(step) {
    lookSens = Math.min(2, Math.max(0.25, +(lookSens + step).toFixed(2)));
    localStorage.setItem("vg-look-sens", String(lookSens));
    toast("Mouse sensitivity " + Math.round(lookSens * 100) + "%");
  }
  {
    const camSys = player.cam;
    // A. 永不申请指针锁定（保留退出逻辑，防外部残留锁定）。
    // 注意：init 期间 bindEvents 已用原版 setPointerLock 申请过一次锁定（headless/带手势时
    // 会真的锁上），覆盖后再补调一次把残留锁退掉。
    if (camSys) {
      camSys.setPointerLock = function () { if (document.pointerLockElement) document.exitPointerLock(); };
      // init 期间原版已申请过一次锁定；headless 下无手势也放行且授权异步落地，
      // 退出后可能又被补上 —— 分几个时间点重试退出（真实浏览器无此问题：无手势直接拒绝）
      camSys.setPointerLock();
      for (const ms of [120, 400, 1000]) setTimeout(() => { if (document.pointerLockElement && camSys.setPointerLock) camSys.setPointerLock(); }, ms);
    }
    const inp = player.input;
    const UI_HIT = "button,a,input,textarea,select,option,[contenteditable],#pipchat,#card,#vid,#obj";
    // D. 拖拽核心：mousedown 起拖（UI 元素上不拖），mousemove 增量驱动 setToward
    inp.onMouseDown = (e) => {
      if (e.button !== 0 || !player.enableToward) return;
      if (worldRoot?.visible) return;   // 画中世界相机是编排运镜，拖拽无意义
      const t = e.target;
      if (t && t.closest && t.closest(UI_HIT)) return;
      inp.drag = true; inp.dragX = e.clientX; inp.dragY = e.clientY;
      renderer.domElement.style.cursor = "grabbing";
    };
    inp.onMouseUp = () => {
      if (!inp.drag) return;
      inp.drag = false;
      renderer.domElement.style.cursor = "";
    };
    inp.onMouseMove = (e) => {
      if (!inp.drag) return;
      if (typeof e.buttons === "number" && !(e.buttons & 1)) return inp.onMouseUp();
      const dx = e.clientX - inp.dragX, dy = e.clientY - inp.dragY;
      inp.dragX = e.clientX; inp.dragY = e.clientY;
      if (!dx && !dy) return;
      const cl = (v) => Math.abs(v) > 140 ? (v > 0 ? 140 : -140) : v;
      camSys.setToward(cl(dx) * lookSens, cl(dy) * lookSens, window.__vgLookScale);
    };
    // C. 重接事件：去掉 click 重新锁定，挂 mousedown/mouseup/失焦复位
    window.removeEventListener("click", inp.boundMouseClick);
    inp.boundMouseDown = (e) => inp.onMouseDown(e);
    inp.boundMouseUp = () => inp.onMouseUp();
    window.addEventListener("mousedown", inp.boundMouseDown);
    window.addEventListener("mouseup", inp.boundMouseUp);
    window.addEventListener("blur", () => inp.onMouseUp());
    inp.drag = false; inp.dragX = 0; inp.dragY = 0;
    player.enableToward = true;
    window.__vg = { ctrl: player, cam: camSys, input: inp, controls };
    window.__vgMouse = "drag-look";
    // K. 自由漫游的相机每帧由跟随相机重算，OrbitControls 的左键旋转只会打架
    //（表现为"拖动时画面突然滑一下"）；只废左键，滚轮缩放 / 中键 / 右键保留
    controls.mouseButtons.LEFT = -1;
  }

  // ── 状态机 ──
  let uiOpen = null;      // null | "painting" | "video" | "object" | "focus"
  let cinemaOn = false;   // 特洛伊影片正在原画布上播放（uiOpen 保持 "focus"）

  // 全屏 UI 期间吞掉移动键（keydown 捕获阶段拦截；keyup 必须放行，否则按键状态卡死）。
  // 否则控制器会在 UI 打开时记下 WASD，退出瞬间角色带着残留输入自己走掉。
  const GAME_KEY_CODES = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "ShiftLeft", "ShiftRight"]);
  addEventListener("keydown", (ev) => {
    if (ev.target instanceof Element && ev.target.closest('input,textarea,[contenteditable="true"]')) return;
    if ((uiOpen || worldRoot?.visible) && ['KeyF','KeyV'].includes(ev.code)) {ev.preventDefault();ev.stopImmediatePropagation();return;}
    if (uiOpen === "world" && GAME_KEY_CODES.has(ev.code)) return;   // 画中世界：移动键直通控制器，运镜中即可行走
    if (!uiOpen || !GAME_KEY_CODES.has(ev.code)) return;
    // A 键是语音导览热键：吞掉前先替用户点一次 Audio 按钮（此前被拦截器吞掉 → 语音失效）
    if (!ev.repeat && ev.code === "KeyA" && uiOpen === "focus") {
      const ab = [...document.querySelectorAll("#cd-btns button")].find((b) => b.textContent.includes("Audio"));
      if (ab) ab.click();
    }
    ev.stopPropagation();
  }, true);
  function clearHeldKeys() {
    player.input.resetKeys();
    player.playerVelocity.set(0,0,0);
    player.setInput({ moveX: 0, moveY: 0 });
    try {
      Object.assign(player.input, { fwd: false, bkd: false, lft: false, rgt: false, space: false, shift: false, keyFwd: false, keyBkd: false, keyLft: false, keyRgt: false, analogMoveX: 0, analogMoveY: 0 });
      player.keyFwd = player.keyBkd = player.keyLft = player.keyRgt = false;
      player.shift = false;
    } catch {}
  }

  let highlighted = null;
  let current = null;

  // 相机锁定机位：展品偏左、右侧留给信息卡
  let focus = null; // { camFrom, camTo, lookFrom, lookTo, t }
  let savedCamPos = null;   // 打开界面前的相机位置（关闭时还原，保持原视角）
  function focusPose(e) {
    const up = new THREE.Vector3(0, 1, 0);
    if (e.type === "crown") {
      const center = e.center.clone();                        // 展柜内皇冠中心（真实尺寸后）
      const n = new THREE.Vector3(0, 0, 1);                   // 柜正面朝 +Z
      const right = new THREE.Vector3().crossVectors(n, up).normalize();
      const lateral = 0.95;
      const camTo = center.clone().addScaledVector(n, 2.1).addScaledVector(right, lateral);
      const lookTo = center.clone().addScaledVector(right, lateral);
      return { camTo, lookTo };
    }
    const center = e.center.clone();                          // 画布世界空间中心
    const n = e.normal.clone();                               // 指向厅内
    const right = new THREE.Vector3().crossVectors(n, up).normalize();
    // 按画幅自适应：宽画退远以免出框，窄画拉近看清；横向偏移 ≈ 距离×tan20°
    const canvasW = Math.max(e.size ? Math.max(e.size.x, e.size.z) : 1.5, 0.6);
    const dist = Math.min(5.0, Math.max(2.4, canvasW * 1.15));
    const lateral = dist * 0.36;
    // 位置与注视点同样平移：视线严格平行法线 → 正面直视、无斜视；等高 → 无俯仰
    const camTo = center.clone().addScaledVector(n, dist).addScaledVector(right, lateral);
    camTo.y = center.y;
    const lookTo = center.clone().addScaledVector(right, lateral);
    return { camTo, lookTo };
  }

  function openInfo(e) {
    if(document.pointerLockElement)document.exitPointerLock();
    clearHeldKeys();
    current = e;
    player.enableToward = false;   // focus/看画期间拖拽视角不响应（皇冠有自己的拖拽）
    uiOpen = "focus";
    const m = { eyebrow: e.type === "crown" ? "Special Exhibition" : "European Paintings", dims: e.data.dims, credit: e.data.credit };
    document.getElementById("cd-eyebrow").textContent = m.eyebrow || "Collection";
    document.getElementById("cd-title").textContent = e.data.title;
    document.getElementById("cd-meta").textContent = e.type === "crown"
      ? `${e.data.artist}`
      : `${e.data.artist} · ${e.data.date}`;
    document.getElementById("cd-desc").textContent = e.data.desc;

    const btns = document.getElementById("cd-btns");
    btns.innerHTML = "";
    const xp = e.data.experience;
    if (xp && xp.kind !== "video") {
      const b = document.createElement("button");
      b.className = "primary";
      b.textContent = CTA_TEXT[xp.kind].replace(/\s+/g, " ").trim() + "  ⏎";
      b.addEventListener("click", () => startExperience());
      btns.appendChild(b);
    }
    if (xp && xp.kind === "video") {
      playInFrame(e);                 // 画框内直接播放：E 一开就"活"
    } else {
      stopAllInFrame();               // 非视频展品：确保没有残留播放
    }
    if (AUDIO_IDS.has(e.data.id)) {
      const hasAudio = true;
      const b = document.createElement("button");
      b.textContent = "Audio Guide  (A)";
      b.addEventListener("click", () => {
        if (currentAudioId) { stopAudio(); b.textContent = "Audio Guide  (A)"; return; }
        if (!hasAudio) { toast("Audio guide for this work — coming soon"); return; }
        b.textContent = "■ Stop Audio  (A)";
        playAudio(e.data.id, () => { b.textContent = "Audio Guide  (A)"; });
      });
      btns.appendChild(b);
    }
    // Pip 呼出提示（按 Q 或点击小精灵本体）
    const piphint = document.createElement("div");
    piphint.className = "piphint";
    piphint.textContent = "✦ ASK PIP — PRESS Q / CLICK THE SPRITE";
    btns.appendChild(piphint);

    const stats = document.getElementById("cd-stats");
    stats.innerHTML = "";
    for (const [k, v] of [
      ["Dimensions", m.dims || "—"],
      ["Materials", e.type === "crown" ? "Gold, emeralds" : (e.data.medium || "—")],
      ["Credit Line", m.credit || "—"],
      ["Location", e.type === "crown" ? "The Met, Gallery 626" : `The Met, ${e.data.gallery}`],
    ]) {
      const d = document.createElement("div");
      d.innerHTML = `<div class="k"></div><div class="v"></div>`;
      d.querySelector(".k").textContent = k;
      d.querySelector(".v").textContent = v;
      stats.appendChild(d);
    }

    const pose = focusPose(e);
    savedCamPos = camera.position.clone();   // 记住按 E 之前的视角
    const lookFrom = new THREE.Vector3(player.getPosition().x, player.getPosition().y + 1.35, player.getPosition().z);
    focus = { camFrom: camera.position.clone(), camTo: pose.camTo, lookFrom, lookTo: pose.lookTo, t: 0 };

    card.style.display = "block";
    dimEl.style.display = "block";
    pipCardRect = card.getBoundingClientRect();   // Pip 选栖息位时避开信息卡
    hintEl.style.display = "none"; hintEl.textContent = "";
  }

  async function startExperience() {
    const xp = current?.data.experience;
    if (!xp) return;
    stopAudio();
    stopAllInFrame();
    if (xp.kind === "video") {
      card.style.display = "none";
      dimEl.style.display = "none";
      focus = null;
      uiOpen = "video";
      const v = document.getElementById("vid-player");
      v.src = xp.src;
      v.currentTime = 0;
      v.play().catch(() => {});
      document.getElementById("vid-title").textContent = current.data.title;
      document.getElementById("vid-sub").textContent = `${current.data.artist} · ${current.data.date} · ${current.data.gallery}`;
      document.getElementById("vid-desc").textContent = current.data.desc || "";
      document.getElementById("vid-tag").style.display = xp.placeholder ? "block" : "none";
      v.style.transform = xp.cropWatermark ? "scale(1.12) translate(-1%, -2%)" : "none";
      vidEl.style.display = "block";
      pokeVideoUi();
    } else if (xp.kind === "cinematic") {
      // 走进画中：影片直接在原画布上播放（真实 3D 画框环绕，与全馆一致），
      // 镜头推近至画幅充满视口；uiOpen 保持 "focus"，E/ESC 经 closeUI 退出并还原
      if (cinemaOn) return;
      cinemaOn = true;
      card.style.display = "none";
      dimEl.style.display = "none";
      pipCardRect = null;
      stopAllInFrame();
      clearHeldKeys();
      const rec = ensureVideoPlane(current, xp.src);
      rec.video.muted = false;                // 用户点击进入，允许影片出声（无音轨自动兜底静音）
      rec.video.currentTime = 0;
      rec.plane.visible = true;
      rec.video.play().catch(() => { rec.video.muted = true; rec.video.play().catch(() => {}); });
      // 镜头推近：画幅高 ≈ 视口高 95%，真实画框唇口入镜
      const d = THREE.MathUtils.clamp(current.size.y * 0.95, 0.7, 2.2);
      camera.position.copy(current.center).addScaledVector(current.normal, d);
      camera.lookAt(current.center);
      focus = null;                           // 相机定住在近景机位
      hintEl.textContent = "ESC / E — RETURN TO THE GALLERY";
      hintEl.style.display = "block";
    } else if (xp.kind === "world") {
      enterPaintingWorld();                // 走进画中（异步加载，就绪才传送；E 可取消）
    } else if (xp.kind === "object") {
      card.style.display = "none";
      dimEl.style.display = "none";
      focus = null;
      uiOpen = "object";
      drag.rotY = 0; drag.rotX = 0; drag.tRotY = 0; drag.tRotX = 0;
      objPivot.rotation.set(0, 0, 0);
      document.getElementById("obj-title").textContent = current.data.title;
      document.getElementById("obj-sub").textContent = `${current.data.subtitle} · ${current.data.artist}`;
      document.getElementById("obj-desc").textContent = current.data.desc;
      objIdle = 0;
      objEl.style.display = "block";
      renderer.domElement.style.cursor = "grab";   // 可见光标：按住拖动旋转
    }
  }

  function exitWorld() {
    // 返回画廊：可见性、灯光、曝光、FOV、像素比与角色位置逐项还原
    worldIntro = null;
    worldRoot.visible = false;
    worldCurtain.style.opacity = "0";
    gallery.scene.visible = true;
    scene.background = worldSaved.bg;
    scene.environmentIntensity = worldSaved.envInt;
    ambLight.intensity = worldSaved.amb;
    key.intensity = worldSaved.key;
    fill.intensity = worldSaved.fill;
    hemiLight.intensity = worldSaved.hemi;
    camera.fov = worldSaved.fov;
    camera.updateProjectionMatrix();
    camera.rotation.order = "XYZ";
    renderer.toneMappingExposure = worldSaved.exposure;
    dprCap = worldSaved.dprCap;
    dprNow = worldSaved.dprNow;
    renderer.setPixelRatio(dprNow);
    controls.enabled = worldSaved.controlsEnabled;
    controls.target.copy(worldSaved.controlsTarget);
    player.isFlying=worldSaved.isFlying;
    const cap = player.getPlayerCapsule();
    cap.position.copy(worldSaved.playerPos);
    cap.updateMatrixWorld(true);
    clearHeldKeys();
  }

  function closeUI() {
    hintEl.textContent = ""; hintEl.style.display = "none";
    player.enableToward = true;   // 回到自由漫游，拖拽视角恢复
    if (worldLoadToken) { worldLoadToken.cancelled = true; worldLoadToken = null; }   // 加载中退出 = 取消
    cinemaOn = false;
    worldStatus.style.display = "none";
    if (uiOpen === "video") {
      const v = document.getElementById("vid-player");
      v.pause();
      v.style.transform = "none";
      v.style.objectFit = "contain";
      vidEl.style.display = "none";
      clearHeldKeys();                        // 退出回原位站定，不带任何残留移动
    } else if (uiOpen === "object") {
      objEl.style.display = "none";
      objDragging = false;
      renderer.domElement.style.cursor = "";
      clearHeldKeys();
    } else if (uiOpen === "world" || (worldRoot && worldRoot.visible)) {
      // uiOpen 已在运镜结束/自由漫游时释放，但只要还在画中世界就照样还原
      exitWorld();
    }
    stopAllInFrame();
    card.style.display = "none";
    dimEl.style.display = "none";
    pipCardRect = null;
    focus = null;
    if (savedCamPos) { camera.position.copy(savedCamPos); savedCamPos = null; }  // 还原按 E 前的视角
    uiOpen = null;
    current = null;
    stopAudio();
  }

  // ── Pip AI 问答（DeepSeek；移植自 considerate-learning 的 deepseek-client） ──
  const pipChat = { open: false, busy: false, history: [] };
  const chatEl = document.createElement("div");
  chatEl.id = "pipchat";
  chatEl.innerHTML = `
    <div class="pchead">ASK PIP<span>ESC TO CLOSE</span></div>
    <div class="pcmsgs"></div>
    <div class="pcrow"><input type="text" autocomplete="off" placeholder="Ask about this painting or the museum…"><button title="Send">➤</button></div>`;
  document.body.appendChild(chatEl);
  const pcMsgs = chatEl.querySelector(".pcmsgs");
  const pcInput = chatEl.querySelector("input");

  function pipBubble(role, text) {
    const d = document.createElement("div");
    d.className = "pcmsg " + role;
    d.textContent = text;
    pcMsgs.appendChild(d);
    scrollPipChat();
    return d;
  }
  function scrollPipChat() {
    pcMsgs.scrollTop = pcMsgs.scrollHeight;   // 答案更新/增长后始终滚到最新
  }
  function pipContext() {
    const lines = exhibits.map((e) => {
      const bits = [`${e.data.title} — ${e.data.artist}, ${e.data.date}`];
      if (e.data.medium) bits.push(e.data.medium);
      if (e.data.dims) bits.push(e.data.dims);
      if (e.data.gallery) bits.push(e.data.gallery);
      if (e.data.desc) bits.push(e.data.desc);
      return "- " + bits.filter(Boolean).join(" · ");
    });
    const active = (current && current.type === "painting") ? current : highlighted;
    const activeBlock = active
      ? `\n\nThe visitor is currently standing in front of: ${active.data.title} by ${active.data.artist} (${active.data.date}). ${active.data.desc || ""}`
      : "";
    return "You are Pip, the small glowing docent sprite of VGALLERY — a walkable 3D museum that recreates The Metropolitan Museum of Art's European Paintings galleries (an unofficial tribute; the artworks are drawn from the Met collection and arranged in an interpretive virtual setting).\n" +
      "Your job: answer the visitor's questions about the paintings, the artists, and the museum. Be warm and concise (under 120 words unless asked for more); say so plainly when you are not sure about something. Answer in the same language the visitor uses.\n" +
      "Paintings in this hall:\n" + lines.join("\n") + activeBlock;
  }
  async function pipAsk(q) {
    const c = window.DEEPSEEK_CONFIG;
    if (!c || (!c.apiKey && !c.proxyUrl)) { pipBubble("pip", "(The AI guide is not configured — missing js/ai-config.js.)"); return; }
    const request=new AbortController();pipChat.request=request;
    const timeout=setTimeout(()=>request.abort(),30000);
    stopAudio();
    pipChat.busy = true; speaking = true;             // Pip 闪光 = 正在思考/讲话
    const b = pipBubble("pip", "…");
    try {
      const msgs = [{ role: "system", content: pipContext() }, ...pipChat.history.slice(-8), { role: "user", content: q }];
      const res = await fetch(c.proxyUrl || c.endpoint || "https://api.deepseek.com/chat/completions", {
        signal:request.signal,
        method: "POST",
        headers: { "Content-Type": "application/json", ...(c.proxyUrl ? {} : {Authorization: "Bearer " + c.apiKey}) },
        body: JSON.stringify({ model: c.model || "deepseek-v4-flash", messages: msgs, stream: false, temperature: c.temperature ?? 0.5, max_tokens: c.maxTokens ?? 1200 }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const d = await res.json();
      const answer = (d.choices?.[0]?.message?.content || "").trim() || "Hmm — I lost my train of thought. Ask me again?";
      if(request.signal.aborted || !pipChat.open)return;
      b.textContent = answer;
      pipChat.history.push({ role: "user", content: q }, { role: "assistant", content: answer });
      pipChat.history=pipChat.history.slice(-16);
      speaking = false;          // 不做 TTS 播报：浏览器合成音中英夹杂效果差，与开场语音质感不一致
      scrollPipChat();
    } catch (e) {
      b.textContent = "(I could not reach the museum archive just now — try again in a moment.)";
      speaking = false;
      scrollPipChat();
    }
    finally {clearTimeout(timeout);if(pipChat.request===request){pipChat.request=null;pipChat.busy=false;}}
  }
  function togglePipChat(force) {
    pipChat.open = (force !== undefined) ? force : !pipChat.open;
    chatEl.style.display = pipChat.open ? "block" : "none";
    clearHeldKeys();
    if (pipChat.open) {
      if(document.pointerLockElement)document.exitPointerLock();
      if (!pcMsgs.children.length) pipBubble("pip", "Hi! I'm Pip ✦ Ask me anything about the painting in front of you — or the whole museum.");
      setTimeout(() => pcInput.focus(), 60);
    } else {
      pipChat.request?.abort();
      pcInput.blur();
      try { speechSynthesis.cancel(); } catch {}
      if (!pipChat.busy) speaking = false;
    }
  }
  function pipSend() {
    const q = pcInput.value.trim();
    if (!q || pipChat.busy) return;
    pcInput.value = "";
    pipBubble("user", q);
    pipAsk(q);
  }
  chatEl.querySelector("button").addEventListener("click", pipSend);
  pcInput.addEventListener("keydown", (ev) => {
    ev.stopPropagation();                              // 输入时不触发移动与全局快捷键
    if (ev.key === "Enter") { ev.preventDefault(); pipSend(); }
    else if (ev.key === "Escape") togglePipChat(false);
  });

  addEventListener("keydown", (ev) => {
    if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "Space"].includes(ev.code)) maybeStartIntro();
    if (ev.repeat && ["KeyQ","KeyE","KeyG","Enter","NumpadEnter"].includes(ev.code)) return;
    if (ev.code === "Minus" || ev.code === "Equal") { adjustLookSens(ev.code === "Equal" ? 0.1 : -0.1); return; }
    if (ev.code === "KeyQ") { togglePipChat(); return; }   // Q = 呼出/收起 Pip 问答
    if (ev.code === "KeyE") {
      if (worldIntro) { worldIntro.t = 1; return; }   // 入场运镜中：跳过，直接接管角色
      if (!uiOpen) {
        if (worldRoot && worldRoot.visible) { closeUI(); return; }   // 画中世界漫游中：E 返回画廊
        if (highlighted) openInfo(highlighted);   // E → 锁定机位 + 信息卡
      } else {
        closeUI();                                 // 再按 E → 关闭（开关式）
      }
      return;
    }
    if ((ev.code === "Enter" || ev.code === "NumpadEnter") && uiOpen === "focus") {
      const pb = document.querySelector("#cd-btns button.primary");
      if (pb) pb.click();
      return;
    }
    // A 键语音导览：在 UI 期的捕获阶段拦截器里处理（KeyA 同时是控制器移动键，会被吞）
    if (ev.code === "KeyG") {
      // 画质三档循环：清晰优先 → 均衡 → 流畅（弱 GPU/集显手动兜底）
      dprCap = dprCap > 1.25 ? 1.0 : (dprCap > 0.85 ? 0.75 : Math.min(devicePixelRatio, 1.5));
      if (worldRoot?.visible) dprCap=Math.min(dprCap,1);
      dprNow = dprCap;
      renderer.setPixelRatio(dprNow);
      toast("Render quality: " + (dprCap > 1.25 ? "HIGH" : dprCap > 0.85 ? "BALANCED" : "SMOOTH"));
      return;
    }
    if (ev.code === "Escape" && (uiOpen || (worldRoot && worldRoot.visible))) closeUI(); // 兜底（主用 E）
  });
  document.getElementById("cd-close").addEventListener("click", closeUI);
  vidEl.querySelector(".close").addEventListener("click", closeUI);
  objEl.querySelector(".close").addEventListener("click", closeUI);

  // ── 语音小精灵「Pip」：分层光球 + 环绕 + 闪星 + 声波圈 + 眼睛（程序化占位） ──
  const spriteRoot = new THREE.Group();
  const PIP_UP = new THREE.Vector3(0, 1, 0);
  const pipGoal = new THREE.Vector3(), pipRight = new THREE.Vector3(), pipTargetA = new THREE.Vector3(), pipTargetB = new THREE.Vector3();
  const pipProj = new THREE.Vector3(), pipAbove = new THREE.Vector3();
  let pipCardRect = null;   // 信息卡屏幕区域（openInfo 时缓存），Pip 栖息位避开它
  let spriteCore, spriteInnerGlow, spriteOuterGlow, spriteEyes, spriteNameTag, spriteLight;
  const spriteMotes = [], spriteSparkles = [], soundRings = [];
  {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff8e2 }));
    spriteCore = core;
    spriteRoot.add(core);

    const radialTex = (inner, mid) => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, inner);
      grd.addColorStop(0.4, mid);
      grd.addColorStop(1, "rgba(255,200,120,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    spriteInnerGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTex("rgba(255,250,225,0.95)", "rgba(255,226,150,0.45)"),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    spriteInnerGlow.scale.setScalar(0.42);
    spriteRoot.add(spriteInnerGlow);

    spriteOuterGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTex("rgba(255,236,190,0.5)", "rgba(255,206,130,0.16)"),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8,
    }));
    spriteOuterGlow.scale.setScalar(0.95);
    spriteRoot.add(spriteOuterGlow);

    // 倾斜环绕光环（9 颗大小/色调微差的灵尘）
    for (let i = 0; i < 9; i++) {
      const r = 0.008 + (i % 3) * 0.004;
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffe9a8 : 0xffd489 }));
      spriteMotes.push(m);
      spriteRoot.add(m);
    }
    const moteRing = new THREE.Group();
    spriteMotes.forEach((m) => moteRing.add(m));
    moteRing.rotation.z = 0.34;
    moteRing.rotation.x = 0.12;
    spriteRoot.add(moteRing);

    // 随机闪星
    for (let i = 0; i < 10; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: radialTex("rgba(255,255,240,1)", "rgba(255,240,190,0.5)"),
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0,
      }));
      sp.scale.setScalar(0.06);
      spriteSparkles.push(sp);
      spriteRoot.add(sp);
    }

    // 声波扩散圈（说话时一圈圈荡开）—— 池化 4 个
    const ringTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      g.strokeStyle = "rgba(255,238,190,0.9)";
      g.lineWidth = 5;
      g.beginPath();
      g.arc(64, 64, 52, 0, Math.PI * 2);
      g.stroke();
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Sprite(new THREE.SpriteMaterial({
        map: ringTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0,
      }));
      ring.scale.setScalar(0.3);
      ring.userData.t = 9;
      soundRings.push(ring);
      spriteRoot.add(ring);
    }

    // 小眼睛（让她成为"角色"，说话时看向镜头）
    spriteEyes = new THREE.Group();
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x8a6a22 });
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), eyeMat);
      e.position.set(sx * 0.026, 0.012, 0.044);
      spriteEyes.add(e);
    }
    spriteRoot.add(spriteEyes);

    // 名字标签「Pip」（说话时浮出）
    const tagCanvas = document.createElement("canvas");
    tagCanvas.width = 256; tagCanvas.height = 96;
    const tg = tagCanvas.getContext("2d");
    tg.font = "600 54px Georgia, serif";
    tg.textAlign = "center";
    tg.textBaseline = "middle";
    tg.fillStyle = "rgba(255,240,205,0.96)";
    tg.fillText("Pip", 128, 52);
    const tagTex = new THREE.CanvasTexture(tagCanvas);
    tagTex.colorSpace = THREE.SRGBColorSpace;
    spriteNameTag = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tagTex, depthWrite: false, transparent: true, opacity: 0,
    }));
    spriteNameTag.scale.set(0.42, 0.16, 1);
    spriteNameTag.position.set(0, 0.26, 0);
    spriteRoot.add(spriteNameTag);

    spriteLight = new THREE.PointLight(0xffe0a0, 2.5, 4.5, 2);
    spriteRoot.add(spriteLight);
  }
  scene.add(spriteRoot);

  // ── 点击 Pip 本体直接呼出/收起问答（自由参观与观画时均可；悬停变手型） ──
  const pipRay = new THREE.Raycaster();
  function pipHit(ev) {
    const ndc = new THREE.Vector2((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
    pipRay.setFromCamera(ndc, camera);
    return pipRay.ray.intersectsSphere(new THREE.Sphere(spriteRoot.position, 0.38));
  }
  renderer.domElement.addEventListener("click", (ev) => {
    if (uiOpen && uiOpen !== "focus") return;   // 全屏视频/皇冠/世界中不处理
    if (pipHit(ev)) togglePipChat();
  });
  addEventListener("mousemove", (ev) => {
    if (uiOpen && uiOpen !== "focus") return;
    renderer.domElement.style.cursor = (!player.input.drag && pipHit(ev)) ? "pointer" : "";
  });

  // ── 语音播放（Qwen3-TTS 固定语音包 + 3D 空间音频：声音从 Pip 的位置发出） ──
  const AUDIO_BASE = "assets/audio/Cherry/";
  const AUDIO_IDS = new Set(["harvesters", "wheat", "toledo", "aristotle", "socrates",
    "sunflowers", "manet", "pareja", "degas-collector", "crown", "met-435844", "piazza", "met-435908"]);   // met-435844=Musicians, piazza(435882)=Piazza San Marco, met-435908=Trojan Women（语音均已生成）
  const INTRO = ["intro-01", "intro-02", "intro-03", "intro-04", "intro-05"];
  let speaking = false;
  let currentAudioId = null;

  const audioListener = new THREE.AudioListener();
  camera.add(audioListener);
  const positional = new THREE.PositionalAudio(audioListener);
  positional.setRefDistance(1.1);
  positional.setRolloffFactor(1.5);
  positional.setDistanceModel("inverse");
  spriteRoot.add(positional);            // 挂在光球上 → 位置自动跟随

  const audioBuffers = new Map();
  let audioTicket=0;
  async function loadSound(id) {
    if (!audioBuffers.has(id)) {
      const pending=fetch(AUDIO_BASE+id+".wav").then(res=>{if(!res.ok)throw new Error("audio "+res.status);return res.arrayBuffer();}).then(data=>audioListener.context.decodeAudioData(data)).catch(err=>{audioBuffers.delete(id);throw err;});
      audioBuffers.set(id,pending);
    }
    return audioBuffers.get(id);
  }
  function stopAudio() {
    ++audioTicket;
    try { if(positional.isPlaying)positional.stop(); } catch {}
    speaking=false;currentAudioId=null;
  }
  async function playAudio(id,onEnd) {
    stopAudio();
    const ticket=audioTicket;currentAudioId=id;
    try {
      if(audioListener.context.state==="suspended")await audioListener.context.resume();
      const buf=await loadSound(id);
      if(ticket!==audioTicket)return;
      positional.setBuffer(buf);
      positional.onEnded=()=>{
        positional.isPlaying=false;
        if(ticket!==audioTicket)return;
        speaking=false;currentAudioId=null;if(onEnd)onEnd();
      };
      positional.play();speaking=true;
    } catch(e) {
      if(ticket!==audioTicket)return;
      speaking=false;currentAudioId=null;if(onEnd)onEnd();
    }
  }
  function playIntroQueue(i = 0) {
    if (i >= INTRO.length) return;
    playAudio(INTRO[i], () => playIntroQueue(i + 1));
  }
  let introPlayed = false;
  function maybeStartIntro() {
    if (introPlayed || uiOpen === "world") return;
    if(currentAudioId){introPlayed=true;return;}
    introPlayed = true;
    playIntroQueue(0);
  }

  // ── 画中世界：Piazza San Marco v2（进入 / 广场漫游 / 返回还原） ──
  // 与画廊同一套玩家控制器与第三人称相机：角色落地在广场地面（Y=0）行走，
  // 入场先以原画高位构图运镜 ~2.4s 再落到角色身后（E / 移动键跳过）。
  // 边界与构图按 assets/models/worlds/piazza-san-marco-v2/scene-spec.json；
  // 天空球不投影、不参与碰撞、模型整体不做归一化缩放。
  const PIAZZA = {
    src: "assets/models/worlds/piazza-san-marco-v2/piazza-san-marco.glb",
    eyeH: 10,
    eyeZ: 78,
    look: new THREE.Vector3(0, 24, -31),
    feet: new THREE.Vector3(0, 0.3, 63.4),    // 出生点：广场后沿，落入地面代理 Y=0（与后边界墙留出余量）
  };
  const worldLook = new THREE.Vector3(), worldHead = new THREE.Vector3();   // 运镜收敛用临时向量
  let worldRoot = null, worldPromise = null, worldLoadToken = null, worldIntro = null, worldSun = null;
  const worldSaved = {};
  // （运镜期间移动键已放行给控制器，可边看运镜边行走；跳过运镜用 E）

  const worldStatus = document.createElement("div");
  worldStatus.id = "worldload";
  worldStatus.style.cssText = "position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:46;color:#fff;background:rgba(10,10,14,.78);padding:10px 18px;border-radius:6px;font:14px Georgia,serif;letter-spacing:.06em;display:none;pointer-events:none;";
  document.body.appendChild(worldStatus);

  function ensureWorldRoot(onProgress) {
    if (worldRoot) return Promise.resolve(worldRoot);
    if (worldPromise) return worldPromise;
    worldPromise = gltfLoader.loadAsync(PIAZZA.src, (ev) => {
      if (onProgress && ev.total) onProgress(Math.round((ev.loaded / ev.total) * 100));
    }).then((gltf) => {
      const root = gltf.scene;
      addPiazzaFigures(root); softenPiazza(root);
      root.traverse((o) => {
        if (!o.isMesh) return;
        const sky = /sky/i.test(o.name || "");
        o.castShadow = !sky;
        o.receiveShadow = !sky;            // 天空球不投影
      });
      const hemi = new THREE.HemisphereLight(0xb6cede, 0x807154, 2.0);
      const sun = new THREE.DirectionalLight(0xffe5b8, 2.1);
      sun.position.set(-40, 65, 30);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 1, far: 220 });
      sun.shadow.bias = -0.0002;
      sun.shadow.autoUpdate = false;       // 建筑全静态：阴影只渲一次，不每帧跑深度 pass（卡顿根因）
      sun.shadow.needsUpdate = true;
      root.add(hemi, sun);
      worldSun = sun;
      root.visible = false;
      scene.add(root);
      worldRoot = root;
      return root;
    }).finally(() => { worldPromise=null; });
    return worldPromise;
  }

  const worldCurtain = document.createElement('div');
  worldCurtain.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:45;background:#c4c1ae;opacity:0;';
  document.body.appendChild(worldCurtain);
  function enterPaintingWorld() {
    if (worldLoadToken || (worldRoot && worldRoot.visible)) return;
    const token = { cancelled: false };
    worldLoadToken = token;
    worldStatus.textContent = "ENTERING THE PAINTING — LOADING…";
    worldStatus.style.display = "block";
    card.style.display = "none";
    dimEl.style.display = "none";
    stopAllInFrame();
    ensureWorldRoot((pct) => {
      if (!token.cancelled) worldStatus.textContent = `ENTERING THE PAINTING — ${pct}%`;
    }).then((root) => {
      if (token.cancelled || worldLoadToken !== token) return;   // 取消后不迟到传送
      worldLoadToken = null;
      worldStatus.style.display = "none";
      worldSaved.bg = scene.background;
      worldSaved.envInt = scene.environmentIntensity;
      worldSaved.amb = ambLight.intensity;
      worldSaved.key = key.intensity;
      worldSaved.fill = fill.intensity;
      worldSaved.hemi = hemiLight.intensity;
      worldSaved.fov = camera.fov;
      worldSaved.controlsEnabled=controls.enabled;
      worldSaved.controlsTarget=controls.target.clone();
      worldSaved.isFlying=player.isFlying;
      player.isFlying=false;
      worldSaved.exposure = renderer.toneMappingExposure;
      worldSaved.dprCap = dprCap;
      worldSaved.dprNow = dprNow;
      worldSaved.playerPos = player.getPosition().clone();
      gallery.scene.visible = false;
      root.visible = true;
      worldCurtain.style.opacity = "1";
      scene.background = new THREE.Color(0x9db5c2);
      scene.environmentIntensity = 0.25;
      ambLight.intensity = 0.1;
      key.intensity = 0.12;
      fill.intensity = 0.05;
      hemiLight.intensity = 0.45;
      // 不切 AgX 色调映射：切换会触发全场景材质重编译，是进出世界卡顿的元凶；用曝光补偿户外观感
      renderer.toneMappingExposure = 1.3;
      // 性能：世界内阴影已静态化，钳制像素比上限到 1.0，退回画廊时还原
      dprCap = Math.min(dprCap, 1.0);
      dprNow = Math.min(dprNow, dprCap);
      renderer.setPixelRatio(dprNow);
      if (worldSun) worldSun.shadow.needsUpdate = true;   // 每次进入重渲一次静态阴影
      // 角色落进广场：与画廊同一控制器、同一第三人称相机
      const cap = player.getPlayerCapsule();
      cap.position.copy(PIAZZA.feet);
      cap.updateMatrixWorld(true);
      clearHeldKeys();
      // 预编译世界材质：状态遮罩还在时完成编译，消除进入后首次渲染的 hitch
      renderer.compile(scene, camera);
      // Refresh the skinned material uniforms after compile; stale shadow samplers caused GL_INVALID_OPERATION when the avatar entered view.
      scene.traverse(o => { if (o.isSkinnedMesh) for (const m of [].concat(o.material)) m.needsUpdate = true; });
      // 入场运镜：原画高位构图 → 角色身后标准第三人称
      const lensFov = Math.max(42, (2 * Math.atan(18 / (31 * camera.aspect)) * 180) / Math.PI);   // 31mm 镜头 / 36mm 画幅
      camera.fov = lensFov;
      camera.updateProjectionMatrix();
      camera.rotation.order = "YXZ";
      camera.position.set(0, PIAZZA.eyeH, PIAZZA.eyeZ);
      camera.lookAt(PIAZZA.look);
      worldIntro = { t: 0, from: camera.position.clone(), look: PIAZZA.look.clone(), yaw0: 0, lensFov };
      controls.enabled = false;
      uiOpen = "world";
      focus = null;
      toast("You step through the frame into Canaletto's Venice");
    }).catch((err) => {
      if (token.cancelled) return;
      worldLoadToken = null;
      worldStatus.style.display = "none";
      toast("Could not load the painting world — try again");
      card.style.display = "block";
      dimEl.style.display = "block";
      console.error(err);
    });
  }

  // 360° 赏析：按住拖动旋转，光标全程可见可点击（不再指针锁定，ESC/E 退出）
  let objIdle = 0, lastMx = null, lastMy = null, objDragging = false;
  renderer.domElement.addEventListener("pointerdown", (ev) => {
    if (uiOpen !== "object" || ev.button !== 0) return;
    objDragging = true;
    objIdle = 0;
    lastMx = ev.clientX; lastMy = ev.clientY;
    renderer.domElement.style.cursor = "grabbing";
  });
  addEventListener("pointerup", () => {
    if (!objDragging) return;
    objDragging = false;
    if (uiOpen === "object") renderer.domElement.style.cursor = "grab";
  });
  addEventListener("pointermove", (ev) => {
    if (uiOpen !== "object" || !objDragging) { lastMx = lastMy = null; return; }
    // 高 DPI 鼠标 / 系统指针加速会让单事件增量巨大 → 钳制后写入目标值，帧内阻尼收敛
    const dx = Math.max(-48, Math.min(48, lastMx === null ? 0 : ev.clientX - lastMx));
    const dy = Math.max(-40, Math.min(40, lastMy === null ? 0 : ev.clientY - lastMy));
    lastMx = ev.clientX; lastMy = ev.clientY;
    if (!dx && !dy) return;
    drag.tRotY += dx * 0.006 * lookSens;      // 与视角共用 - / = 灵敏度倍率
    drag.tRotX = Math.max(-0.9, Math.min(0.9, drag.tRotX + dy * 0.0045 * lookSens));
    objIdle = 0;
  });

  function updateHighlight() {
    if (uiOpen) return;
    const p = player.getPosition();
    let best = null, bestD = Infinity;
    for (const e of exhibits) {
      const d = Math.hypot(p.x - e.pos.x, p.z - e.pos.z);
      if (d < e.radius && d < bestD) { best = e; bestD = d; }
    }
    highlighted = best;
    if (best) {
      const kind = best.data.experience ? ` · ${best.data.experience.kind.toUpperCase()}` : "";
      hintEl.textContent = best.type === "painting"
        ? `Press E — ${best.data.title}${kind}`
        : `Press E — Crown of the Andes · 360°`;
      hintEl.style.display = "block";
    } else {
      hintEl.style.display = "none"; hintEl.textContent = "";
    }
  }

  // ── 调试钩子 ──
  window.__reviewAudio=()=>({id:currentAudioId,playing:positional.isPlaying,ticket:audioTicket});
  // QA 钩子：瞬移到某展品锁定机位 + 返回其中心的屏幕坐标（x>0 即在画面右半）
  window.__focusSnap = (id) => {
    const e = exhibits.find((x) => x.data.id === id || x.metId === id);
    if (!e) return null;
    const pose = focusPose(e);
    const toArt = e.center.clone().sub(pose.camTo).normalize();
    const fwd = pose.lookTo.clone().sub(pose.camTo).normalize();
    const rightV = new e.center.constructor().crossVectors(fwd, new e.center.constructor(0, 1, 0)).normalize();
    const side = +toArt.dot(rightV).toFixed(3);      // >0 → 展品在画面右半
    return { id: e.data.id, side, angleDeg: +(Math.acos(Math.max(-1, Math.min(1, toArt.dot(fwd)))) * 180 / Math.PI).toFixed(1) };
  };
  window.__player = player;
  window.__renderer = renderer;
  window.__scene = scene;
  window.__camera = camera;
  window.__openExhibit = (id) => {
    const e = exhibits.find(x => x.data.id === id || (id === "crown" && x.type === "crown"));
    if (e) openInfo(e);
  };
  window.__startExperience = startExperience;
  window.__closeUI = closeUI;
  window.__obj = () => ({ rotY: +drag.rotY.toFixed(3), rotX: +drag.rotX.toFixed(3), active: drag.active });
  window.__state = () => ({
    uiOpen,
    current: current ? current.data.id : null,
    highlighted: highlighted ? highlighted.data.id : null,
    pos: player.getPosition().toArray().map(v => +v.toFixed(2)),
  });
  window.__world = () => ({
    active: !!(worldRoot && worldRoot.visible),
    loading: !!worldLoadToken,
    intro: !!worldIntro,
    pos: player.getPosition().toArray().map(v => +v.toFixed(2)),
    groundedY: +player.getPosition().y.toFixed(3),
    dpr: +renderer.getPixelRatio().toFixed(2),
    fov: +camera.fov.toFixed(2),
  });

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    objCamera.aspect = innerWidth / innerHeight;
    objCamera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  let last = performance.now();
  const perfClock = () => performance.now();
  function frame(delta, now) {
    adaptResolution(delta);

    if (!uiOpen && worldRoot?.visible) {
      if (!pipChat.open) player.update(delta);
      // Keep the tower in view without losing the avatar: the look target rides the
      // player's x at y=10 (tower ≈55m at z=-31 stays in frame, avatar walks lower third).
      const feet = player.getPosition();
      camera.position.set(feet.x * .7, 5.2, feet.z + 12);
      camera.lookAt(feet.x, 10, -31);
      const fov = Math.max(50, 2 * Math.atan(Math.tan(25 * Math.PI / 180) * 1.6 / camera.aspect) * 180 / Math.PI);
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }    } else if (!uiOpen) {
      if (!pipChat.open) player.update(delta);
      if (window.__freeCam) { updateHighlight(); renderer.render(scene, camera); return; }
      // GTA 式相机覆写
      const feet = player.getPosition();
      const camNow = camera.position;
      const yaw = Math.atan2(camNow.x - feet.x, camNow.z - feet.z);
      const desired = new THREE.Vector3(
        feet.x + Math.sin(yaw) * 4.2,
        feet.y + 2.4,
        feet.z + Math.cos(yaw) * 4.2
      );
      // 相机防穿墙：从头部向目标机位射线，撞到墙/展柜就把相机拉近
      camRayOrigin.set(feet.x, feet.y + 1.5, feet.z);
      camRayDir.copy(desired).sub(camRayOrigin);
      const wantDist = camRayDir.length();
      camRayDir.normalize();
      camRay.set(camRayOrigin, camRayDir);
      camRay.far = wantDist;
      const hits = camRay.intersectObjects(cameraBlockers, false);
      if (hits.length && hits[0].distance < wantDist) {
        desired.copy(camRayOrigin).addScaledVector(camRayDir, Math.max(0.6, hits[0].distance - 0.3));
      }
      camera.position.lerp(desired, 0.3);
      camera.lookAt(feet.x, feet.y + 1.35, feet.z);
    } else if (uiOpen === "focus" && focus) {
      // 相机锁定到展品机位（展品偏左，右侧留给信息卡）
      focus.t = Math.min(1, focus.t + delta / 0.7);
      const k = 1 - Math.pow(1 - focus.t, 3);   // easeOutCubic
      camera.position.lerpVectors(focus.camFrom, focus.camTo, k);
      const look = new THREE.Vector3().lerpVectors(focus.lookFrom, focus.lookTo, k);
      camera.lookAt(look);
    } else if (uiOpen === "world") {
      // 画中世界：与画廊同一控制器（角色落地、可边看运镜边行走）；运镜结束交给高空跟随相机
      player.update(delta);
      if (worldIntro) {
        worldIntro.t = Math.min(1, worldIntro.t + delta / 2.4);
        const feet = player.getPosition();
        // The same final position, target and lens as free movement avoid a last-frame snap.
        const smooth = worldIntro.t * worldIntro.t * (3 - 2 * worldIntro.t);
        camera.position.set(feet.x * .7, THREE.MathUtils.lerp(PIAZZA.eyeH, 5.2, smooth), THREE.MathUtils.lerp(PIAZZA.eyeZ, feet.z + 12, smooth));
        camera.lookAt(
          THREE.MathUtils.lerp(0, feet.x, smooth),
          THREE.MathUtils.lerp(PIAZZA.look.y, 10, smooth),
          -31
        );
        const finalFov = Math.max(50, 2 * Math.atan(Math.tan(25 * Math.PI / 180) * 1.6 / camera.aspect) * 180 / Math.PI);
        camera.fov = THREE.MathUtils.lerp(worldIntro.lensFov, finalFov, smooth);
        camera.updateProjectionMatrix();
        worldCurtain.style.opacity = String(Math.max(0, 1 - worldIntro.t / .25));
        if (worldIntro.t >= 1) { worldIntro = null; uiOpen = null; current = null; }      } else {
        uiOpen = null; current = null;   // 下一帧起走标准自由模式分支
      }
    }
    updateHighlight();
    // 画中世界漫游：常驻操作提示（updateHighlight 在馆外不产提示）。
    // 相机跟随使角色固定在底部居中，提示条挪到右下角避免常年压在角色身上。
    if (!uiOpen && worldRoot && worldRoot.visible) {
      hintEl.textContent = "WASD — stroll through the square · E — return to the gallery";
      hintEl.style.left = "auto"; hintEl.style.right = "18px"; hintEl.style.transform = "none";
      hintEl.style.display = "block";
    } else {
      hintEl.style.left = "50%"; hintEl.style.right = "auto"; hintEl.style.transform = "translateX(-50%)";
    }

    // 小精灵「Pip」：跟随/栖息画作旁 + 分层脉冲 + 环绕 + 闪星 + 声波圈 + 名字
    {
      const t = (now || perfClock()) / 1000;
      const feet = player.getPosition();
      const camNow2 = camera.position;
      const yaw2 = Math.atan2(camNow2.x - feet.x, camNow2.z - feet.z);
      const fx = -Math.sin(yaw2), fz = -Math.cos(yaw2);
      const rx = Math.cos(yaw2), rz = -Math.sin(yaw2);
      const bob = Math.sin(t * 1.6) * 0.06;
      // 目标位：看画时飞到画框外侧边（不被信息卡挡住）；默认跟在玩家肩侧（画中世界同款）
      if (uiOpen === "focus" && current && current.type === "painting" && current.normal && current.size) {
        pipRight.crossVectors(current.normal, PIP_UP).normalize();
        const half = (Math.abs(current.normal.x) > 0.5 ? current.size.z : current.size.x) / 2;
        const off = half + 0.45;
        pipTargetA.copy(current.center).addScaledVector(pipRight, off).addScaledVector(current.normal, 0.12);
        pipTargetB.copy(current.center).addScaledVector(pipRight, -off).addScaledVector(current.normal, 0.12);
        // 修复：信息卡在屏幕左侧，原先按"离馆中心远近"选边会落进卡片后面 →
        // 把两个候补投影到屏幕，选不被卡片遮住的一侧；都被遮住则升到画框上端居中
        const screenX = (v) => (pipProj.copy(v).project(camera).x * 0.5 + 0.5) * innerWidth;
        const hidden = (s) => !!pipCardRect && s < pipCardRect.right + 70 && s > pipCardRect.left - 70;
        const sA = screenX(pipTargetA), sB = screenX(pipTargetB);
        const preferA = (pipTargetA.x * pipTargetA.x + pipTargetA.z * pipTargetA.z) >= (pipTargetB.x * pipTargetB.x + pipTargetB.z * pipTargetB.z);
        let pick;
        if (!hidden(sA) && !hidden(sB)) pick = preferA ? pipTargetA : pipTargetB;
        else if (!hidden(sA)) pick = pipTargetA;
        else if (!hidden(sB)) pick = pipTargetB;
        else pick = pipAbove.copy(current.center).addScaledVector(current.normal, 0.35);
        if (pick === pipAbove) pipGoal.set(pick.x, pick.y + (current.size.y || 1) / 2 + 0.42 + bob * 0.5, pick.z);
        else pipGoal.set(pick.x, pick.y + 0.08 + bob * 0.5, pick.z);
      } else {
        pipGoal.set(feet.x + fx * 0.35 + rx * 0.55, feet.y + 1.45 + bob, feet.z + fz * 0.35 + rz * 0.55);
      }
      spriteRoot.position.lerp(pipGoal, 1 - Math.pow(0.002, delta));   // 平滑飞往目标
      const speakPulse = speaking ? 1 + Math.sin(t * 11) * 0.26 : 1 + Math.sin(t * 2.2) * 0.06;
      spriteCore.scale.setScalar(speakPulse);
      spriteInnerGlow.scale.setScalar(0.42 * (speaking ? 1.2 * speakPulse : speakPulse));
      spriteOuterGlow.scale.setScalar(0.95 * (speaking ? 1.12 : 1 + Math.sin(t * 1.1) * 0.05));
      spriteOuterGlow.material.opacity = speaking ? 0.95 : 0.75;
      spriteLight.intensity = speaking ? 3.8 : 2.1;
      spriteMotes.forEach((m, i) => {
        const a = t * (speaking ? 2.4 : 1.0) + (i / spriteMotes.length) * Math.PI * 2;
        const rr = 0.17 + Math.sin(t * 1.3 + i) * 0.012;
        m.position.set(Math.cos(a) * rr, Math.sin(a * 1.6 + i) * 0.05, Math.sin(a) * rr);
      });
      spriteSparkles.forEach((sp, i) => {
        if (sp.userData.t === undefined || Math.random() < 0.012) {
          const a = Math.random() * Math.PI * 2, rr = 0.16 + Math.random() * 0.2;
          sp.position.set(Math.cos(a) * rr, (Math.random() - 0.5) * 0.3, Math.sin(a) * rr);
          sp.userData.t = 0;
        }
        sp.userData.t += delta;
        const k = Math.max(0, 1 - sp.userData.t / (speaking ? 0.55 : 1.1));
        sp.material.opacity = k * (speaking ? 0.95 : 0.6);
        sp.scale.setScalar(0.045 + k * 0.05);
      });
      // 声波圈：说话时每 ~0.4s 荡开一圈
      if (speaking) {
        window.__ringClock = (window.__ringClock || 0) + delta;
        if (window.__ringClock > 0.4) {
          window.__ringClock = 0;
          const free = soundRings.find((r) => r.userData.t > 1.2);
          if (free) free.userData.t = 0;
        }
      }
      soundRings.forEach((r) => {
        r.userData.t += delta;
        const k = Math.min(1, r.userData.t / 1.15);
        r.material.opacity = r.userData.t < 1.2 ? (1 - k) * 0.55 : 0;
        r.scale.setScalar(0.25 + k * 1.05);
      });
      // 眼睛朝向镜头（水平方向），说话时更亮更大
      spriteEyes.lookAt(camNow2.x, spriteEyes.getWorldPosition(new THREE.Vector3()).y, camNow2.z);
      spriteEyes.scale.setScalar(speaking ? 1.15 : 1);
      // 名字标签：说话时浮出，之后淡出
      const tagTarget = speaking ? 0.95 : 0;
      spriteNameTag.material.opacity += (tagTarget - spriteNameTag.material.opacity) * Math.min(1, delta * 5);
      spriteNameTag.position.y = 0.26 + bob * 0.6;
    }

    if (uiOpen === "object") {
      // 鼠标拖动旋转：阻尼追随目标值（跨设备手感一致、不再发飘）；自动旋转默认关
      //（控制台 __vgAutoSpin = true 可恢复），拖动/松手的节奏不被自动旋转打断
      objIdle += delta;
      if (objIdle > 2 && window.__vgAutoSpin === true) drag.tRotY += delta * 0.55;
      const damp = Math.min(1, delta * 9);
      drag.rotY += (drag.tRotY - drag.rotY) * damp;
      drag.rotX += (drag.tRotX - drag.rotX) * damp;
      objPivot.rotation.set(drag.rotX, drag.rotY, 0);
      // 背景 = 实时展厅：先以压暗曝光渲染主场景，再无清屏叠加 360 皇冠
      const exp = renderer.toneMappingExposure;
      renderer.toneMappingExposure = exp * 0.32;
      renderer.render(scene, camera);
      renderer.toneMappingExposure = exp;
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(objScene, objCamera);
      renderer.autoClear = true;
    } else {
      renderer.render(scene, camera);
    }
  }

  // 自适应分辨率：连续低帧率则降 DPR，流畅后再升回（上限 dprCap）
  let fpsAcc = 0, fpsFrames = 0, dprNow = dprCap;
  function adaptResolution(delta) {
    fpsAcc += delta; fpsFrames++;
    if (fpsAcc < 0.9) return;                             // 0.9s 一评：更快响应掉帧
    const fps = fpsFrames / fpsAcc;
    fpsAcc = 0; fpsFrames = 0;
    if (fps < 50 && dprNow > 0.75) { dprNow = Math.max(0.75, dprNow - 0.25); renderer.setPixelRatio(dprNow); }
    else if (fps > 58 && dprNow < dprCap) { dprNow = Math.min(dprCap, dprNow + 0.25); renderer.setPixelRatio(dprNow); }
  }

  // 手动步进钩子（调试/自动化验收用；rAF 被浏览器挂起时仍可驱动一帧）
  window.__tick = (dt = 1 / 60) => frame(dt, perfClock());

  renderer.render(scene, camera);
  // 预编译全馆材质 + 皇冠 360 场景：藏在加载遮罩后面，消除开馆后走动/首次互动的编译 hitch
  renderer.compile(scene, camera);
      // Refresh the skinned material uniforms after compile; stale shadow samplers caused GL_INVALID_OPERATION when the avatar entered view.
      scene.traverse(o => { if (o.isSkinnedMesh) for (const m of [].concat(o.material)) m.needsUpdate = true; });
  renderer.compile(objScene, objCamera);
  loading.classList.add("done");

  (function animate() {
    requestAnimationFrame(animate);
    const now = perfClock();
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    frame(delta, now);
  })();
}

main().catch((e) => { window.__reportError(e); console.error(e); });
