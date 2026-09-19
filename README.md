# themet — Walkable 3D Metropolitan Museum (European Paintings)

网页端第一人称 3D 博物馆（Three.js）：大都会艺术博物馆欧洲绘画翼展厅，13+ 件可交互展品——
信息卡、语音导览、画框内活画视频（9 幅）、全屏沉浸影片（特洛伊妇女）、走进画中的圣马可广场世界、
皇冠 360° 展柜、Pip AI 伴游问答（DeepSeek）。非官方致敬作品（Unofficial tribute to The Met）。

## 仓库结构

| 路径 | 说明 |
| --- | --- |
| `walkapp/walktest-entry.mjs` | 主功能源码（唯一源码母版，所有改动从这里改） |
| `js/walktest-bundle.js` | esbuild 打包产物，网站实际加载的文件（**改源码后必须重建**，勿直接改） |
| `index.html` | 入口流程：封面 → Museum Map 展厅选择 → 进入 3D |
| `walktest.html` | 3D 展厅验收入口 |
| `dragtest.html` | 拖拽视角自检页（10 项断言） |
| `walkapp/visual-polish.mjs` | 视觉后处理模块 |
| `tools/` | Blender 画廊生成/优化、GLB 压缩、浏览器自动化验收脚本 |
| `V6-REPAIRS.md` | 按日期的完整修复与验证日志（**事实基准，接手先读**） |
| `assets/paintings/met-originals/entrance-v6.json` | 藏品真实元数据（来自 Met 公开 API） |

## 本地运行

双击 `start.bat`（自动探测 Node/Python，默认端口 8080，仅绑定 127.0.0.1），或手动：

```bash
python -m http.server 8080 --bind 127.0.0.1
# 打开 http://127.0.0.1:8080/index.html
```

## 构建

修改 `walkapp/` 源码后重建 bundle：

```bash
cd walkapp && ./node_modules/.bin/esbuild walktest-entry.mjs --bundle --minify --format=esm --outfile=../js/walktest-bundle.js
```

## AI 问答配置（Pip）

```bash
cp js/ai-config.example.js js/ai-config.js   # 然后填入自己的 DeepSeek API key
```

`js/ai-config.js` 已被 `.gitignore` 排除——**切勿把真实 key 提交进仓库**。
生产环境建议把 key 放到服务端代理，不要随前端公开。

## 不在仓库里的部分

- 大体积资产（GLB 模型、活画/沉浸视频、语音、贴图、UI 底图）不入库；完整可运行包见 `vgallery-offline/`（约 100MB，本地打包为 `vgallery-offline-*.zip`）。
- Blender 母版在 `assets/models/blender/`（本地保留）。
- 部署脚本与服务器信息仅在本地维护（规矩：SSH stdin 逐文件传输 + md5 校验，见 V6-REPAIRS.md 2026-09-16 节）。

## 验收约定

区分四种状态：源码完成 → 浏览器断言通过 → 视觉复验 → 已部署。验证记录一律写入 `V6-REPAIRS.md`，截图存 `verify-shots/`（本地，不入库）。
