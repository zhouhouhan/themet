// inspect-scroll-uv.mjs — 检查特展 GLB 各贴图平面的 UV 朝向是否镜像 (zcode 2026-09-20)
// 判定：对每个平面，取其 4 顶点的 (世界化局部坐标, u)；u 增长方向若与"观者右手边"相反 → 镜像。
// 房间局部: 入口 x=0、画墙 y=+2.1（面朝 -y 观看，观者右手 = -x? 见输出对照表）。
import { readFileSync } from "node:fs";

const buf = readFileSync("assets/models/scroll-gallery-v1.glb");
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
const binStart = 20 + jsonLen + 8;

const accView = (ai) => json.bufferViews[json.accessors[ai].bufferView];
function readAcc(ai) {
  const a = json.accessors[ai], v = accView(ai);
  const off = (v.byteOffset || 0) + (a.byteOffset || 0) + binStart;
  const n = a.count, comps = { VEC3: 3, VEC2: 2, SCALAR: 1 }[a.type];
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = [];
    for (let c = 0; c < comps; c++) r.push(buf.readFloatLE(off + (i * comps + c) * 4));
    out.push(r);
  }
  return out;
}
const matByName = {}; json.materials.forEach((m, i) => (matByName[m.name] = i));
const meshByMat = {}; json.meshes.forEach((m, mi) => {
  for (const p of m.primitives) meshByMat[p.material] = mi;
});

for (const want of ["TITLE_PLATE", "CREDIT_PLATE", "scroll_slice_01", "scroll_slice_10", "scroll_colophon_01"]) {
  const mi = meshByMat[matByName[want]];
  const mesh = json.meshes[mi];
  const prim = mesh.primitives[0];
  const pos = readAcc(prim.attributes.POSITION);
  const uv = readAcc(prim.attributes.TEXCOORD_0);
  const nodeName = json.nodes.find((n) => n.mesh === mi)?.name ?? "?";
  console.log(`\n== ${want} (node ${nodeName}, ${pos.length} verts) ==`);
  for (let i = 0; i < pos.length; i++) {
    console.log(`  v${i}: pos=(${pos[i].map((v) => +v.toFixed(3)).join(",")})  uv=(${uv[i].map((v) => +v.toFixed(3)).join(",")})`);
  }
}
