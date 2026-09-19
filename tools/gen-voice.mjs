// vgallery 语音包生成器（复用 TED 项目沉淀：Qwen3-TTS + sha256 缓存）
// 用法: node tools/gen-voice.mjs [voice]     默认 script.json 里的 voice
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const KEY = env.QWEN_TTS_API_KEY, EP = env.QWEN_TTS_ENDPOINT;
if (!KEY || !EP) throw new Error('缺少 QWEN_TTS_API_KEY / QWEN_TTS_ENDPOINT（.env.local）');

const script = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/audio/script.json'), 'utf8'));
const voice = process.argv[2] || script.voice;
const only = process.argv.slice(3);   // 可选：只生成指定 id
const model = script.model;
const OUT = path.join(ROOT, 'assets/audio', voice);
const MANIFEST = path.join(OUT, 'manifest.json');
fs.mkdirSync(OUT, { recursive: true });
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};

let made = 0, skipped = 0;
for (const [id, text] of Object.entries(script.lines)) {
  if (only.length && !only.includes(id)) continue;
  const hash = crypto.createHash('sha256').update(`${model}|${voice}|${text}`).digest('hex').slice(0, 32);
  const prev = manifest[id];
  const file = path.join(OUT, `${id}.wav`);
  if (prev && prev.hash === hash && fs.existsSync(file)) { skipped++; continue; }
  const r = await fetch(EP, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: { text, voice } }),
  });
  if (!r.ok) { console.log('FAIL', id, r.status, (await r.text()).slice(0, 120)); continue; }
  const j = await r.json();
  const url = j?.output?.audio?.url;
  if (!url) { console.log('FAIL', id, 'no audio url'); continue; }
  const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(file, bytes);
  manifest[id] = { hash, bytes: bytes.length };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
  console.log('OK  ', id, bytes.length, 'bytes');
  made++;
}
console.log(`\nvoice=${voice}  generated=${made}  cached=${skipped}  →  assets/audio/${voice}/`);
