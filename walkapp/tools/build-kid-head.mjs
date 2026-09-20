// 儿童人像头模离线管线：D:\Download\儿童人像3d模型.glb（Tripo 生成，1.92M 面曹 58.8MB）
// → 找脖颈最细处 → 裁掉衣服 → meshopt 简化到 ~30k 面（锁裁切边界、保 UV）→ 重打包小 GLB
// 用法: node tools/build-kid-head.mjs [输入.glb] [输出.glb] [目标面数]
import fs from 'node:fs';
import path from 'node:path';
import { MeshoptSimplifier } from 'meshoptimizer/simplifier';

const SRC = process.argv[2] || 'D:/Download/儿童人像3d模型.glb';
const DST = process.argv[3] || '../assets/models/characters/kid-head.glb';
const TARGET_TRIS = Number(process.argv[4] || 30000);

const COMP = { 5120: [1, Int8Array], 5121: [1, Uint8Array], 5122: [2, Int16Array], 5123: [2, Uint16Array], 5125: [4, Uint32Array], 5126: [4, Float32Array] };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function parseGLB(file) {
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  const binLen = buf.readUInt32LE(20 + jsonLen);
  const bin = buf.slice(28 + jsonLen, 28 + jsonLen + binLen);
  return { json, bin };
}
function readAccessor({ json, bin }, ai) {
  const acc = json.accessors[ai];
  const bv = json.bufferViews[acc.bufferView];
  const [bytes, Arr] = COMP[acc.componentType];
  const ncomp = NCOMP[acc.type];
  const stride = bv.byteStride || bytes * ncomp;
  const base = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const count = acc.count;
  const out = new Float32Array(count * ncomp);
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  let little = true;
  for (let i = 0; i < count; i++) {
    for (let c = 0; c < ncomp; c++) {
      const off = base + i * stride + c * bytes;
      let v;
      if (acc.componentType === 5126) v = view.getFloat32(off, little);
      else if (acc.componentType === 5125) v = view.getUint32(off, little);
      else if (acc.componentType === 5123) v = view.getUint16(off, little);
      else if (acc.componentType === 5122) v = view.getInt16(off, little);
      else if (acc.componentType === 5121) v = view.getUint8(off);
      else v = view.getInt8(off);
      if (acc.normalized && acc.componentType !== 5126) v /= (acc.componentType === 5123 ? 65535 : 255);
      out[i * ncomp + c] = v;
    }
  }
  return out;
}

console.log('reading', SRC);
const { json, bin } = parseGLB(SRC);
const prim = json.meshes[0].primitives[0];
const pos = readAccessor({ json, bin }, prim.attributes.POSITION);
const nor = readAccessor({ json, bin }, prim.attributes.NORMAL);
const uv = readAccessor({ json, bin }, prim.attributes.TEXCOORD_0);
const idxAcc = json.accessors[prim.indices];
let idx = readAccessor({ json, bin }, prim.indices).map((v) => v | 0);
console.log('in: verts=%d tris=%d', pos.length / 3, idx.length / 3);

