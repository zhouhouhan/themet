# VGALLERY 全项目深度评审交接 · 交 GPT · 2026-09-15

## 任务性质

不是继续堆功能，而是**整体 deep review**：项目已连续开发多轮（v1→v6 + 画中世界 + 落地页 + Pip 精灵），代码量很大、从未做过整体审查。请以"找出大问题"的视角通读，而不是逐行润色。

根目录：`Z:\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery`（等价 UNC `\\192.168.31.246\Media\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery`）。

## 项目是什么

可行走的 three.js 三维油画馆（非官方致敬 The Met European Paintings）：

- `index.html`：落地页（封面 → 选厅 → 进 `walktest.html`），纯 DOM 热点 + 截图底图。
- `walktest.html` → `js/walktest-bundle.js`：主站。源码 `walkapp/walktest-entry.mjs`（~1700 行单文件），esbuild 打包：
  `cd walkapp && npx esbuild walktest-entry.mjs --bundle --minify --format=esm --outfile=../js/walktest-bundle.js`
- 画廊模型 `assets/models/gallery-v6.glb`（53MB，Blender 生成，见 `tools/complete-gallery-v6.py` / `optimize-gallery-v6.py` / `compact-glb-images.py`）。
- 12+2 幅画按 GLB 节点名 `ART <metID> <title>` 绑定元数据（`ART_BY_MET_ID`）。
- 展品交互四类：图文卡（focus 锁机位）、画框内视频（活画）、皇冠 360°（独立场景+指针锁定）、**画中世界**（`kind:"world"`，Canaletto《Piazza San Marco》→ `assets/models/worlds/piazza-san-marco-v2/piazza-san-marco.glb`，6.7MB）。
- 第三方角色控制：`three-player-controller`（node_modules，0.6.2），物理胶囊+BVH 碰撞（`three-mesh-bvh`），GTA 式相机由本项目在 frame 循环里每帧覆写（控制器自身弹簧相机关闭）。
- Pip：发光精灵语音导览（程序化精灵 + DeepSeek 问答 + Qwen3-TTS 离线 wav + PositionalAudio）。
- 本地预览：`python -m http.server 8901 --bind 127.0.0.1 --directory <项目根>` → `http://127.0.0.1:8901/walktest.html`。

调试钩子（自动化验收用）：`window.__state / __world / __err / __player / __camera / __renderer / __scene / __exhibits / __openExhibit / __startExperience / __closeUI / __tick / __obj / __focusSnap`。

## 最近的改动（本会话，均已构建+浏览器回归）

1. 435882 画位换成 Canaletto《Piazza San Marco》（Met 435839 官方元数据），原 GLB 画布 quad 隐藏、保留原合并画框，框内红绒衬垫 + 按原画像素比（3971/2448）挂新画。
2. 画中世界体验重写：与画廊同一控制器/角色/第三人称相机；角色经 `proxy_piazza_floor` 物理落地；入场 2.4s 原画构图运镜后落到角色身后（可跳过）；边界用物理墙（x±8.4、z 44.6/64.4）；E/Escape 返回画廊并逐项还原。
3. 性能：世界内太阳阴影 `autoUpdate=false`（静态，仅进入时渲染一次）+ 世界内 dprCap 钳 1.0。实测世界行走 144FPS / p95 7.2ms。
4. Pip bug 两枚：A 键语音被 UI 期按键捕获拦截器吞掉（拦截器内先代点 Audio）；介绍卡打开时精灵被卡片遮挡（两个候选栖息点投影到屏幕选不被遮的一侧）。
5. 已修自伤 bug：世界后边界墙与出生点重叠导致胶囊卡死（现墙体外移、出生回撤）。
6. 落地页（前一会话）：封面/选厅/进入三屏 + 过场，进 `walktest.html`。

## 已验证（自动化 Chromium，窗口须保持前台，见下方"测量陷阱"）

画廊加载、12 展品卡、A 键语音开关、画中世界进入/运镜跳过/落地行走（前后左右）/边界墙阻挡/取消加载（迟到传送被丢弃）/画廊-世界往返逐项还原/落地页跳转。`window.__err` 全程为空。截图 `verify-shots/80–87`。

## 已知问题与风险（评审重点建议）

