import * as GaussianSplats3D from '../../walkapp/node_modules/@mkkellogg/gaussian-splats-3d/build/gaussian-splats-3d.module.js';
import * as fs from 'node:fs';
const buf = fs.readFileSync(process.argv[2]);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const arr = GaussianSplats3D.PlyParser.parseToUncompressedSplatArray(ab, 0);
const ys = [];
for (let i = 0; i < arr.splatCount; i++) ys.push(arr.splats[i][1]);
ys.sort((a, b) => a - b);
const q = (p) => ys[Math.floor(ys.length * p)];
console.log('Y percentiles: 1%', q(0.01).toFixed(2), '5%', q(0.05).toFixed(2), '25%', q(0.25).toFixed(2), '50%', q(0.5).toFixed(2), '75%', q(0.75).toFixed(2));
// 直方图粗看分布
const min = ys[0], max = ys[ys.length - 1];
const bins = new Array(12).fill(0);
for (const y of ys) bins[Math.min(11, Math.floor((y - min) / (max - min) * 12))]++;
console.log('hist:', bins.map((b, i) => ((min + (max - min) * i / 12).toFixed(0)) + ':' + (b / 1000).toFixed(0) + 'k').join(' '));
