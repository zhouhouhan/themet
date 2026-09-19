import fs from 'node:fs';
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const KEY = env.QWEN_TTS_API_KEY, EP = env.QWEN_TTS_ENDPOINT;
const TEXT = 'Welcome to the gallery! I am your little guide — come along, and let us look at some beautiful things together.';
fs.mkdirSync('assets/audio/voicesamples', { recursive: true });
for (const voice of ['Cherry', 'Serena', 'Jennifer', 'Kiki']) {
  try {
    const r = await fetch(EP, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'qwen3-tts-flash', input: { text: TEXT, voice } }),
    });
    if (!r.ok) { console.log(voice, 'HTTP', r.status, (await r.text()).slice(0, 100)); continue; }
    const j = await r.json();
    const url = j?.output?.audio?.url;
    if (!url) { console.log(voice, 'NO_URL', JSON.stringify(j).slice(0, 120)); continue; }
    const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(`assets/audio/voicesamples/${voice}.wav`, bytes);
    console.log(voice, 'OK', bytes.length, 'bytes');
  } catch (e) { console.log(voice, 'ERR', String(e).slice(0, 100)); }
}