1. **单文件已经太大**：walktest-entry.mjs ~1700 行、bundle 949KB。世界、卡、视频、皇冠、Pip、音频、AI 全在一个 main() 里，靠闭包共享状态。建议评审是否拆模块（世界/世界入口/卡片/音频/Pip/加载器），以及 uiOpen 字符串状态机（null/painting/video/object/focus/world）是否应改为显式状态机。
2. **控制器交互面**：`three-player-controller` 的 KeyE 还映射 `toggleVehicle`，项目同时把 E 用作交互/关闭/退出世界——目前靠 uiOpen 分支区分，长按/连按行为未系统测试。G 键改 dprCap 与世界内 1.0 钳制的交互也未对齐。
3. **阴影静态化的代价**：世界内角色/Pip 不投实时阴影（静态阴影图在进入时烘焙）。若要动态影，需要把 autoUpdate 打开但限制阴影相机范围，或用假 blob 影。
4. **AgX vs ACES**：世界灯光配方来自 preview.html（AgX+曝光1.2），主站渲染器是 ACESFilmic+1.15（世界内临时 1.28）。未逐机调色，弱 GPU/广色域屏表现未验证。
5. **残余速度滑行**：退出世界传送回画廊时未清物理速度，角色会滑行 ~0.3m。小 polish。
6. **加载体验**：画廊 GLB 53MB 无 CDN/压缩协商（http.server 无 gzip/brotli）；walk-bundle 949KB minify 未 code-split。移动端未测（控制器有虚拟摇杆但 UI 未适配小屏）。
7. **音频**：TTS wav（assets/audio/Cherry/）+ PositionalAudio 在世界/画廊切换时监听器在相机上，正常；但 iOS 手势解锁音频、多音频并发策略未系统测试。DeepSeek key 明文在 js/ai-config.js（私有学习用途，公开部署前必须后端代理——代码里有注释）。
8. **测量陷阱（重要）**：自动化/后台窗口被遮挡时 Chromium 将 rAF 节流到 ~2fps，表现为"角色卡死"假象；渲染循环其实活着。人工或自动化验收必须保持窗口前台（Playwright 用 `page.bringToFront()`）。本会话曾因此误判控制器死亡。
9. **资产管理**：`tools/` 下多个一次性生成脚本（v4/v5/v6 各代），重跑会覆盖产物；`reference/before-v6/`、`reference/retired-wheat-world/` 是历史留档勿清。models/worlds/wheat 已退役（麦田点云效果不佳被撤），不要复活其旧接入代码。
10. **诚实性约束（一直沿用，请继续保持）**：不要把世界称为"复原原画/历史测绘"；不要整体归一化缩放 piazza GLB（天空半径 220m，米制，按 scene-spec.json 使用）；天空球名含 sky，不投影不碰撞；生成脚本重跑会覆盖手工精修。

## 文件地图（评审入口按此顺序）

1. `walkapp/walktest-entry.mjs` —— 全部交互逻辑（重点：状态机 uiOpen、frame() 主循环、enterPaintingWorld/exitWorld/closeUI、focus 相机覆写、Pip 块、输入拦截器）
2. `js/walktest-bundle.js` —— 构建产物（勿手改）
3. `walkapp/node_modules/three-player-controller/dist/index.js` —— 控制器（第三方，isupdate/vehicle/input 系统，KeyE=toggleVehicle 坑在此）
4. `index.html` + `assets/ui/cover.png` / `wings.png` —— 落地页
5. `assets/models/worlds/piazza-san-marco-v2/`（README/scene-spec.json/preview.html）—— 世界资产契约
6. `V6-REPAIRS.md` —— 逐轮变更与验证记录（含本轮）
7. `verify-shots/` —— 各阶段实拍截图（80–87 为本轮）
8. `js/ai-config.js` —— DeepSeek 配置（含密钥，勿外传）
9. `walkapp/INTEGRATION.md` —— 控制器集成时的坑（BVH worker、单位换算等）

## 验收清单（review 修改后必须复测）

- [ ] 画廊加载遮罩消失、无 console error（favicon 404 与 pointer-lock 提示除外）
- [ ] 每幅画 E 开卡/关卡、锁机位还原视角、视频画、皇冠 360°
- [ ] A 键语音播放/停止；Pip 在开卡时可见、Q 问答面板可用
- [ ] 《Piazza San Marco》：进入运镜（可跳过）→ 落地第三人称行走 → 边界墙阻挡 → E/Escape 返回画廊位置/灯光/FOV/像素比还原 → 加载中取消不迟到传送
- [ ] 落地页三屏流转
- [ ] 用 `window.__world()`/`__state()`/`__err` 断言，截图存 verify-shots/
