// PLY/splat → .ksplat 转换（压缩版本），并输出位置包围盒
// 用法: node tools/splat/convert.mjs <in.ply> <out.ksplat> [compression=1] [alphaRemove=5] [shDegree=0]
import * as GaussianSplats3D from '../../walkapp/node_modules/@mkkellogg/gaussian-splats-3d/build/gaussian-splats-3d.module.js';
import * as fs from 'node:fs';

const [, , inFile, outFile, compArg, alphaArg, shArg] = process.argv;
if (!inFile || !outFile) { console.log('usage: node convert.mjs in.ply out.ksplat [compression] [alphaRemove] [shDegree]'); process.exit(1); }
const compression = compArg !== undefined ? parseInt(compArg) : 1;
const alphaRemove = alphaArg !== undefined ? parseInt(alphaArg) : 5;
const shDegree = shArg !== undefined ? parseInt(shArg) : 0;

const buf = fs.readFileSync(inFile);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

// 先解析出 splat 数组，顺便算包围盒
const splatArray = GaussianSplats3D.PlyParser.parseToUncompressedSplatArray(ab, shDegree);
let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < splatArray.splatCount; i++) {
  const s = splatArray.splats[i];
  for (let k = 0; k < 3; k++) {
    if (s[k] < min[k]) min[k] = s[k];
    if (s[k] > max[k]) max[k] = s[k];
  }
}
console.log('splats:', splatArray.splatCount);
console.log('bbox min:', min.map(v => +v.toFixed(3)).join(', '));
console.log('bbox max:', max.map(v => +v.toFixed(3)).join(', '));
console.log('size:', [0,1,2].map(k => +(max[k]-min[k]).toFixed(3)).join(' x '));

const gen = GaussianSplats3D.SplatBufferGenerator.getStandardGenerator(alphaRemove, compression, 0);
const splatBuffer = gen.generateFromUncompressedSplatArray(splatArray);
fs.writeFileSync(outFile, Buffer.from(splatBuffer.bufferData));
console.log('written:', outFile, (fs.statSync(outFile).size / 1048576).toFixed(1), 'MB');