// ── 找脖颈：y 分带算水平半径均值，领口/肩部半径大、脖颈最细 ──
const N = pos.length / 3;
let minY = Infinity, maxY = -Infinity;
for (let i = 0; i < N; i++) { const y = pos[i * 3 + 1]; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const BANDS = 64;
const sum = new Float64Array(BANDS), cnt = new Float64Array(BANDS);
for (let i = 0; i < N; i++) {
  const y = pos[i * 3 + 1], r = Math.hypot(pos[i * 3], pos[i * 3 + 2]);
  const b = Math.min(BANDS - 1, Math.floor(((y - minY) / (maxY - minY)) * BANDS));
  sum[b] += r; cnt[b]++;
}
const prof = Array.from({ length: BANDS }, (_, b) => (cnt[b] ? sum[b] / cnt[b] : 0));
console.log('radius profile (bottom→top):');
prof.forEach((r, b) => process.stdout.write(`  ${(minY + ((b + 0.5) * (maxY - minY)) / BANDS).toFixed(2)}:${r.toFixed(3)}\n`));
if (process.env.PROF) { console.log('PROF-ONLY STOP'); process.exit(0); }
// 脖颈 = y∈[0.35,0.80] 全高中最细的带（平滑 2 带防噪）
const sm = prof.map((_, b) => { const s = [b - 1, b, b + 1].filter(x => x >= 0 && x < BANDS); return s.reduce((a, x) => a + prof[x], 0) / s.length; });
let neckBand = -1, neckR = Infinity;
for (let b = 0; b < BANDS; b++) {
  const yb = minY + ((b + 0.5) * (maxY - minY)) / BANDS;
  if (yb < 0.35 || yb > 0.80) continue;
  if (sm[b] < neckR) { neckR = sm[b]; neckBand = b; }
}
const neckY = minY + ((neckBand + 0.5) * (maxY - minY)) / BANDS;
// 裁切线：自动=脖颈最细处下方 4cm；可用第 5 参数强制指定（自动探测会切到下颌）
let cutY = neckY - 0.04;
if (process.argv[5]) cutY = Number(process.argv[5]);
console.log(`neck band y=${neckY.toFixed(3)} r=${neckR.toFixed(3)} -> cutY=${cutY.toFixed(3)}`);

// ── 裁切：质心在裁切线以上的三角形保留 ──
const keep = [];
for (let t = 0; t < idx.length; t += 3) {
  const a = idx[t] * 3, b2 = idx[t + 1] * 3, c = idx[t + 2] * 3;
  const cy = (pos[a + 1] + pos[b2 + 1] + pos[c + 1]) / 3;
  if (cy >= cutY) keep.push(idx[t], idx[t + 1], idx[t + 2]);
}
idx = Uint32Array.from(keep);
console.log('after cut: tris=%d', idx.length / 3);

// ── 裁切边界顶点锁定（开边=被引用一次的边）──
const edgeCount = new Map();
const ekey = (a, b) => a < b ? a * 4294967296 + b : b * 4294967296 + a;
for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) {
  const a = idx[t + k], b2 = idx[t + (k + 1) % 3], key = ekey(a, b2);
  edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
}
const border = new Uint8Array(N);
for (const [key, c] of edgeCount) if (c === 1) { border[Math.floor(key / 4294967296)] = 1; border[key % 4294967296] = 1; }
const lockedN = border.reduce((a, b) => a + b, 0);
console.log('border verts locked:', lockedN);

// ── 简化：保 UV 属性、锁边界 ──
await MeshoptSimplifier.ready;
const targetIdx = TARGET_TRIS * 3;
const [sidx] = MeshoptSimplifier.simplifyWithAttributes(idx, pos, 3, uv, 2, [1.0], border, targetIdx, 0.01, ['LockBorder']);
idx = sidx;
console.log('after simplify: tris=%d', idx.length / 3);

// ── 压缩顶点（只留被引用的）+ 枢轴移到裁切环中心 ──
const used = new Map(); const remap = new Uint32Array(N).fill(0xffffffff);
let next = 0;
for (let t = 0; t < idx.length; t++) { const v = idx[t]; if (!used.has(v)) { used.set(v, next++); remap[v] = used.get(v); } }
const V = next;
const outPos = new Float32Array(V * 3), outNor = new Float32Array(V * 3), outUv = new Float32Array(V * 2);
let cx = 0, cz = 0, cn = 0;
let mnx = Infinity, mxx = -Infinity, mnz = Infinity, mxz = -Infinity;
for (const [oldV, newV] of used) {
  const y = pos[oldV * 3 + 1];
  if (y >= cutY + 0.15) {   // 颅顶段：左右对称的中心才是头轴
    const x = pos[oldV * 3], z = pos[oldV * 3 + 2];
    if (x < mnx) mnx = x; if (x > mxx) mxx = x;
    if (z < mnz) mnz = z; if (z > mxz) mxz = z;
  }
}
cx = (mnx + mxx) / 2; cz = (mnz + mxz) / 2; cn = 1;
for (const [oldV, newV] of used) {
  { cx = cx; }
  for (let c = 0; c < 3; c++) { outPos[newV * 3 + c] = pos[oldV * 3 + c]; outNor[newV * 3 + c] = nor[oldV * 3 + c]; }
  outUv[newV * 2] = uv[oldV * 2]; outUv[newV * 2 + 1] = uv[oldV * 2 + 1];
}
cx /= cn; cz /= cn;
for (let i = 0; i < V; i++) { outPos[i * 3] -= cx; outPos[i * 3 + 2] -= cz; outPos[i * 3 + 1] -= cutY; }
for (let t = 0; t < idx.length; t++) idx[t] = remap[idx[t]];
let bbY = 0, bbR = 0;
for (let i = 0; i < V; i++) { bbY = Math.max(bbY, outPos[i * 3 + 1]); bbR = Math.max(bbR, Math.hypot(outPos[i * 3], outPos[i * 3 + 2])); }
console.log(`out: verts=${V} tris=${idx.length / 3} height=${bbY.toFixed(3)} ringRadius=${bbR.toFixed(3)} pivot=neck-ring-center`);

