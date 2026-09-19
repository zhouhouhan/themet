# vgallery 遗留问题交接 · zcoder → Codex · 2026-09-16

只列**未解决的遗留问题与待决策项**。项目背景、文件地图、构建/回归方法见项目根目录的 `HANDOFF-GPT-DEEP-REVIEW-2026-09-15.md` 与 `V6-REPAIRS.md`（逐轮变更记录，最近几轮在文末）。此处不重复，只做索引。

根目录：`Z:\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery`
主入口：`walktest.html`（源码 `walkapp/walktest-entry.mjs` → esbuild 重建 `js/walktest-bundle.js`）
本地服务：`python -m http.server 8901 --bind 127.0.0.1`（项目根）。**注意：该服务器常随终端会话结束而停，且曾有僵尸进程双绑定 8901 导致连接挂起——验收前务必 `curl` 探活，必要时 `netstat -ano | findstr 8901` 清进程。**

## 当前功能基线（均已实测通过，勿回归）

- 13 件展品全互动：9 幅活画视频（含新接入的 Monet Family / Death of Socrates）、3 幅图文卡+语音、皇冠 360°、特洛伊影片（已改为**在原 3D 画框内播放**，镜头推近，弃用 DOM 全屏+CSS 边框）、圣马可世界（高空跟随相机 + 运镜中可行走）
- 13/13 语音导览（Qwen3-TTS 预生成 wav，Cherry 音色）
- Pip AI 问答（Q 呼出/点击精灵本体呼出）；聊天回复**已按用户要求移除 speechSynthesis 播报**
- 信息卡：自适应高度无滚动条、磨砂玻璃强化、文字白晕可读性补偿
- 落地页三屏（封面/地图/进入），地图红屋顶像素级热区 + 呼吸高亮
- 离线包：`vgallery-offline/` + zip（start.bat 自动 Node/Python，仅 Pip 需联网）
- 世界内性能：61fps / 59 draw calls / 17 万三角形（headless 实测）

## 遗留问题（按优先级）

### P1 · 世界内每帧 GL_INVALID_OPERATION（未解，性能嫌疑最大）

现象：进入圣马可世界后，每帧刷 `GL_INVALID_OPERATION: glDrawElements: Mismatch between texture format and sampler type`，直至驱动封顶停止上报（headless Chromium 实测 197+ 条）。画廊内无此问题。帧率在 SwiftShader 下仍 61fps、画面正确，但真实驱动上的代价未知——**若用户实测世界内仍卡顿，此为头号嫌疑**。

已排查排除：
- 14 块 PIAZZA_* 材质贴图槽位已核对：13 个 `map`(srgb) + 1 个 `emissiveMap`(Painted_sky_unlit)——配置确实不一致，且 GPT 曾强制 `customProgramCacheKey='piazza-soft-oil-v1'` 让它们共享程序（疑似成因），**但移除该强制后警告依旧**（visual-polish.mjs 已留注释）
- 所有可见网格纹理均已上传（version>0、有 image），无失败贴图
- 二分隐藏（天空/建筑/人物分组）未完成定位——二分时应以 console 警告增量为准而非帧数

建议方向：a) 真实 GPU 机器复测确认是否存在（headless SwiftShader 可能是假阳性）；b) 若存在，用 WEBGL_debug_renderer_info + 逐 mesh 隐藏二分定位到具体 draw call；c) 检查 `softenPiazza` 的 onBeforeCompile 注入与 `Painted_sky_unlit`（MeshStandardMaterial 仅 emissiveMap 无 map）的程序变体；d) 怀疑点还包括 10 个 figures InstancedMesh（castShadow=true + 静态阴影 autoUpdate=false 组合）。

### P2 · 特洛伊影片素材自带播放器 UI 残留

`assets/video/trojan-women.mp4` 画面内烧录了录制时的播放器元素：左上角字幕/快进 pill、右上角 "Hap..." 水印、底部键盘按键提示条。代码无法去除，**需用户重新导出干净版**（16:9，同规格），替换同名文件即可，代码无需改动。已向用户提出，等素材。

### P3 · 世界退出残余滑行

退出圣马可世界传送回画廊时未清零物理速度，角色会惯性滑行约 0.3m。`clearHeldKeys()` 只清输入不清 `player.playerVelocity`。修法：exitWorld 里 teleport 后再 `player.playerVelocity.set(0,0,0)`（clearHeldKeys 现有实现里已有此调用，确认时序即可）。小 polish。

### P4 · G 键画质循环与世界 dprCap 钳制冲突

世界内 dprCap 被钳到 1.0（性能），但 G 键会直接把 dprCap 循环到 1.25/1.5 并立即生效，覆盖世界钳制直到退出。行为可用但语义混乱。建议：G 在世界内只循环 0.75/1.0 两档，或退出时无条件恢复进入前值（当前 exitWorld 已恢复，但 G 按下后 worldSaved.dprCap 仍是进入时快照，语义 OK——只需确认产品上可接受）。

### P5 · 两条已生成未接线的语音

`assets/audio/Cherry/` 已生成 `vermeer.wav`（《持水罐的少女》，馆内无此画）与 `degas.wav`（《舞蹈课》，馆内的德加是《版画收藏家》，另有专属音频 degas-collector.wav）。待决策：后续加画时启用，或删除以免混淆。`assets/audio/script.json` 里对应文案行同步处理。

### P6 · 部署阻塞项（内部使用可忽略，公开前必须处理）

`js/ai-config.js` 明文 DeepSeek key 被页面加载。当前按用户指示随离线包内部（TED）使用；**若未来公开部署**：密钥移到后端代理（前端已兼容 `proxyUrl` 字段），且旧 key 应轮换。

### P7 · 未验收项（如实记录，非缺陷）

- 移动端/触屏未实测（控制器有虚拟摇杆，但卡片/地图小屏布局未适配验证）
- 真实弱网下 Pip 首响延迟、视频首帧策略未测
- 世界内 AgX→ACES 后的调色仅做了曝光补偿（1.3），未逐机校色；若用户觉得广场偏色，先调这里
- Pip 聊天面板仍是深色玻璃风，与信息卡新浅色磨砂风格不一致——用户未表态，保持现状

## 约束（沿用既有规则，违反会破坏资产）

- 不要重跑 `tools/` 下的 Blender 生成脚本（会覆盖手工精修产物）；不要动 `reference/`（回退留档）、`vgallery-offline/` 与 zip（发布物）
- 圣马可 GLB 米制 +Y，天空球（名含 sky）不投影不碰撞，**禁止整体归一化缩放**
- 435882 画位：红绒衬垫 + 左偏纹理裁切是刻意设计（保住左侧钟楼），改前与用户确认
- 中文沟通；直接完成已授权工作；改动后 esbuild 重建 bundle 并跑本地回归；未获指令不部署

## 快速验收清单

1. 8901/walktest.html 加载完成、`window.__err` 为空（favicon 404 与 pointer-lock 提示除外）
2. 每幅画 E 开关卡、视频画播（9 幅）、Audio (A) 播/停、Q 呼出 Pip、点击精灵呼出
3. 圣马可：运镜中按 W 即可行走、高空跟随、E 退出还原；特洛伊：画框内影片、E 退出
4. 皇冠 360：背景为实时展厅、拖拽旋转、光标可见
5. 自动化注意：浏览器窗口被遮挡会触发 rAF 节流造成"卡死"假象——先 `page.bringToFront()`；动画元素点击用 `dispatchEvent` 而非 `page.click`（Ken Burns 使包围盒常动）
