# vgallery 离线包静态服务器（Python 3 标准库，零依赖）
# 用法: python serve.py [端口]，默认 8080
import http.server
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
    '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.json': 'application/json',
    '.mp4': 'video/mp4', '.wav': 'audio/wav', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
}


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def do_GET(self):
        p = self.path.split('?')[0].split('#')[0]
        if p == '/':
            p = '/index.html'
        try:
            p = os.path.normpath(os.path.join(ROOT, p.lstrip('/')))
            if not p.startswith(ROOT):
                raise FileNotFoundError
            st = os.stat(p)
        except (OSError, ValueError):
            self.send_error(404)
            return
        ctype = TYPES.get(os.path.splitext(p)[1].lower(), 'application/octet-stream')
        rng = self.headers.get('Range')
        if rng:
            m = re.search(r'bytes=(\d*)-(\d*)', rng)
            start = int(m.group(1)) if m and m.group(1) else 0
            end = min(int(m.group(2)), st.st_size - 1) if m and m.group(2) else st.st_size - 1
            self.send_response(206)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Range', f'bytes {start}-{end}/{st.st_size}')
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Content-Length', str(end - start + 1))
            self.end_headers()
            with open(p, 'rb') as f:
                f.seek(start)
                self.wfile.write(f.read(end - start + 1))
        else:
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(st.st_size))
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()
            with open(p, 'rb') as f:
                while True:
                    chunk = f.read(1 << 20)
                    if not chunk:
                        break
                    self.wfile.write(chunk)

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    print(f'vgallery offline server: http://127.0.0.1:{PORT}/index.html  (Ctrl+C 停止)')
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