// ── 重打包 GLB（原 JPEG 原样嵌入）──
const imgBV = json.bufferViews[json.images[0].bufferView];
const jpeg = bin.slice((imgBV.byteOffset || 0), (imgBV.byteOffset || 0) + imgBV.byteLength);
const pad4 = (n) => (4 - (n % 4)) % 4;
const bPos = Buffer.from(outPos.buffer), bNor = Buffer.from(outNor.buffer), bUv = Buffer.from(outUv.buffer), bIdx = Buffer.from(idx.buffer);
const chunks = [bPos, bNor, bUv, bIdx, jpeg].map((b, i) => { const p = Buffer.alloc(pad4(b.length)); return { data: b, pad: p, off: 0 }; });
let off = 0; for (const c of chunks) { c.off = off; off += c.data.length + c.pad.length; }
const bvOf = (c) => c.off;
const outJson = {
  asset: { version: '2.0', generator: 'vgallery build-kid-head' },
  scene: 0, scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: 'kid_head' }],
  meshes: [{ name: 'kid_head', primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
  materials: [{ name: 'kid_head_mat', pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0.0, roughnessFactor: 0.9 } }],
  textures: [{ sampler: 0, source: 0 }],
  images: [{ bufferView: 4, mimeType: 'image/jpeg' }],
  samplers: [{ wrapS: 10497, wrapT: 10497, magFilter: 9729, minFilter: 9987 }],
  accessors: [
    { bufferView: 0, componentType: 5126, count: V, type: 'VEC3', min: [-0.4, 0, -0.4], max: [0.4, bbY, 0.4] },
    { bufferView: 1, componentType: 5126, count: V, type: 'VEC3' },
    { bufferView: 2, componentType: 5126, count: V, type: 'VEC2' },
    { bufferView: 3, componentType: 5125, count: idx.length, type: 'SCALAR' },
  ],
  bufferViews: chunks.map((c) => ({ buffer: 0, byteOffset: c.off, byteLength: c.data.length })),
  buffers: [{ byteLength: off }],
};
const enc = new TextEncoder();
let jsonBuf = enc.encode(JSON.stringify(outJson));
jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(pad4(jsonBuf.length), 0x20)]);
const binBuf = Buffer.concat(chunks.map((c) => Buffer.concat([c.data, c.pad])));
const total = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
const glb = Buffer.alloc(total);
glb.writeUInt32LE(0x46546C67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(total, 8);
glb.writeUInt32LE(jsonBuf.length, 12); glb.writeUInt32LE(0x4E4F534A, 16);
jsonBuf.copy(glb, 20);
glb.writeUInt32LE(binBuf.length, 20 + jsonBuf.length); glb.writeUInt32LE(0x004E4942, 24 + jsonBuf.length);
binBuf.copy(glb, 28 + jsonBuf.length);
const dstAbs = path.resolve(import.meta.dirname, DST);
fs.mkdirSync(path.dirname(dstAbs), { recursive: true });
fs.writeFileSync(dstAbs, glb);
console.log('written ' + dstAbs + ' (' + (glb.length / 1048576).toFixed(1) + 'MB)');
