// vgallery 离线包静态服务器（零依赖，Node.js >= 14）
// 支持 Range 请求（视频可拖动进度条）。用法: node server.js [端口]，默认 8080
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.json': 'application/json',
  '.mp4': 'video/mp4', '.wav': 'audio/wav', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
};
http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch { res.writeHead(400); return res.end(); }
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('404'); }
    const type = types[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
      let start = m[1] ? +m[1] : 0;
      let end = m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${st.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
      });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(file).pipe(res);
    }
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`vgallery offline server: http://127.0.0.1:${PORT}/index.html  (Ctrl+C 停止)`);
});
