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
    { url: "assets/models/scroll-gallery-v1.glb", est: 0.09 },
    { url: "assets/models/characters/kid-head.glb?v=3", est: 5.5 },
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

  const [gallery, tourist, crownGltf, scrollGltf, headGltf] = await Promise.all(ASSETS.map(loadOne));
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
        if (mats.some((x) => x.name === "V6 burgundy velvet rope")) o.visible = false;   // 移除红绳
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
  // 绒绳按需求移除：两条走廊成为通往特展厅的通道（门户触发在 frame 内）
  // Piazza San Marco 画中世界的物理：地面代理（顶面 Y=0，角色落地）+ 活动边界墙。
  // 区域 z∈[45, 64]、x∈[-8, 8]（墙体内缘留出胶囊半径余量），远离画廊碰撞体（画廊 z≤±12.2）互不干扰。
  addProxy("proxy_piazza_floor", 20, 0.6, 26, 0, -0.3, 54.5);
  addProxy("proxy_piazza_wall_xn", 0.4, 12, 26, -8.4, 5, 54.5);
  addProxy("proxy_piazza_wall_xp", 0.4, 12, 26, 8.4, 5, 54.5);
  addProxy("proxy_piazza_wall_zn", 20, 12, 0.4, 0, 5, 44.6);
  addProxy("proxy_piazza_wall_zp", 20, 12, 0.4, 0, 5, 64.4);

  // ── 千里江山图特展厅（独立 GLB，置于 +X 远端；一期仅传送进入）──
  // 房间局部坐标：入口墙 x=0、画墙 y=+2.1、卷首靠入口（手卷从右往左读）。
  // 装载时绕 Y 转 180° 并平移到 x∈[200,216]：画墙落到世界 +Z——沿行走方向画在右手侧、
  // 面墙观画时卷首恰在观者右手边，读卷方向与行走方向一致；刚体变换，贴图不镜像。
  // 世界坐标映射：world = (216 − bx, bz, +by)
  const SCROLL = { offX: 200, active: false, spots: [], saved: null, alignYaw: null, feet: new THREE.Vector3(212.6, 0.15, -1.2) };
  const SCROLL_BANNER = "SPECIAL EXHIBITION — A THOUSAND LI OF RIVERS AND MOUNTAINS · E INFO · DOORS BACK TO GALLERY";
  {
    const room = scrollGltf.scene;
    room.rotation.y = Math.PI;
    room.position.set(SCROLL.offX + 16, 0, 0);
    scene.add(room);
    room.updateMatrixWorld(true);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const mats = {};
    room.traverse((o) => {
      // 段落铜牌二轮才挪到栏座（规格 §2.11），先隐藏避免压在画心上
      if (o.name && o.name.startsWith("PLAQUE")) { o.visible = false; return; }
      if (o.isMesh) {
        o.castShadow = o.receiveShadow = false;
        for (const m of [].concat(o.material)) {
          mats[m.name] = m;
          m.side = THREE.FrontSide;                  // 白模法线已审计全部朝房间（verify 脚本 facing 审计）
          if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = 0.18; m.roughness = 0.06; m.depthWrite = false; }
          m.needsUpdate = true;
        }
      }
    });
    const texLoader = new THREE.TextureLoader();
    // flipU：房间绕 Y 转 180° 后，贴图平面的 u 轴与观者左右反向（GLB UV 实测，
    // tools/inspect-scroll-uv.mjs）——水平镜像贴图补偿；画心翻转同时修正段落接缝连续性
    const setMap = (matName, file, rough = 0.62, flipU = true) => {
      texLoader.load(`assets/models/scroll/slices/${file}`, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(8, maxAniso);
        t.flipY = false;                // GLB UV 按 glTF 约定（v=0 图顶）；TextureLoader 默认 flipY 会整体倒置
        t.needsUpdate = true;           // flipY 影响上传，需重传
        if (flipU) {
          t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1;
          t.updateMatrix();               // 房间绕 Y 转 180° 后 u 轴与观者左右反向，镜像补偿；
        }                                 // GLTFLoader 关了 matrixAutoUpdate，必须手动烘焙 uvTransform
        const m = mats[matName]; if (!m) return;
        m.map = t; m.color.set(0xffffff); m.roughness = rough; m.needsUpdate = true;
      });
    };
    for (let i = 1; i <= 10; i++) setMap(`scroll_slice_${String(i).padStart(2, "0")}`, `scroll_slice_${String(i).padStart(2, "0")}.jpg`);
    setMap("scroll_colophon_01", "scroll_colophon_01.jpg", 0.8);
    setMap("scroll_colophon_02", "scroll_colophon_02.jpg", 0.8);
    setMap("detail_print_01", "detail_print_01.jpg", 0.62);
    setMap("detail_print_02", "detail_print_02.jpg", 0.62);
    setMap("TITLE_PLATE", "title_plate.jpg", 0.5);
    setMap("CREDIT_PLATE", "credit_plate.jpg", 0.5);
    // 顶部轨道射灯：降密为 5 盏等距（01/03/05/07/09，间距 2.4m），灯体可见
    room.traverse((o) => {
      if (!o.name || !o.name.startsWith("LT_")) return;
      const sm = o.name.match(/^LT_SCROLL_(\d+)/);
      if (sm && +sm[1] % 2 === 0) return;             // 画灯降密：隔一盏留一盏
      const p = o.getWorldPosition(new THREE.Vector3());
      const s = new THREE.SpotLight(0xffd9a0, 85, 10, 0.5, 0.6, 1.7);
      s.position.copy(p);
      if (o.name.startsWith("LT_SCROLL")) s.target.position.set(p.x, 1.45, 2.08);
      else if (o.name === "LT_TITLE") s.target.position.set(p.x, 1.3, p.z);
      else if (o.name === "LT_COLOPHON") s.target.position.set(p.x - 0.55, 1.45, p.z);
      else s.target.position.set(p.x, 1.5, -2.08);   // LT_DETAIL_*
      s.visible = false;                              // 仅特展期间点亮
      scene.add(s, s.target);
      SCROLL.spots.push(s);
    });
    room.traverse((o) => { o.matrixAutoUpdate = false; });   // 静态房间，与画廊同待遇
    SCROLL.room = room;

    // ── 材质细节：程序化凹凸去塑料感（织物墙 / 石地 / 木纹，无外部资产）──
    const bumpTex = (draw, rep) => {
      const c = document.createElement("canvas"); c.width = c.height = 256;
      draw(c.getContext("2d"), 256);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
      return t;
    };
    const weaveDraw = (ctx, s) => {          // 织物：经纬细纹
      ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < s; i += 4) {
        ctx.fillStyle = "rgba(255,255,255,0.16)"; ctx.fillRect(i, 0, 2, s);
        ctx.fillStyle = "rgba(0,0,0,0.16)"; ctx.fillRect(0, i, s, 2);
      }
    };
    const stoneDraw = (ctx, s) => {          // 石板：噪点 + 分缝
      ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 2600; i++) {
        const v = (128 + (Math.random() * 44 - 22)) | 0;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      }
      ctx.strokeStyle = "rgba(0,0,0,0.28)"; ctx.lineWidth = 2;
      ctx.strokeRect(-2, -2, s / 2 + 4, s / 2 + 4); ctx.strokeRect(s / 2 - 2, s / 2 - 2, s / 2 + 4, s / 2 + 4);
    };
    const woodDraw = (ctx, s) => {           // 木纹：拉丝曲线
      ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 90; i++) {
        const y = Math.random() * s;
        const dark = Math.random() > 0.5;
        ctx.strokeStyle = `rgba(${dark ? 0 : 255},${dark ? 0 : 255},${dark ? 0 : 255},0.10)`;
        ctx.beginPath(); ctx.moveTo(0, y);
        ctx.bezierCurveTo(s / 3, y + (Math.random() * 8 - 4), s * 2 / 3, y + (Math.random() * 8 - 4), s, y + (Math.random() * 6 - 3));
        ctx.stroke();
      }
    };
    const applyBump = (matName, tex, scale) => {
      const m = mats[matName]; if (!m) return;
      m.bumpMap = tex; m.bumpScale = scale; m.needsUpdate = true;
    };
    applyBump("INK_WALL", bumpTex(weaveDraw, 10), 0.012);
    applyBump("STONE_FLOOR", bumpTex(stoneDraw, 6), 0.02);
    applyBump("DARK_WALNUT", bumpTex(woodDraw, 2), 0.01);
    applyBump("DARK_CEIL", bumpTex(woodDraw, 3), 0.008);
    // 反馈轮 IV：顶棚板（y=4.0，法线朝下已验证）在压暗灯光下近乎纯黑，搁栅缝隙透出
    // 背景色 → 观感像"没封顶、上面是空的"。双面兜底 + 木色微自发光，让顶面读得出是一个面。
    if (mats.DARK_CEIL) {
      mats.DARK_CEIL.side = THREE.DoubleSide;
      mats.DARK_CEIL.emissive = new THREE.Color(0x332412);
      mats.DARK_CEIL.emissiveIntensity = 0.55;
      mats.DARK_CEIL.needsUpdate = true;
    }

    // ── 长凳：白模几何（已倒角）+ 大厅同款「牛津红拉扣皮」材质克隆 + 拉扣凹凸 ──
    // 注意：大厅长凳是合并网格（Architecture_-_Oxblood_tufted_leather），不可克隆搬运
    let leatherM = null;
    gallery.scene.traverse((o) => {
      if (leatherM || !o.isMesh || !o.material) return;
      const m = [].concat(o.material)[0];
      if (m.name === "Oxblood tufted leather") leatherM = m;
    });
    let benchProto = null;
    room.traverse((o) => {
      if (o.name !== "BENCH" || !o.isMesh) return;
      o.visible = true;
      if (leatherM) {
        const lm = leatherM.clone();
        const c = document.createElement("canvas"); c.width = c.height = 256;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, 256, 256);
        for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 6; gx++) {   // 拉扣凹点
          const x = 22 + gx * 42, y = 42 + gy * 85;
          const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
          g.addColorStop(0, "rgba(0,0,0,0.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill();
        }
        const bt = new THREE.CanvasTexture(c);
        bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.set(2, 1);
        lm.bumpMap = bt; lm.bumpScale = 0.03;
        lm.needsUpdate = true;
        o.material = lm;
      }
      benchProto = o;
    });
    // 反馈轮 VIII：两只沙发放房间中部、沿长卷方向相隔 4.8m；白模原靠墙位置收起
    if (benchProto) {
      const place = (b, wx, wz) => {
        const bb = new THREE.Box3().setFromObject(b);
        const cur = room.worldToLocal(bb.getCenter(new THREE.Vector3()));
        const tgt = room.worldToLocal(new THREE.Vector3(wx, 0.225, wz));   // 0.225=凳体半高，贴地
        b.position.add(tgt.sub(cur));
        b.updateMatrix();                          // room 全员冻结矩阵，挪位必须手动刷新
      };
      const b1 = benchProto.clone(); room.add(b1);
      const b2 = benchProto.clone(); room.add(b2);
      place(b1, 205.6, -0.5);
      place(b2, 210.4, -0.5);
      benchProto.visible = false;
    }

    // ── 反馈轮 II：去玻璃栏 → 红地毯；可见顶灯降密（5 盏等距）；南廊恢复绒绳；尽端保持黑墙单路 ──
    room.traverse((o) => { if (o.name === "RAIL_GLASS" || o.name === "RAIL_BRONZE_BASE") o.visible = false; });
    {
      // 反馈轮 IV：整间满铺红毯（短条地毯出现"半红半别色"的断裂观感）
      const carpet = new THREE.Mesh(
        new THREE.PlaneGeometry(16.6, 4.8),
        new THREE.MeshStandardMaterial({ color: 0x6e1620, roughness: 0.96 })
      );
      carpet.rotation.x = -Math.PI / 2;
      carpet.position.set(8, 0.012, 0);
      carpet.matrixAutoUpdate = false; carpet.updateMatrix();
      room.add(carpet);
    }
    // 南廊恢复绒绳（南向无门户，走廊保持原有视觉）
    addProxy("proxy_scroll_south_rope", 3.1, 10, .18, 0, 5, 11.4);
    const brassM = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.35, metalness: 0.85 });
    const ropeM = new THREE.MeshStandardMaterial({ color: 0x8e1c26, roughness: 0.6 });
    for (const sx of [-1.35, 1.35]) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.92, 10), brassM);
      st.position.set(sx, 0.46, 11.4);
      scene.add(st);
    }
    const srope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.7, 8), ropeM);
    srope.rotation.z = Math.PI / 2;
    srope.position.set(0, 0.82, 11.4);
    scene.add(srope);
    // 北廊安全地面/侧墙（门户淡出期间不坠入虚空）
    addProxy("proxy_ncorr_floor", 3.4, 0.6, 7, 0, -0.3, -15);
    addProxy("proxy_ncorr_side_e", 0.4, 12, 7, 1.75, 5, -15);
    addProxy("proxy_ncorr_side_w", 0.4, 12, 7, -1.75, 5, -15);
    // 入口门外的走廊纵深（纯视觉：红墙+石基+木地板+尽端白门，门户在门口即触发淡出）
    {
      const redM = new THREE.MeshStandardMaterial({ color: 0x9c2f22, roughness: 0.9 });
      const creamM = new THREE.MeshStandardMaterial({ color: 0xd8d2c2, roughness: 0.9 });
      const woodM = new THREE.MeshStandardMaterial({ color: 0x3a2317, roughness: 0.6 });
      const vbox = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); scene.add(b); return b; };
      vbox(10, 0.3, 3.4, 221.5, -0.15, 0, woodM);            // 地板
      vbox(10, 4, 0.3, 221.5, 2, -1.75, redM);               // 红墙
      vbox(10, 4, 0.3, 221.5, 2, 1.75, redM);
      vbox(10, 0.4, 3.4, 221.5, 3.8, 0, creamM);             // 顶
      vbox(0.2, 3.4, 3.4, 226.4, 1.7, 0, creamM);            // 尽端
      vbox(1.8, 2.6, 0.15, 226.2, 1.3, 0, creamM);           // 尽端白门
      const corridorLight = new THREE.PointLight(0xffe2b8, 20, 12, 2);
      corridorLight.position.set(221, 3.2, 0);
      scene.add(corridorLight);
    }
    // 顶部轨道射灯：轨道贴搁栅下（3.94），灯头 3.62 斜向画墙——正规射灯样式、光束打在画上。
    // 高度取中：4.0 吸顶完全在行走视野外（GTA 相机固定俯视），2.78 吊灯用户嫌垂太低
    const fixMat = new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.45, metalness: 0.7 });
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xffe8b8 });
    const plateGeo = new THREE.BoxGeometry(0.16, 0.02, 0.16);            // 吸顶盘
    const stemGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8);    // 连接杆 3.93 → 3.63
    const headGeo = new THREE.CylinderGeometry(0.085, 0.105, 0.4, 14);   // 射灯灯体
    const lensGeo = new THREE.CircleGeometry(0.1, 18);                   // 暖光镜片
    const railGeo = new THREE.BoxGeometry(11.0, 0.06, 0.1);              // 画墙侧共享轨道
    const HEAD_Y = 3.62;
    { // 画墙侧轨道（世界 z=1.45，罩住 5 盏画灯跨度）
      const rail = new THREE.Mesh(railGeo, fixMat);
      rail.position.set(207.6, 3.94, 1.45);
      scene.add(rail);
    }
    for (const s of SCROLL.spots) {
      s.position.y = 3.55;                        // 光源在灯体内（离墙变远，强度 85→95 补偿）
      s.intensity = 95;
      const plate = new THREE.Mesh(plateGeo, fixMat);
      plate.position.set(s.position.x, 3.99, s.position.z);
      const stem = new THREE.Mesh(stemGeo, fixMat);
      stem.position.set(s.position.x, 3.78, s.position.z);
      const head = new THREE.Mesh(headGeo, fixMat);
      head.position.set(s.position.x, HEAD_Y, s.position.z);
      head.lookAt(s.target.position);
      head.rotateX(Math.PI / 2);                  // 灯体轴向对准目标
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(s.position.x, HEAD_Y, s.position.z);
      lens.lookAt(s.target.position);
      lens.translateZ(0.21);                      // 镜片推到灯体前端
      // s.position 是世界坐标：加进 room（旋转+平移的父节点）会被二次变换甩进主馆——必须挂 scene
      scene.add(plate, stem, head, lens);
    }
    // 相机专用门帘：挡住跟拍相机从门洞穿到房外（不挡玩家）；加入 cameraBlockers 在其定义之后
    SCROLL.camGate = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 2.6, 1.8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    SCROLL.camGate.position.set(216.3, 1.3, 0);
    scene.add(SCROLL.camGate);

    // 影墙西侧（画廊侧）复制标题铭牌：绕行进厅后同样能看到展名
    const plateSrc = room.getObjectByName("TITLE_PLATE_OBJ");
    if (plateSrc) {
      const p2 = plateSrc.clone();
      p2.position.x = 1.94;             // 影墙西面（x=2.0 内缘外 6mm）
      p2.rotation.y += Math.PI;         // 面朝画廊（+x_local）
      p2.visible = true;
      room.add(p2);
    }
    // 碰撞代理（世界坐标；房内 x∈[200,216]、z∈[-2.1,2.1]，入口门洞在 x=216、|z|<0.8）
    addProxy("proxy_scroll_floor", 17, 0.6, 5.2, 208, -0.3, 0);
    addProxy("proxy_scroll_wall_scroll", 17, 12, 0.4, 208, 5, 2.3);        // 长卷墙
    addProxy("proxy_scroll_wall_opp", 17, 12, 0.4, 208, 5, -2.3);          // 对面墙（长凳+放大图）
    addProxy("proxy_scroll_wall_far", 0.4, 12, 5.2, 199.8, 5, 0);          // 尽端墙（题跋转弯）
    addProxy("proxy_scroll_entry_l", 0.4, 12, 1.5, 216.2, 5, 1.45);        // 入口墙（门洞两侧）
    addProxy("proxy_scroll_entry_r", 0.4, 12, 1.5, 216.2, 5, -1.45);
    addProxy("proxy_scroll_entry_top", 0.4, 2, 1.8, 216.2, 3.4, 0);        // 门楣
    addProxy("proxy_scroll_shadowwall", 0.4, 2.6, 2.6, 213.8, 1.3, 0.55);  // 影墙
    addProxy("proxy_scroll_rail", 12.2, 1.05, 0.15, 207, 0.52, 0.9);       // 玻璃矮栏
    addProxy("proxy_scroll_bench", 1.8, 0.5, 0.5, 207.2, 0.25, -1.78);     // 牛皮长凳（大厅同款克隆）
    addProxy("proxy_scroll_roller", 0.15, 0.9, 0.15, 213.05, 1.45, 2.075); // 卷首滚筒
  }
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
    /* 特展沉浸模式：无画框、满屏视频（千里江山图影片） */
    #vid.raw .wrap { inset: 0; }
    #vid.raw .gilt, #vid.raw .tag, #vid.raw .cap { display: none; }
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

  // ── 换头：儿童人像头模（Tripo 生成，离线裁衣+减面到 30k 面，tools/build-kid-head.mjs）
  // 替换 Ch23 默认头部——只换脖子以上，身体与骨骼动画不动。?nohead 可临时关闭对照。 ──
  if (!new URLSearchParams(location.search).has("nohead")) {
    let body = null, hair = null, lashes = null;
    scene.traverse((o) => {
      if (!o.isSkinnedMesh) return;
      if (o.name === "Ch23_Body") body = o;
      else if (o.name === "Ch23_Hair") hair = o;
      else if (o.name === "Ch23_Eyelashes") lashes = o;
    });
    if (body && headGltf) {
      const bones = body.skeleton.bones;
      const headIdx = bones.findIndex((b) => /head/i.test(b.name));
      const neckIdx = bones.findIndex((b) => /neck/i.test(b.name));
      const sp1Idx = bones.findIndex((b) => /spine1/i.test(b.name));
      const sp2Idx = bones.findIndex((b) => /spine2/i.test(b.name));
      const g = body.geometry;
      const si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
      const p = g.attributes.position;
      // 原头与身体是同一蒙皮网格：任一顶点主权重属 Head/Neck 骨即整片移除——
      // 全部裁净不留肉色碎片，缺口由新头模颈环+衣领覆盖。
      // 领口线（145 单位）以上的锁骨/颈底皮肤（Spine1/Spine2 权重）一并裁掉，消除碎片
      const isCutVert = (vi) => {
        let best = -1, bw = 0;
        for (let k = 0; k < 4; k++) { const w = sw.getComponent(vi, k); if (w > bw) { bw = w; best = si.getComponent(vi, k); } }
        if (best === headIdx || best === neckIdx) return true;
        if ((best === sp1Idx || best === sp2Idx) && p.getY(vi) > 1.45) return true;
        return false;
      };
      const idx = g.index.array;
      const keep = [];
      for (let t = 0; t < idx.length; t += 3) {
        const a = idx[t], b = idx[t + 1], c = idx[t + 2];
        if (isCutVert(a) || isCutVert(b) || isCutVert(c)) continue;
        keep.push(a, b, c);
      }
      g.setIndex(keep);
      if (hair) hair.visible = false;      // 新头模自带头发
      if (lashes) lashes.visible = false;  // 睫毛同理
      // 头模挂 Head 骨（骨架局部单位≈厘米；四元数为实测定向 Y 轴 -90°）
      const headBone = bones[headIdx];
      const kidHead = headGltf.scene;
      kidHead.name = "kid_head";
      kidHead.position.set(0, -7, 1);      // 上抬 1cm、前移 1cm（压短脖长）
      kidHead.quaternion.setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
      kidHead.scale.setScalar(68);         // 裁切线下移含下颌后头模 0.395m，×68 ≈ 原头 25cm 比例
      headBone.add(kidHead);
      // 领口染色：裁切环附近的布料顶点乘深色（与西装同调、向上渐隐），消除"裁切感"
      const kMesh = kidHead.children.find((o) => o.isMesh);
      if (kMesh) {
        const pa = kMesh.geometry.attributes.position;
        const cols = new Float32Array(pa.count * 3);
        for (let i = 0; i < pa.count; i++) {
          const y = pa.getY(i), x = pa.getX(i);
          // 高度：y<7.5cm 全暗（盖住围脖布料 4~7cm），7.5~10cm 渐隐到肤色
          const hDark = 1 - Math.min(1, Math.max(0, (y - 0.075) / 0.025));
          // 面向（+X，下巴方向）不染，避免弄脏下巴皮肤
          const front = Math.min(1, Math.max(0, x / 0.09));
          const dark = hDark * (1 - front);
          cols[i * 3] = 1 - dark * 0.94;
          cols[i * 3 + 1] = 1 - dark * 0.935;
          cols[i * 3 + 2] = 1 - dark * 0.92;
        }
        kMesh.geometry.setAttribute("color", new THREE.BufferAttribute(cols, 3));
        for (const m of [].concat(kMesh.material)) { m.vertexColors = true; m.needsUpdate = true; }
      }
    }
  }

  for (const m of proxies) if (!m.geometry.boundsTree) m.geometry.computeBoundsTree();
  scene.updateMatrixWorld(true);
  for (const m of proxies) player.addCollider({ motion: "static", shape: { kind: "mesh", mesh: m } });
  player.input.buildKeyMap({toggleVehicle:null});
  player.onAllEvent();
  const cameraBlockers = proxies.filter((m) => !m.name.includes("floor"));
  // 特展厅实体墙参与相机防穿墙：代理盒在门洞处有缺口，仅靠代理相机会穿墙射到房外
  if (SCROLL.room) SCROLL.room.traverse((o) => {
    if (o.isMesh && o.visible && /^(WALL_|SHADOW_WALL|DOORFILL)/.test(o.name)) cameraBlockers.push(o);
  });
  if (SCROLL.camGate) cameraBlockers.push(SCROLL.camGate);   // 门洞处的相机专用门帘
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

  // ── 特展厅 E 主视角：信息卡 + 沿卷行走跟随相机 + TTS 语音 ──
  const scrollInfo = {
    title: "A Thousand Li of Rivers and Mountains",
    artist: "Wang Ximeng", date: "Northern Song dynasty, dated 1113",
    meta: "Ink and color on silk · 51.5 × 1191.5 cm · Collection of the Palace Museum, Beijing",
    desc: "A twelve-meter blue-green handscroll painted by Wang Ximeng at eighteen, under Emperor Huizong's eye. Mineral azurite and malachite carry mountains, rivers and villages across the silk — the earliest surviving large-format landscape scroll in Chinese art. Walk along the rail to travel the scroll; the view follows your steps.",
  };
  let scrollFocusIdx = 0;
  const sliceCenterX = (i) => 212.404 - i * 1.192;   // 第 i 段（0 起）的世界中心 x
  function openScrollFocus() {
    const pp = player.getPosition();
    scrollFocusIdx = Math.max(0, Math.min(9, Math.round((212.404 - pp.x) / 1.192)));
    savedCamPos = camera.position.clone();   // closeUI 还原跟随视角
    uiOpen = "scrollfocus";
    player.enableToward = false;
    hintEl.textContent = ""; hintEl.style.display = "none";
    worldStatus.style.display = "none";   // 卡片期间收起底部横幅，关闭时恢复
    document.getElementById("cd-title").textContent = scrollInfo.title;
    document.getElementById("cd-meta").textContent = scrollInfo.artist + " · " + scrollInfo.date + " — " + scrollInfo.meta;
    document.getElementById("cd-desc").textContent = scrollInfo.desc;
    const btns = document.getElementById("cd-btns");
    btns.innerHTML = "";
    // 按键模型与油画馆一致：回车 = 进入画中世界（primary ⏎），A = 语音导览
    const eb = document.createElement("button");
    eb.className = "primary";
    eb.textContent = "ENTER THE PAINTING  ⏎";
    eb.addEventListener("click", playScrollCinematic);
    btns.appendChild(eb);
    const ab = document.createElement("button");
    ab.textContent = "Audio Guide  (A)";
    ab.addEventListener("click", () => {
      if (currentAudioId) { stopAudio(); ab.textContent = "Audio Guide  (A)"; return; }
      ab.textContent = "■ Stop Audio  (A)";
      playAudio("qianli", () => { ab.textContent = "Audio Guide  (A)"; }, scrollVoice);
    });
    btns.appendChild(ab);
    const stats = document.getElementById("cd-stats");
    stats.innerHTML = "";
    for (const [k, v] of [
      ["Dimensions", "51.5 × 1191.5 cm"],
      ["Materials", "Ink and color on silk"],
      ["Collection", "The Palace Museum, Beijing"],
      ["Location", "Special Exhibition Gallery"],
    ]) {
      const d = document.createElement("div");
      d.innerHTML = `<div class="k"></div><div class="v"></div>`;
      d.querySelector(".k").textContent = k;
      d.querySelector(".v").textContent = v;
      stats.appendChild(d);
    }
    card.style.display = "block";
    dimEl.style.display = "block";
    updateScrollFocusCam(1, true);
  }
  // 进入画中：全屏沉浸影片（原声、无画框），E 退出；播完自动返回现实世界（不循环、绝不绕回吸入片头）
  function playScrollCinematic() {
    stopAudio();
    const v = document.getElementById("vid-player");
    v.loop = false;                                 // 关闭循环：ended 才会触发，播完即出
    v.src = "assets/video/qianli-jiangshan.mp4?v=2";   // 版本参数：换片后顶掉浏览器缓存的旧片
    v.muted = false;
    v.currentTime = 0;
    v.style.objectFit = "cover";
    vidEl.classList.add("raw");
    document.getElementById("vid-tag").textContent = "";
    document.getElementById("vid-title").textContent = "";
    document.getElementById("vid-sub").textContent = "";
    document.getElementById("vid-desc").textContent = "";
    dimEl.style.display = "none";
    card.style.display = "none";
    vidEl.style.display = "block";
    uiOpen = "video";
    v.play().catch(() => {});
  }
  function updateScrollFocusCam(delta, snap = false) {
    const pp = player.getPosition();
    scrollFocusIdx = Math.max(0, Math.min(9, Math.round((212.404 - pp.x) / 1.192)));
    const cx = sliceCenterX(scrollFocusIdx);
    const cz = Math.min(1.25, Math.max(0.35, pp.z + 0.55));   // 相机保持在玩家与画之间，玩家不入镜
    const dest = new THREE.Vector3(cx, 1.62, cz);
    camera.position.lerp(dest, snap ? 1 : Math.min(1, delta * 5));
    camera.lookAt(cx, 1.45, 2.075);
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
    if (ev.code === "KeyA" && uiOpen === "scrollfocus") {   // A = 语音导览热键（与油画馆一致；连按不重复触发）
      if (!ev.repeat) {
        const ab = [...document.querySelectorAll("#cd-btns button")].find((b) => b.textContent.includes("Audio"));
        if (ab) ab.click();
      }
      ev.stopPropagation(); return;
    }
    if (uiOpen === "scrollfocus" && GAME_KEY_CODES.has(ev.code)) return;   // 走动切换主视角：移动键直通控制器
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
      vidEl.classList.remove("raw");
      v.loop = true;   // 油画馆视频是循环展陈（特展影片会改成 false，这里还原）
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
      vidEl.classList.remove("raw");   // 特展无框模式还原，油画视频仍有鎏金画框
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
    if (SCROLL.active) {   // 特展：卡片/视频关闭后恢复底部横幅
      worldStatus.textContent = SCROLL_BANNER;
      worldStatus.style.display = "block";
    }
  }

  // ── 特展厅进出（双向门户：北廊→前厅，南廊→尽端；地图直选 = 北入口）──
  const titleEl = document.getElementById("title");
  function enterScrollRoom(side = "N") {
    if (SCROLL.active) return;
    SCROLL.side = side;
    SCROLL.saved = {
      amb: ambLight.intensity, key: key.intensity, fill: fill.intensity, hemi: hemiLight.intensity,
      bg: scene.background, envInt: scene.environmentIntensity, exposure: renderer.toneMappingExposure,
      playerPos: player.getPosition().clone(), camPos: camera.position.clone(), tgt: controls.target.clone(),
      camMaxDist: player.cam.maxDist,
    };
    SCROLL.active = true;
    player.cam.maxDist = 2.2;               // 窄厅跟随时距离收短，避免相机穿墙挤压
    for (const s of SCROLL.spots) s.visible = true;
    // 暗厅：全局灯压到大厅 ~15%，只留画灯说话；只调曝光不切 tone mapping（防全场景重编译）
    ambLight.intensity = 0.08; key.intensity = 0.05; fill.intensity = 0.03; hemiLight.intensity = 0.2;
    renderer.toneMappingExposure = 1.12;
    // 单一入口 = 前厅（影墙揭示构图）
    const spawn = { p: new THREE.Vector3(215.2, 0.15, -0.35), want: -Math.PI / 2 + 0.25 };
    const cap = player.getPlayerCapsule();
    cap.position.copy(spawn.p);
    cap.updateMatrixWorld(true);
    camera.position.set(spawn.p.x - Math.sin(spawn.want) * 2.2, 2.35, spawn.p.z - Math.cos(spawn.want) * 2.2);
    controls.target.set(spawn.p.x, 1.5, spawn.p.z);
    camera.lookAt(controls.target);
    SCROLL.alignYaw = { want: spawn.want, hold: 60, cool: 0 };
    if (!keepWalkHeld()) clearHeldKeys();
    worldStatus.textContent = SCROLL_BANNER;
    worldStatus.style.display = "block";
    if (!SCROLL.hudSaved) SCROLL.hudSaved = { t: titleEl.childNodes[0].nodeValue, s: titleEl.querySelector("small")?.textContent ?? "" };
    titleEl.childNodes[0].nodeValue = "SPECIAL EXHIBITION — A THOUSAND LI OF RIVERS AND MOUNTAINS";
    if (titleEl.querySelector("small")) titleEl.querySelector("small").textContent = "PALACE MUSEUM LOAN · VGALLERY WALK DEMO";
    renderer.compile(scene, camera);
  }
  function keepWalkHeld() {
    return player.input.fwd || player.input.bkd || player.input.lft || player.input.rgt ||
      player.input.keyFwd || player.input.keyBkd || player.input.keyLft || player.input.keyRgt;
  }
  function exitScrollRoom(mode = "restore") {
    if (!SCROLL.active) return;
    const sv = SCROLL.saved; SCROLL.active = false;
    SCROLL.alignYaw = null;
    for (const s of SCROLL.spots) s.visible = false;
    ambLight.intensity = sv.amb; key.intensity = sv.key; fill.intensity = sv.fill; hemiLight.intensity = sv.hemi;
    scene.background = sv.bg; scene.environmentIntensity = sv.envInt;
    renderer.toneMappingExposure = sv.exposure;
    player.cam.maxDist = sv.camMaxDist;
    if (titleEl && SCROLL.hudSaved) {   // 还原大厅 HUD 标题
      titleEl.childNodes[0].nodeValue = SCROLL.hudSaved.t;
      if (titleEl.querySelector("small")) titleEl.querySelector("small").textContent = SCROLL.hudSaved.s;
    }
    const cap = player.getPlayerCapsule();
    if (mode === "N") {
      // 走出前厅门 → 出现在北廊，朝向大厅；按住的方向键继续生效（无缝过门）
      cap.position.set(0, 0.15, -11.55);
      cap.updateMatrixWorld(true);
      camera.position.set(0, 2.5, -11.55 - 3.2);
      camera.lookAt(0, 1.4, -11.55 + 3);
      worldStatus.style.display = "none";
      return;
    }
    // restore（E/ESC）：回到传送前在大厅的位置
    cap.position.copy(sv.playerPos);
    cap.updateMatrixWorld(true);
    camera.position.copy(sv.camPos);
    controls.target.copy(sv.tgt);
    camera.lookAt(controls.target);
    worldStatus.style.display = "none";
    clearHeldKeys();
  }
  window.__scroll = { enter: enterScrollRoom, exit: exitScrollRoom, state: SCROLL };

  // ── 走廊门户：走进走廊深处淡出切图（游戏式 loading），双向对称 ──
  function portalToRoom(side) {
    if (SCROLL.transition || SCROLL.active) return;
    SCROLL.transition = true;
    worldCurtain.style.transition = "opacity .35s"; worldCurtain.style.opacity = "1";
    setTimeout(() => {
      enterScrollRoom(side);
      setTimeout(() => { worldCurtain.style.opacity = "0"; SCROLL.transition = false; }, 500);
    }, 380);
  }
  function portalToHall(corridor) {
    if (SCROLL.transition || !SCROLL.active) return;
    SCROLL.transition = true;
    worldCurtain.style.transition = "opacity .35s"; worldCurtain.style.opacity = "1";
    setTimeout(() => {
      exitScrollRoom(corridor);
      setTimeout(() => { worldCurtain.style.opacity = "0"; SCROLL.transition = false; }, 500);
    }, 380);
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
    const scrollBlock = SCROLL.active
      ? "\n\nThe visitor is currently in the special-exhibition room: A Thousand Li of Rivers and Mountains, by Wang Ximeng (Northern Song dynasty, dated 1113). Ink and color on silk, 51.5 × 1191.5 cm — the world's earliest surviving large-format blue-green landscape scroll, painted when Ximeng was 18 under Emperor Huizong's personal instruction; collection of the Palace Museum, Beijing. It is shown here as a 12-meter continuous handscroll. The surrounding walls display other Chinese masterworks for context: Along the River During the Qingming Festival (Zhang Zeduan), Night-Shining White (Han Gan, in the Met's own collection), Early Spring (Guo Xi), and Dwelling in the Fuchun Mountains (Huang Gongwang)."
      : "";
    return "You are Pip, the small glowing docent sprite of VGALLERY — a walkable 3D museum that recreates The Metropolitan Museum of Art's European Paintings galleries (an unofficial tribute; the artworks are drawn from the Met collection and arranged in an interpretive virtual setting).\n" +
      "Your job: answer the visitor's questions about the paintings, the artists, and the museum. Be warm and concise (under 120 words unless asked for more); say so plainly when you are not sure about something. Answer in the same language the visitor uses.\n" +
      "Paintings in this hall:\n" + lines.join("\n") + activeBlock + scrollBlock;
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
        if (SCROLL.active) {
          const sp = player.getPosition();
          // 仅真迹前开卡片；馆内其余位置 E 不动作——退出只走前厅门户（防误触被传送回大厅）
          if (sp.z > 0.1 && sp.x > 202 && sp.x < 215.5) { openScrollFocus(); return; }
          return;
        }
        if (worldRoot && worldRoot.visible) { closeUI(); return; }   // 画中世界漫游中：E 返回画廊
        if (highlighted) openInfo(highlighted);   // E → 锁定机位 + 信息卡
      } else {
        closeUI();                                 // 再按 E → 关闭（开关式）
      }
      return;
    }
    if ((ev.code === "Enter" || ev.code === "NumpadEnter") && (uiOpen === "focus" || uiOpen === "scrollfocus")) {
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
    if (ev.code === "Escape") {
      if (SCROLL.active) { exitScrollRoom(); return; }              // 特展厅：ESC 同样返回大厅
      if (uiOpen || (worldRoot && worldRoot.visible)) closeUI();    // 兜底（主用 E）
    }
  });
  document.getElementById("cd-close").addEventListener("click", closeUI);
  vidEl.querySelector(".close").addEventListener("click", closeUI);
  objEl.querySelector(".close").addEventListener("click", closeUI);
  // 特展影片终点：精准返回现实世界——提前 0.3s 触发（情愿早不能晚，晚了会看到片头回绕），
  // ended 兜底；仅特展模式生效（raw 类在身），油画馆的循环视频不受影响
  {
    const sv = document.getElementById("vid-player");
    const scrollCinemaEnd = () => {
      if (uiOpen === "video" && vidEl.classList.contains("raw")) closeUI();
    };
    sv.addEventListener("timeupdate", () => {
      if (sv.duration && sv.currentTime >= sv.duration - 0.3) scrollCinemaEnd();
    });
    sv.addEventListener("ended", scrollCinemaEnd);
  }

  // ── 语音小精灵「Pip」：分层光球 + 环绕 + 闪星 + 声波圈 + 眼睛（程序化占位） ──
  const spriteRoot = new THREE.Group();
  const PIP_UP = new THREE.Vector3(0, 1, 0);
  const pipGoal = new THREE.Vector3(), pipRight = new THREE.Vector3(), pipTargetA = new THREE.Vector3(), pipTargetB = new THREE.Vector3();
  const pipProj = new THREE.Vector3(), pipAbove = new THREE.Vector3();
  let pipCardRect = null;   // 信息卡屏幕区域（openInfo 时缓存），Pip 栖息位避开它
  let spriteCore, spriteInnerGlow, spriteOuterGlow, spriteEyes, spriteNameTag, spriteLight;
  let bodyMat, spriteWisp, spriteWings = [], eyeL, eyeR, smileMouth, talkMouth, cheekL, cheekR;
  let blinkClock = 2, blinkPhase = -1;   // 眨眼计时：blinkClock 到 0 触发，blinkPhase 走 0→1
  const spriteMotes = [], spriteSparkles = [], soundRings = [];
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
  {
    // 身体：泪滴形灵体（Lathe 成型），自写菲涅尔着色——中心奶白、边缘暖金描边，
    // 比"纯色小球"立体得多；uGlow 在说话时抬亮边缘光
    bodyMat = new THREE.ShaderMaterial({
      uniforms: { uGlow: { value: 0 } },
      vertexShader: `
        varying vec3 vN; varying vec3 vV; varying float vY;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          vY = position.y;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform float uGlow;
        varying vec3 vN; varying vec3 vV; varying float vY;
        void main() {
          float nd = abs(dot(normalize(vN), normalize(vV)));
          float rim = pow(1.0 - nd, 2.2);
          float core = pow(nd, 1.4);
          vec3 cream = vec3(0.93, 0.86, 0.7);
          vec3 warm = vec3(0.84, 0.6, 0.32);
          vec3 base = mix(cream, warm, smoothstep(0.08, -0.07, vY));
          vec3 col = base * (0.52 + 0.38 * core) + vec3(1.0, 0.74, 0.38) * (rim * (1.15 + uGlow));
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const bodyGeo = new THREE.LatheGeometry(
      [
        [0.0, -0.068], [0.023, -0.06], [0.044, -0.044], [0.058, -0.021],
        [0.065, 0.005], [0.062, 0.031], [0.049, 0.052], [0.029, 0.065], [0.0, 0.07],
      ].map((p) => new THREE.Vector2(p[0], p[1])),
      28
    );
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    spriteCore = body;
    spriteRoot.add(body);

    // 头顶小火苗（灵体"芯"）：锥体+亮尖+光晕，待机摇曳
    spriteWisp = new THREE.Group();
    spriteWisp.position.set(0, 0.066, 0);
    const wispCone = new THREE.Mesh(new THREE.ConeGeometry(0.0095, 0.02, 10),
      new THREE.MeshBasicMaterial({ color: 0xffc46a }));
    wispCone.position.y = 0.01;
    spriteWisp.add(wispCone);
    const wispTip = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff0c0 }));
    wispTip.position.y = 0.021;
    spriteWisp.add(wispTip);
    const wispGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTex("rgba(255,240,200,0.9)", "rgba(255,210,130,0.35)"),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8,
    }));
    wispGlow.scale.setScalar(0.075);
    wispGlow.position.y = 0.02;
    spriteWisp.add(wispGlow);
    spriteRoot.add(spriteWisp);

    spriteInnerGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTex("rgba(255,244,210,0.7)", "rgba(255,220,140,0.22)"),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    spriteInnerGlow.scale.setScalar(0.3);
    spriteRoot.add(spriteInnerGlow);

    spriteOuterGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTex("rgba(255,232,180,0.42)", "rgba(255,200,120,0.13)"),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.65,
    }));
    spriteOuterGlow.scale.setScalar(0.85);
    spriteRoot.add(spriteOuterGlow);

    // 倾斜环绕光环（9 颗大小/色调微差的灵尘，贴近身体成"电子"轨道）
    for (let i = 0; i < 9; i++) {
      const r = 0.005 + (i % 3) * 0.0025;
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

    // 整张脸（眼+腮+嘴）水平朝向镜头：大深色瞳仁 + 双高光点 = 水汪汪，
    // 眨眼由每帧 scale.y 收缩实现；腮红与嘴型让"可爱"落地
    spriteEyes = new THREE.Group();
    const scleraMat = new THREE.MeshBasicMaterial({ color: 0xfffdf2 });
    const inkMat = new THREE.MeshBasicMaterial({ color: 0x40301a });
    for (const sx of [-1, 1]) {
      const eye = new THREE.Group();
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.0145, 14, 12), scleraMat);
      eye.add(sclera);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0102, 12, 10), inkMat);
      pupil.position.set(0, -0.001, 0.008);
      eye.add(pupil);
      const hi1 = new THREE.Mesh(new THREE.SphereGeometry(0.0048, 8, 6), scleraMat);
      hi1.position.set(-0.0038, 0.0046, 0.0154);
      eye.add(hi1);
      const hi2 = new THREE.Mesh(new THREE.SphereGeometry(0.0024, 8, 6), scleraMat);
      hi2.position.set(0.0038, -0.0042, 0.0144);
      eye.add(hi2);
      // 五官向中心收拢：眼距 ±0.017、略低于中线 → 周围留白多，显胖乎乎
      eye.position.set(sx * 0.017, 0.012, 0.055);
      spriteEyes.add(eye);
      if (sx < 0) eyeL = eye; else eyeR = eye;
    }
    // 腮红：粉色小球半嵌进脸颊（真 3D，各角度可见；billboard 贴片在旋转脸组下渲染异常）
    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff9a8a, transparent: true, opacity: 0.5, depthWrite: false });
    const cheekGeo = new THREE.SphereGeometry(0.0082, 10, 8);
    cheekL = new THREE.Mesh(cheekGeo, cheekMat);
    cheekR = new THREE.Mesh(cheekGeo, cheekMat);
    cheekL.position.set(-0.034, -0.012, 0.05);
    cheekR.position.set(0.034, -0.012, 0.05);
    spriteEyes.add(cheekL, cheekR);
    // 嘴：待机细微笑弧；说话切换为椭圆嘴型随音节开合
    const mouth = new THREE.Group();
    mouth.position.set(0, -0.013, 0.062);
    smileMouth = new THREE.Mesh(new THREE.TorusGeometry(0.0068, 0.0009, 6, 20, Math.PI * 0.7), inkMat);
    smileMouth.rotation.z = -Math.PI * 0.85;   // 弧口朝上 = 笑
    mouth.add(smileMouth);
    talkMouth = new THREE.Mesh(new THREE.CircleGeometry(0.0046, 14), inkMat);
    talkMouth.position.z = 0.002;
    talkMouth.visible = false;
    mouth.add(talkMouth);
    spriteEyes.add(mouth);
    spriteRoot.add(spriteEyes);

    // 小翅膀：背后一对半透明"糖片"，双层椭圆，绕根部扑扇
    const wingMat = new THREE.MeshBasicMaterial({
      color: 0xfff0c8, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide,
    });
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * 0.03, 0.02, -0.034);
      const w1 = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 8), wingMat);
      w1.scale.set(1.55, 0.62, 0.1);
      w1.position.set(sx * 0.026, 0.006, -0.01);
      pivot.add(w1);
      const w2 = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), wingMat);
      w2.scale.set(1.2, 0.75, 0.1);
      w2.position.set(sx * 0.02, -0.01, -0.007);
      pivot.add(w2);
      pivot.rotation.y = sx * -0.55;   // 翅面向外后方展开
      spriteRoot.add(pivot);
      spriteWings.push({ pivot, sx, phase: sx > 0 ? 0.35 : 0 });
    }

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
  window.__pip = { root: spriteRoot, face: spriteEyes, body: spriteCore };   // 调试/截图钩子

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
    "sunflowers", "manet", "pareja", "degas-collector", "crown", "met-435844", "piazza", "met-435908", "qianli"]);   // met-435844=Musicians, piazza(435882)=Piazza San Marco, met-435908=Trojan Women（语音均已生成）
  // 展品 id 与语音文件 id 的历史错位：435908 的语音当年以 trojan 为 id 生成（script.json/trojan.wav），
  // 直接用 met-435908 取文件会 404 静默失败 → 播放前按此表改写
  const AUDIO_ALIAS = { "met-435908": "trojan" };
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
  const scrollVoice = new THREE.Audio(audioListener);   // 特展语音走非空间化通道：Pip 精灵远在主馆，位置声像会衰减到无声

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
    try { if(scrollVoice.isPlaying)scrollVoice.stop(); } catch {}
    speaking=false;currentAudioId=null;
  }
  async function playAudio(id,onEnd,node = positional) {
    id = AUDIO_ALIAS[id] || id;
    stopAudio();
    const ticket=audioTicket;currentAudioId=id;
    try {
      if(audioListener.context.state==="suspended")await audioListener.context.resume();
      const buf=await loadSound(id);
      if(ticket!==audioTicket)return;
      node.setBuffer(buf);
      node.onEnded=()=>{
        node.isPlaying=false;
        if(ticket!==audioTicket)return;
        speaking=false;currentAudioId=null;if(onEnd)onEnd();
      };
      node.play();speaking=true;
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
    if (SCROLL.active) {   // 特展长廊：只有《千里江山图》真迹前给提示；其余为装饰画，
      const sp = player.getPosition();   // 不提示、按 E 也不动作（馆内退出只走门户，防误触返回）
      const atScroll = sp.z > 0.1 && sp.x > 202 && sp.x < 215.5;
      hintEl.style.bottom = "112px";
      if (atScroll) {
        hintEl.textContent = "Press E — A Thousand Li of Rivers and Mountains";
        hintEl.style.display = "block";
      } else {
        hintEl.style.display = "none"; hintEl.textContent = "";
      }
      highlighted = null;
      return;
    }
    hintEl.style.bottom = "";   // 大厅提示回默认高度（scroll 分支以外每帧归位）
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
  window.__reviewAudio=()=>({id:currentAudioId,playing:positional.isPlaying||scrollVoice.isPlaying,ticket:audioTicket});
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

    // 走廊门户触发：大厅两端走廊深处 ↔ 特展厅（游戏式切图，无物理拼接）
    if (!SCROLL.transition) {
      const pp = player.getPosition();
      if (!SCROLL.active) {
        if (pp.z < -11.85) portalToRoom("N");
      } else if (!uiOpen) {
        if (pp.x > 215.85 && Math.abs(pp.z) < 0.8) portalToHall("N");       // 前厅门 → 北廊
      }
    }

    // 特展厅 E 主视角：沿长卷行走时相机跟随最近的画段（走到哪看到哪）
    if (uiOpen === "scrollfocus") {
      if (!pipChat.open) player.update(delta);
      updateScrollFocusCam(delta);
      renderer.render(scene, camera);
      return;
    }

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
      // 呼吸挤压拉伸（squash & stretch）：待机轻呼吸，说话时随音节弹跳
      const breathe = Math.sin(t * 2.6) * 0.035 + (speaking ? Math.abs(Math.sin(t * 11)) * 0.07 : 0);
      spriteCore.scale.set(1 - breathe * 0.55, 1 + breathe, 1 - breathe * 0.55);
      const speakPulse = speaking ? 1 + Math.sin(t * 11) * 0.26 : 1 + Math.sin(t * 2.2) * 0.06;
      spriteInnerGlow.scale.setScalar(0.3 * (speaking ? 1.2 * speakPulse : speakPulse));
      spriteOuterGlow.scale.setScalar(0.85 * (speaking ? 1.12 : 1 + Math.sin(t * 1.1) * 0.05));
      spriteOuterGlow.material.opacity = speaking ? 0.8 : 0.6;
      spriteLight.intensity = speaking ? 3.8 : 2.1;
      bodyMat.uniforms.uGlow.value = speaking ? 0.55 + Math.sin(t * 11) * 0.3 : 0;
      spriteWings.forEach((w) => {
        w.pivot.rotation.z = w.sx * (0.14 + Math.sin(t * (speaking ? 12.5 : 7.5) + w.phase) * 0.42);
      });
      spriteWisp.rotation.z = Math.sin(t * 3.1) * 0.16;
      spriteWisp.rotation.x = Math.cos(t * 2.4) * 0.1;
      // 眨眼：2.2~5s 随机触发，0.16s 闭合一循环
      blinkClock -= delta;
      if (blinkClock <= 0) { blinkClock = 2.2 + Math.random() * 2.8; blinkPhase = 0; }
      if (blinkPhase >= 0) {
        blinkPhase += delta / 0.16;
        if (blinkPhase >= 1) blinkPhase = -1;
      }
      const blinkK = blinkPhase < 0 ? 1 : 0.08 + Math.abs(1 - blinkPhase * 2) * 0.92;
      eyeL.scale.y = blinkK; eyeR.scale.y = blinkK;
      smileMouth.visible = !speaking; talkMouth.visible = speaking;
      if (speaking) talkMouth.scale.set(1, 0.45 + Math.abs(Math.sin(t * 10)) * 0.85, 1);
      spriteMotes.forEach((m, i) => {
        const a = t * (speaking ? 2.4 : 1.0) + (i / spriteMotes.length) * Math.PI * 2;
        const rr = 0.115 + Math.sin(t * 1.3 + i) * 0.008;
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
      // 脸朝向镜头（水平方向），说话时整脸微放大
      spriteEyes.lookAt(camNow2.x, spriteEyes.getWorldPosition(new THREE.Vector3()).y, camNow2.z);
      spriteEyes.scale.setScalar(speaking ? 1.06 : 1);
      // 名字标签：说话时浮出，之后淡出
      const tagTarget = speaking ? 0.95 : 0;
      spriteNameTag.material.opacity += (tagTarget - spriteNameTag.material.opacity) * Math.min(1, delta * 5);
      spriteNameTag.position.y = 0.26 + bob * 0.6;
    }

    // 特展厅传送后视角对齐：GTA 式相机每帧从相机当前位置重算 yaw，因此在 player.update
    // 之后再旋转（setToward→orbit 改相机位置，下一帧 yaw 即保持）；dx 直乘弧度（-dx·sens）。
    // 一次 setToward 即精确转 err，之后冷却数帧只观察；hold 到期且稳定才解除
    if (SCROLL.active && SCROLL.alignYaw !== null) {
      const a = SCROLL.alignYaw;
      const f = camera.getWorldDirection(new THREE.Vector3());
      const cur = Math.atan2(f.x, f.z);
      let err = a.want - cur;
      while (err > Math.PI) err -= 2 * Math.PI;
      while (err < -Math.PI) err += 2 * Math.PI;
      if (a.cool > 0) { a.cool--; }
      else if (Math.abs(err) < 0.01) { if (a.hold-- <= 0) SCROLL.alignYaw = null; }
      else { player.cam.setToward(-err / (player.cam.sensitivity || 1), 0, 1); a.cool = 4; }
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
  // 调试：运行时加载任意 GLB 到场景（模型迭代预览用）
  window.__vgLoadGLB = async (url, x = 0, y = 1.3, z = 6) => {
    const g = await gltfLoader.loadAsync(url);
    g.scene.position.set(x, y, z);
    scene.add(g.scene);
    return g;
  };

  renderer.render(scene, camera);
  // 预编译全馆材质 + 皇冠 360 场景：藏在加载遮罩后面，消除开馆后走动/首次互动的编译 hitch
  renderer.compile(scene, camera);
      // Refresh the skinned material uniforms after compile; stale shadow samplers caused GL_INVALID_OPERATION when the avatar entered view.
      scene.traverse(o => { if (o.isSkinnedMesh) for (const m of [].concat(o.material)) m.needsUpdate = true; });
  renderer.compile(objScene, objCamera);
  loading.classList.add("done");

  // 地图直选特展厅（index.html "Special Exhibition" → walktest.html?wing=scroll）
  if (new URLSearchParams(location.search).get("wing") === "scroll") enterScrollRoom();

  (function animate() {
    requestAnimationFrame(animate);
    const now = perfClock();
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    frame(delta, now);
  })();
}

main().catch((e) => { window.__reportError(e); console.error(e); });
