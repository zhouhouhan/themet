# V6 画廊修整与麦田接入

日期：2026-09-14。已修改本地 walktest.html 使用的源代码及 bundle，未部署。

## 画廊

- 使用 Blender 重建前后端墙，增加中央真实开口、石材门框、檐口和墙脚装饰，移除网页临时红色封墙及模型黑色封门。
- 两端增加约 16 米的纵深走廊，重复柱框、墙裙和暖光。绒绳标示不可进入边界，碰撞位于 z=±11.4。
- 原来的 10 幅画保留，入口增加大都会博物馆公开藏品 The Trojan Women Setting Fire to Their Fleet（435908）与 The Musicians（435844）。来源及公共领域标记见 assets/paintings/met-originals/entrance-v6.json。
- 修正入口画作的交互朝向；修复冻结矩阵后皇冠缩放未生效的问题。
- 可编辑母版：assets/models/blender/gallery-v6.blend。
- 网页模型：assets/models/gallery-v6.glb，53,045,024 字节。
- 实际网页截图：assets/models/blender/gallery-v6-corridor-web.jpg、gallery-v6-entrance-web.jpg。

## 麦田

原来的网页请求 wheat-world.glb，但该文件不存在。用户 PLY 含 1,251,629 个高斯点及颜色、尺度、旋转、不透明度，没有网格面，普通 PLY 网格导出无法直接保留其外观。

已在 Blender 转为约 490,027 个带颜色与透明遮罩的定向面片，导出可加载 GLB，保留原始 PLY。随后删除无需使用的法线并压缩顶点颜色，GLB 从 86.9 MB 降为 45,705,160 字节。

这是高斯点云的近似网格转换，近距离可见点状笔触，不是无损高斯渲染。源数据外观若需更高保真，下一步应接入原生 Gaussian Splat 渲染器。现阶段碰撞采用平面支撑及外围边界，不等于重建了地形碰撞。

- assets/models/worlds/wheat-world.blend：转换母版。
- assets/models/worlds/wheat-world.glb：实际网页资源。
- assets/models/worlds/wheat-world.json：转换参数。
- assets/models/worlds/wheat-world-web.jpg：网页实拍。

## 交互与验证

世界加载使用可复用 Promise 和取消标记；资源就绪才传送，取消后不会迟到传送，失败时保留画廊并允许重试。进入与返回保存并恢复位置、相机、背景、雾和灯光。移除了掩盖模型失败的图片圆筒替代物。

已通过 JavaScript 语法检查及 esbuild 构建。实际浏览器中验证了压缩模型加载、进入麦田（位置 300,0.15,0）、返回画廊原位置、取消进入、新增两幅画的介绍交互。确认两端绒绳碰撞均注册在控制器 collisionWorld 中；尚未完成逐方向人工行走碰撞测试。查看了走廊、入口及麦田实际画面。未逐项重测音频的用户手势播放、视频及所有设备性能。

## 文件与复现

- walkapp/walktest-entry.mjs 为功能源代码；js/walktest-bundle.js 已重新构建。不要直接以静态预览页替换 walktest.html。
- tools/complete-gallery-v6.py 构建 Blender 画廊。
- tools/optimize-gallery-v6.py 导出优化模型，随后可运行 tools/compact-glb-images.py 压缩图片。
- tools/splat/build-wheat-glb.py 用 Blender Python 运行；tools/splat/compact-wheat-glb.py 压缩导出的麦田 GLB。
- tools/integrate-v6.py 是针对旧源文件的一次性迁移脚本，不要对当前文件重复运行。
- reference/before-v6/ 保存修改前源代码、bundle，以及本轮回归结果。
- index.html 是旧独立预览；本轮验收入口是 walktest.html。
## 2026-09-14 zcoder 清单复核修正

确认并修复主场景首帧渲染后缺少 loading.done 的问题。原验收只检查 WebGL 画面，没有检查 DOM 遮罩，遗漏已纠正。

麦田改为固定第一人称观景点：停止角色移动更新，隐藏近身角色，允许鼠标拖动环视，禁用平移及缩放；退出恢复相机控制参数和角色可见性。没有新增地形碰撞，不能描述为自由行走。保留环境贴图并提高世界照明，避免未来显示角色时原有的环境光缺失。

showWorld 已有环境快照时直接返回，避免重复覆盖。隐藏 hint 时同时清空内容。入口两幅画补充基于现有博物馆元数据的简短信息；未制作语音，因此不显示不可用的 Audio 按钮。

源码及 bundle 已更新；未部署。回退源码位于 reference/before-v6/walktest-before-review.mjs。此前 WHEAT-WORLD-EXPORT.md 中自动归一化和自由行走的说明不适用于当前实现，不能照其旧规则再次缩放模型。

独立 Chromium 回归通过：loading 指针拦截为 none；两次进入/返回环境一致；每次连续 180 帧移动输入后位置仍为 [300,0.15,0]；新画 Audio 按钮数量 0；退出 hint 为空；页面错误为空。截图步骤超时，未生成本轮截图；以上为浏览器运行时断言结果，尚待人工视觉复验。

## 2026-09-15 麦田初始构图
对照画作和多方向网页渲染，初始视点设为世界局部 (0,3.815,0)，朝向 (4,5,20)，up=(-0.4,0.916515,0)，垂直 FOV=85。修正原先反向、过低及倾斜的视角，使右侧丝柏、下方麦田与天空同时进入画面。采用独立 OrbitControls，退出销毁并恢复画廊 FOV、up 和控制状态。浏览器验证实际机位正确，退出 FOV=60、up=(0,1,0)，无页面错误。实拍 assets/models/worlds/wheat-initial-view.jpg。GLB 本身的面片破碎仍存在，机位调整不能无损还原原画。源码与 bundle 已更新，未部署。

## 2026-09-15 Piazza San Marco v2 接入 + Pip 两项修复（zcode 接手）

435882 画位（原塞尚《Still Life with Apples...》）换挂 Canaletto《Piazza San Marco》（Met 435839，元数据经官方 API 核验）。原 GLB 画布 quad 下线，原画框为合并网格无法拆除、予以保留：框内口铺深红绒衬垫，衬垫前按原画像素比（3971/2448）挂新画。画作元数据、Audio 列表（移除 cezanne）、展品记录尺寸同步更新。

《Piazza San Marco》卡片新增"ENTER THE PAINTING"（kind: world），加载 assets/models/worlds/piazza-san-marco-v2/piazza-san-marco.glb。实现要点：可取消加载令牌（E 中途退出后迟到加载被丢弃，已实测）；进入按 scene-spec.json（脚底 0,0,64；观景机位高 8.4m；31mm/36mm 镜头换算 FOV 随宽高比自适应）；WASD 小范围漫游 3 m/s（Shift 6 m/s）钳制在 x∈[-8,8]、z∈[45,64]；拖动环视；天空球不投影不碰撞；世界自带半球光+投影太阳（阴影总开关常开、画廊零开销）；退出逐项还原背景/灯光/曝光/FOV/相机顺序/角色可见性。世界 GLB 首次进入按需加载后常驻内存，二次进入瞬时。

修复 Pip 两 bug：①A 键语音失效——UI 期捕获阶段拦截器把 KeyA 一并吞掉，冒泡阶段的热键处理器永远收不到；改为拦截器内先点击 Audio 按钮再吞事件。②介绍卡打开时 Pip 躲进卡片后——原按"离馆中心远近"选画框侧边会落入屏幕左侧卡片区域；改为把两个候补点投影到屏幕选不被卡片遮住的一侧，都被遮则升至画框上端。世界模式下 Pip 按相机实际朝向（含俯仰）陪飞在视线前侧。

esbuild 已重建 bundle（948.8kb）。Chromium 实测全部通过：进入/取消/重复进出一致、漫游与四向边界、拖动环视、退出还原、A 键语音开关、卡片打开时 Pip 可见、世界内 Pip 可见，window.__err 全程为空。截图 verify-shots/80–85。中断期间的"本地加载极慢"为上会话遗留 CDP 网络限速挂在旧浏览器页面上所致，与项目无关，换新页面后恢复 13s 正常加载。未部署。

## 2026-09-15 下午 · 画中世界改为真实第三人称行走 + 性能修复（zcode）

用户实测反馈：世界太卡几乎无法移动；看不到角色落地；希望与画廊一致的同款西装角色、同款第三人称视角。

### 改动（walkapp/walktest-entry.mjs，bundle 已重建）

- 世界体验重写：进入后复用同一个玩家控制器与第三人称跟随相机（不再隐藏角色、不再漂浮机位）。角色在广场地面代理（proxy_piazza_floor，顶面 Y=0）上物理落地行走，WASD/Shift/跳/拖动环视/V 第一人称全部与画廊一致。
- 入场运镜 ~2.4s：原画高位构图（0,8.4,64 → look 0,24,-31，31mm 镜头 FOV）缓落到角色身后标准第三人称，E 或任意移动键跳过；运镜结束后释放 uiOpen 进入自由漫游，屏幕底部常驻 "E — step back into the gallery" 提示；E/Escape 返回画廊并逐项还原（位置/灯光/背景/曝光/FOV/像素比）。
- 性能（卡顿根因）：①太阳阴影 autoUpdate=false，进入时 needsUpdate 渲染一次静态阴影，不再每帧跑全场景深度 pass；②世界内 dprCap 钳到 1.0，返回画廊还原。实测（自动化环境）世界内行走 144 FPS、p95 帧时间 7.2ms。
- 修复自伤 bug：后边界墙初始位置 z=64.2(占 64.0–64.4) 与出生点 z=64 重叠，胶囊卡进静态碰撞体无法移动；墙体外移至 64.4/44.6/±8.4，出生点回撤 z=63.4。
- 修复退出路径：运镜结束 uiOpen 释放为 null 后 E 走了画廊分支导致无法退出；重构 exitWorld()，closeUI 对"画中世界自由漫游"（uiOpen 为 null 但 worldRoot 可见）同样生效；交接时清 current。
- 遗留小瑕疵：退出瞬间角色带少量残余速度滑行 ~0.3m（传送未清物理速度），可接受待 polish。

### 验证与测量注意事项

- Chromium 全流程回归通过：进入/运镜跳过与自动结束/落地行走/边界墙物理阻挡/画廊-世界往返还原/A 键语音/卡片时 Pip 可见，window.__err 全程为空。截图 verify-shots/83、85–87。
- 测量陷阱记录：自动化浏览器窗口被遮挡时 Chromium 把 rAF 节流到 ~2fps，表现为"角色卡死不动"的假象（渲染持续、控制器活着）；用 page.bringToFront() 后恢复 146FPS。人工复测时务必保持窗口可见。

## 2026-09-15 晚 · 落地页前两屏整体换新（zcode）

用户提供两张新 UI 设计图（THE MET 封面 + Museum Map），要求替换落地页前两屏；重点：点击范围精确不误点（此前蒙版有偏差）、油画馆呼吸高亮引导点击、交互美观优雅。

- 新底图：assets/ui/cover-v2.png（1372×1005）、map-v2.png（1345×970）——由用户设计图裁去平板黑边所得；旧 cover.png/wings.png 保留可回退。
- 热区不再手估百分比：用 PIL 对底图做像素级检测。红翼（European Paintings）按 HSV 色相分类取最大连通域再求凸包，得到 10 点多边形（SVG viewBox=底图像素坐标，热区与画面逐像素对齐）；封面 Enter 圆环（圆心 685,749 r≈88）、返回键圆、View Collection List 按钮均按实测坐标布置。
- 交互：封面 Enter 金环呼吸辉光 + 底图整体缓动 Ken Burns（热区随动不脱位）；地图红翼金色描边+光晕呼吸高亮（低/高相位截图 93/94 对比），悬停增强；红翼与"European Paintings"标签均可进入画廊；返回键回封面；View Collection List 弹优雅 toast（功能未开放）；保留 GPT 轮的 inert/aria-label/键盘激活/reduced-motion/移动端适配。
- Chromium 回归：封面→地图→误点蓝色屋顶无反应→Collection List toast→返回→红翼进入 walktest 全流程通过；console 仅 favicon 404。截图 verify-shots/90–94。
- 已知：Ken Burns 使按钮包围盒持续微动，Playwright 默认点击会等"元素稳定"而超时——自动化请用 dispatchEvent 触发 click，真人操作不受影响。

## 2026-09-15 深夜 · 《The Musicians》语音补全 + 视频核实（zcode）

用户反馈入口画《The Musicians》（Caravaggio, Met 435844）没有视频、没有语音按钮。核实结果：

- 视频：接线一直存在（musicians-loop.mp4，画框内"活画"），GPT 轮改为播放成功才显示画中画。实测 currentTime 正常前进、平面可见。该循环视频是细微动态的"活画"，静态观看不易察觉；且视频仅在信息卡打开时播放（关闭即停，与《收获者》等所有画一致）。若浏览器阻止自动播放会显示静态原画并弹 toast。
- 语音：此前入口两幅画都没制作语音（V6-REPAIRS 前文有记录），按钮按约定不显示。本轮用 gen-voice.mjs（Qwen3-TTS, Cherry）生成 met-435844.wav 并接入 AUDIO_IDS，Audio Guide (A) 按钮出现且可播放/停止，实测通过。顺带把 script.json 里 GPT 轮已写文案但未生成的 piazza/trojan/vermeer/degas 四条语音一并生成（尚未接线，待后续决定挂到哪幅画/哪个入口）。
- bundle 已重建。注意：本机 8901 静态服务器会随终端会话结束而停，验收前需重启（python -m http.server 8901 --bind 127.0.0.1）。

## 2026-09-15 深夜 · 全馆 13 件展品互动审计（zcode）

逐件传送+开卡实测（自动化断言按钮/画中视频播放状态）。结果：

- 视频活画 7 幅全播：Harvesters / Wheat / Toledo(占位片) / Aristotle / Pareja / Collector of Prints / Musicians
- 纯图文卡 3 幅（本就无视频）：Socrates / Sunflowers / Monet Family
- 特殊互动 3 件全通：Trojan Women(全屏影片) / Piazza San Marco(走进画中世界) / Crown(360°+语音)
- 语音接线补全：met-435908(Trojan)、piazza(435882，注意该展品 id 是自定义的 "piazza" 不是 met-前缀) 加入 AUDIO_IDS；至此 13 件展品全部有 Audio Guide。
- 备用音频：script.json 的 vermeer(《持水罐的少女》)/degas(《舞蹈课》)两条已生成但馆内无对应画作，未接线。
- 全程 window.__err 为空；console 仅 favicon 404 与 pointer-lock 提示。

## 2026-09-15 深夜 · 离线包打包（zcode）

用户决定不做 exe，改为打包"线下可用的离线包"给 TED 内部使用：全部静态资源本地化，仅保留 Pip AI 助手的 DeepSeek 联网接口（用户确认内部使用、接受密钥在包内）。

- 产出：vgallery-offline/ 目录 + vgallery-offline.zip（约 158MB 解压前/后）。
- 内容：index.html + walktest.html + js/（ai-config + bundle）+ assets 运行时子集（3 个 GLB + piazza GLB + 8 视频 + 18 wav + 落地页两图 + 入口 json + 原画 jpg），42 文件。
- 启动器：start.bat（自动探测 Node → Python，起本地服务并开浏览器）；server.js（零依赖 Node，支持 Range 视频拖动）；serve.py（Python 标准库，同样支持 Range）；默认端口 8080。
- 离线审计：bundle 内唯一外链是 DeepSeek 接口；Draco 解码器 unpkg 路径实测从未触发（GLB 为 meshopt/内嵌贴图）。8090 端口实测封面→地图→画廊全流程，loading 完成、13 展品、Pip 配置在位、__err 为空，网络请求全部本地。
- index.html/walktest.html 加 data: favicon 消除 404。README.txt 含玩法/联网说明/FAQ。

## 2026-09-16 · Toledo 正式活画上线（zcode）

用户提供《View of Toledo》活画视频（864×480，乌云流动+缓慢推近），替换原 placeholder-loop 占位片。assets/video/toledo-loop.mp4（6MB），展品 experience 改直连并移除 placeholder 标记；VIDEO_PLACEHOLDER 常量退役。画框竖幅（比例 0.9）用 cover 裁切后正好保留教堂/阿尔卡萨中心景观，构图完整。placeholder-loop.mp4 退役保留在主工程（离线包已剔除）。bundle 已重建，离线包目录与 zip 已同步。截图 verify-shots/98。

## 2026-09-16 · 圣马可画框贴合 + 特洛伊真实画框影院 + Pip 播报/滚动修复（zcode）

1. 圣马可画框：画幅改为铺满整个框内口（3.17×2.52m，压住框唇 1cm），消除上下衬边；比例差（原画 1.62 vs 框口 1.26）用纹理左偏裁切消化，钟楼/主教座堂保留，右侧连排拱廊裁除；展品记录同步（锁定机位随画幅变高自动后退）。
2. 特洛伊影院重构：弃用 DOM 全屏播放器 + CSS 鎏金边框（用户反馈粗糙），改为影片直接在原画布上播放——真实 3D 画框唇口入镜，镜头推近至画幅占视口高约 95%；uiOpen 保持 "focus"（E/ESC/✕ 均经 closeUI 退出并还原），影片非静音（点击进入视为手势，无音轨自动兜底静音）。提示条 "ESC / E — RETURN TO THE GALLERY"。
3. Pip 修复：移除聊天回复的 speechSynthesis 播报（中英夹杂数字播报僵硬，与 Cherry 开场音质感不一致，用户确认宁缺毋滥）；聊天窗口滚动修复——pipAsk 收到长答案后调用 scrollPipChat() 恒滚至最新（此前"…"气泡被长文本填充后不滚动）。信息卡按钮区新增 "✦ ASK PIP — PRESS Q / CLICK THE SPRITE" 常驻提示。
- 已知：特洛伊影片素材自带播放器 UI 残留（左上字幕 pill、右下水印、底部按键提示），为源视频烧录内容，需用户重新导出干净版替换 assets/video/trojan-women.mp4。
- bundle 已重建，离线包目录与 zip 已同步。截图 verify-shots/99–101。

## 2026-09-16 · 世界移动修复 + 整体流畅度优化（zcode）

用户反馈：①世界进入后无法移动；②整体卡顿。

**无法移动根因**：世界自由模式的相机是"远观固定机位"（相机钉在高空、视线锁定远处教堂、位移跟随仅 20-25%）——玩家走动时画面几乎不变，感知上就是"不能移动"；且运镜 2.4s 内移动键被 UI 拦截器吞掉。修复：
- 自由模式改为高空跟随相机（角色身后 7m/高 4.5m，FOV 46），拖动环视照常，移动位移清晰可感；
- 捕获拦截器对 uiOpen==="world" 放行移动键——运镜中即可边走边看（运镜相机带视差缓动收敛到跟随机位）；
- 移除"移动键跳过运镜"逻辑（E 仍可跳过）。

**卡顿优化**：
- 移除进出世界的 AgX 色调映射切换——切换 tone mapping 会触发全场景材质重编译（每次进出两次全量重编译，进出卡顿元凶），世界观感用曝光 1.3 补偿；
- 启动时 renderer.compile 预编译画廊+皇冠 360 全部材质（藏在加载遮罩后），消除开馆后走动/首次互动的编译 hitch；
- 进世界时状态遮罩期间预编译世界材质；
- dprCap 1.5→1.25，自适应分辨率 0.9s 一评、<50fps 即降档。

**遗留观察**：headless SwiftShader 下世界内每帧刷 GL_INVALID_OPERATION（sampler 不匹配，驱动封顶后停止上报）。已排除：贴图未上传、customProgramCacheKey 强制共享（已移除仍报）。61fps 稳定、画面正确，疑似软渲染环境特性；真实 GPU 请复测，若仍有则交 GPT 深查（已具备复现路径：进世界即触发）。

实测：世界行走 61fps/61 draw calls/17 万三角形；画廊 61fps/58 calls；运镜中可行走、退出还原全通过。bundle 重建，离线包目录与 zip 已同步。截图 102–107。

## 2026-09-16 · Monet Family / Death of Socrates 活画接入（zcode）

用户提供两段新活画视频：manet-loop.mp4（1280×720，《莫奈一家》，花园光影微动）、socrates-loop.mp4（960×720，《苏格拉底之死》，人物微动）。接入方式与《收割者》一致（画框内自动播放）。Sunflowers 维持静态（用户明确要求）。

- ensureVideoPlane 新增 cropV 选项：experience 里配 cropV:<0-1> 即可在 cover 裁切后做额定的垂直居中裁切——用于遮掉 socrates 源视频自带的上下黑边（实测有效）。
- 语音按钮不变（socrates.wav / manet.wav 原已存在并接线）。bundle 重建，离线包目录与 zip 同步。截图 verify-shots/108–109。
- 至此活画总数 9 幅：Harvesters / Wheat / Toledo / Aristotle / Pareja / Collector / Musicians / Manet / Socrates。

## 2026-09-16 · 信息面板玻璃化改造（zcode）

用户反馈：信息卡因内容加长出现丑滚动条；磨砂感不足显得平面。

- 卡片高度改自适应（top:22 + max-height:calc(100vh-44px)，去掉 bottom 拉伸），常规内容不再溢出；滚动条隐藏（scrollbar-width:none + webkit width:0），超长内容仍可滚轮滚动。
- 磨砂玻璃强化：背景渐变透明度 0.88/0.80 → 0.66/0.58/0.68（让 backdrop-filter 真正显效），blur 22→30、saturate 175%、brightness 1.06；新增 ::before 斜向高光层（screen 混合）；玻璃边缘双内阴影 + 亮边框。
- 可读性补偿：标题/描述/元数据/统计/foot 全部加白色 text-shadow 光晕并加深一档颜色；::before 高光减弱避免冲淡文字。
- 间距整体收紧（h1 30px、desc 14.5px/1.7、btns/stats/foot 边距减小）：最长卡片实测 483px 且 scrollable=false（无滚动条）。
- bundle 重建，离线包目录与 zip 已同步。截图 verify-shots/110–111。

## 2026-09-16 · 广场抬头构图与入场连续性修正（Codex）
- 用户反馈进入后只能看地面、人物不可见。原逻辑入场末段把 lookAt 从教堂转向玩家头部，随后从约 8.8m 高度跳到 4.5m 跟随机位，导致俯视与跳变。
- 入场和自由移动统一朝向远处教堂 (x随玩家少量平移,24,-31)；最终机位高 5.2m，位于玩家后方 12m，FOV 50 并适配窄屏。保持整座高塔、天空与广场人物可见。WASD 仍移动，镜头跟随广场位置；此版本为构图优先，不宣称自由拖动环视，提示文案已同步。
- 入场 2.4 秒使用 smoothstep 平滑下降并渐变镜头视角，前 0.6 秒暖灰淡入遮罩掩盖切场；结束后直接沿用同一机位，没有第二次突变。退出会清遮罩。
- 通过 tools/review-piazza-camera-0916.cjs 检查边界：第143帧位置 [0,5.200691,75.400374]，第146帧 [0,5.2,75.4]；前向 Y=+0.174，确认抬头；最终 gl.getError=0。实际截图 verify-shots/piazza-camera-2026-09-16.jpg 已人工检查，塔顶完整且人物可见。
- 已重建 bundle，未改离线包/zip/基础GLB，未部署。此项验证不代表前次多轮进出停滞已解决。

## 2026-09-16 · Codex 轮验收 + 角色出画修复（zcode）

对 Codex「广场抬头构图 + GL 修复」轮做全面验收，结论：

**验证通过项**：
- GL 修复（compile 后蒙皮材质 needsUpdate）：三轮进出世界 + 行走 + 退出逐帧 getError 全程 **0 错误**（此前每帧刷 GL_INVALID_OPERATION）。
- P3 退出残余滑行：exitWorld 在传送后调 clearHeldKeys（含速度清零），实测退出瞬间速度 [0,0,0]。已在 01:41 前的版本修复，本轮确认。
- P4 G 键与世界 DPR 钳制：世界内循环实测 [0.75, 1, 0.75, 1]，不再越界。
- **多轮进出循环（Codex 未完成项）补完**：3 轮全过（重进耗时 76.6s / 118.1s，headless SwiftShader）。Codex 报的"三轮停滞"确认为软渲染下每次进场全量编译耗时（首次约 5 分钟），非应用挂死；真实 GPU 无此量级。

**发现并修复**：Codex 构图相机（视线锁定 (x*0.25, 24, -31)）把玩家角色整个留在画面外——出生点实测角色头部 NDC y=-1.07（下缘之外），违背用户"第三人称看到西装角色行走"的明确要求。修复：自由模式与运镜终态视线目标改为 **(feet.x, 10, -31)**（y 24→10，x 改为全跟随），角色躯干回到画面下三分之一（NDC -0.72），钟塔顶（约 55m）仍在画内（NDC ≈+0.9），仰角从 +10° 收到 +2.6°，不再俯视地面；运镜中视线随 smoothstep 同步收敛，无末帧跳变。世界内常驻提示条移到右下角——相机跟随使角色固定在底部居中，原位置提示条常年压在角色身上。顺带清理运镜里的死变量 k。G 键 toast 核实无谎报问题（clamp 在取标签之前）。

- 重建 bundle；**离线包目录与 zip 已同步**（Codex 02:01 相机改动未同步离线包，本轮一并补上，zip 48 文件校验通过）。
- 验证产物：tools/review-codex-round-0916.cjs（三轮循环+构图+G 键）、tools/review-camera-fix-0916.cjs（新相机投影+截图）；verify-shots/codex-review-2026-09-16.json、camera-fix-2026-09-16.json 及截图。未部署。

## 2026-09-16 · 线上部署（zcode）

用户指示部署。目标 `https://molin.wiki/hanson/vgallery/`（ubuntu@<SERVER-IP>，`/opt/molin-wiki/frontend/dist/hanson/vgallery/`），按 hanson 交接规矩 **SSH stdin (`cat | ssh "cat >"`) + 逐文件 md5 核对，不用 scp**。部署集 = 离线包目录的 44 个站点文件（剔除 server.js/serve.py/start.bat/README.txt）。

- 与服务器 md5 比对：19 个文件服务器已有且一致（跳过），**实际上传 25 个（21 新 + 4 变更，约 110MB）**：v6 画廊 GLB(51.8MB)、圣马可世界 GLB、特洛伊影片(26.6MB)、8 个活画视频、5 条新语音、落地页两图、entrance-v6.json、manifest、index/walktest.html、bundle、ai-config.js。25/25 全部 OK（tools/deploy-0916.sh，日志含逐文件 md5）。
- 线上验证：6 个关键 URL 全 200 且字节数与本地一致；真实浏览器访问线上 walktest.html **60.5s 完成加载**（53MB GLB 公网拉起），`__err` 为空、展品就绪、截图 verify-shots/live-deploy-20260916.jpg（展厅/角色/Pip 正常）。资源请求全部走 molin.wiki，无外链。
- 离线包 zip 加时间版本：**`vgallery-offline-2026-0916-0255.zip`**（项目根目录，104MB，48 文件）。此后每次重打按日期时间命名。
- 注意：`js/ai-config.js`（含 DeepSeek key）已随站点公开——此前 P6 已知事项，公开部署后建议择期把 key 移到后端代理并轮换旧 key。服务器上 v1/v2/v3/v5 旧 GLB、wheat.ksplat、voices.html、walk.html 等历史文件未动。

## 2026-09-19 · 鼠标拖拽视角合并（对齐 vgallery-merge-20260915）+ 皇冠阻尼 + 灵敏度键（zcode）

背景：用户在另一台电脑反馈鼠标转向飞快、皇冠 360° 绕晕不稳。排查根因：pointer-lock 的 movementX 随鼠标硬件 DPI 与系统指针速度/加速放大（浏览器读不到硬件 DPI），跨机器必然手感不一；皇冠按像素系数直接加旋转、无阻尼，高 DPI 下更甚。期间用户同步来另一台电脑的补丁包 vgallery-merge-20260915（workbuddy 在 bundle 上打的 drag-look 重写，12 处改动），要求对齐合并。

**合并方案：把另一台的"按住左键拖动才转视角（GTA 式）"在主源码层重做**（运行时覆写 three-player-controller 的 setPointerLock / onMouseMove 等，不改 node_modules），并与其运行时约定完全兼容（__vgLookScale / __vgAutoSpin / __vgAllowOrbitDrag / __vgForceMobileUI / __vg 句柄）。同时叠加本机改进：
- 皇冠 360°：阻尼追随目标值（帧内 lerp）+ 单事件钳制，猛拖不绕晕；自动旋转默认关（__vgAutoSpin 可恢复）
- `-` / `=` 键实时调鼠标灵敏度 0.25~2.0，localStorage 按机器记忆（vg-look-sens），同时作用于视角拖拽与皇冠
- 视角拖拽增量钳制 ±140px，松开/左键丢失/失焦自动复位
- focus/看画/世界模式 enableToward 门控；世界内拖拽直接禁用（相机是编排运镜）
- headless 下 init 期残留的 pointer lock 用延迟重试退出清掉（真实浏览器无手势本就直接拒绝）

采纳对方包其余内容：start.bat 重写版（Node/Python 探测链、CRLF/纯 ASCII）、dragtest.html 自检页（第 3 项加了相机收敛等待，慢机器不误报）、.workbuddy 工具目录；HUD 文案改 "HOLD LEFT MOUSE + DRAG to look · -/= mouse speed"。patch-look.py 使命结束（改动已进源码，不再怕换 bundle 失效）。

**验证**：dragtest.html 自检页 **10 pass / 0 fail**（真实浏览器合成事件）；直连行为测试 300px 拖拽转角与理论精确一致（-0.14rad）、5000px 尖峰钳到 -0.14、松手即停、不拖不动；皇冠猛拖阻尼收敛 0.277（目标 0.288 的 96%）；focus/看画开卡 enableToward=false、关卡恢复 true。全程 window.__err 为空。

**产物**：bundle 重建；离线目录同步（新增 dragtest.html + .workbuddy，56 文件）；全量包改名 **vgallery-offline-2026-0919-1127.zip**（100MB，替换之前误用本机偏差时钟命名的 0916 包）；增量补丁包 **vgallery-patch-draglook-20260919.zip**（约 1MB：bundle + walktest/index/dragtest.html + 更新说明，覆盖到旧包目录即可）。线上 molin.wiki 已同步部署 index/walktest/dragtest.html + bundle（SSH stdin + md5 全 OK）。封面开始画面加 "PRESENTED TO HANSON ZHOU" 署名。未部署项：无（本次即部署）。

## 2026-09-20 · 千里江山图特展厅白模 v1（GPT/Codex）

任务来自 `SCROLL-GALLERY-SPEC.md`（第一部分规矩 + 第二部分规格）。本轮**只交付白模**：blend + glb + 4 张验证渲染图；贴图注入与引擎集成留给 zcode。未动 `gallery-v6` 任何文件、未动 `walktest-entry.mjs`/bundle、未碰 `vgallery-offline/`、未部署。

**交付物**
- 可编辑母版：`assets/models/blender/scroll-gallery-v1.blend`（143,094 字节，Blender 5.2.2 LTS）
- 运行资源：`assets/models/scroll-gallery-v1.glb`（85,376 字节，**GLB 内 images=0 / textures=0**）
- 验证渲染：`verify-shots/scroll-v1-entrance.jpg`、`-oblique.jpg`、`-elevation.jpg`、`-top.jpg`
- 覆盖前备份：`assets/models/blender/scroll-gallery-v1-before-acceptance-fix.blend`、`assets/models/scroll-v1-before-acceptance-fix.glb`
- 工具：`tools/build-scroll-gallery-v1.py`（程序化建模）、`tools/render-scroll-gallery-v1.py`（四视图渲染，只加临时灯/相机且不保存）、`tools/verify-scroll-gallery-v1.py`（独立复测）

**规格参数（实测值）**：以下数字由 `tools/verify-scroll-gallery-v1.py` 重新打开 blend、直接从 mesh 世界坐标量取，不采用建模脚本的自报值。

- 房内长 16.0 / 净宽 4.2 / 净高 4.0 / 门洞高 2.4；门洞宽 1.6 居中；墙厚 0.3；石质门套套宽 0.25（进深 0.05）
- 天花主梁 9 根 X=2.8…15.6（每 1.6m，截面 0.16×0.20，梁底 Z=3.8）+ 纵向边梁 2 根 Y=±1.9。**规格文字里的“…15.2”与“每 1.6m 共 9 根”不自洽**：按 2.8+8×1.6 应为 15.6，本轮取 15.6；若要收在 15.2 需改成每 1.55m，等 zcode 定
- 长卷：绢色衬底 12.0×0.755 @Y=2.080；金线 12.0×0.012 两条 @Z 1.0725–1.0845 / 1.8155–1.8275；**画心 10 段各 1.192×0.515**，起点 X=3.0 依次排布，Y=2.075（衬底前 5mm），总长 11.92，段间无缝
- 卷首滚筒 Ø0.09×0.86 @X=2.95，两端轴头 Ø0.11×0.03，绢带 0.06×0.35
- 题跋 2 段 1.2×0.515 沿尽端墙排（Y +1.5→+0.3、+0.3→-0.9），说明墙牌 1.4×0.9
- 影墙 X 2.0–2.4、Y -0.75–1.85、高 2.6；标题铭牌 1.2×0.8 挂在入口面（见下）
- 玻璃矮栏 X 2.9–15.1 @Y=0.90（玻璃高 1.05、厚 0.012，深铜基座）；长凳 1.8×0.45×0.45 @(8.8,-1.5)；对面墙放大图 2 幅 @X 6.5/10.5；段落铭牌 4 块 @X 6.6/9.0/11.4/13.8
- 灯位 Empty 14 个：`LT_SCROLL_01…10`（X=3.6…14.4 步进 1.2，Y=+1.45，Z=3.75）、`LT_TITLE`、`LT_COLOPHON`、`LT_DETAIL_01/02`；**场景内没有任何真实灯光**
- 集合名 SHELL / SCROLL / PROPS / LIGHT_MARKERS；材质 29 个（`scroll_slice_01…10` 各自独立，10 段未合并未镜像）
- 整房 856 三角面（预算 <80k）；GLB 85,376 字节（预算 ≤8MB）

**验收清单（§1.5，逐条自检，全部通过）**
- [x] 4 张渲染图齐全（入口 / 长卷墙 45° 侧视 / 立面正视 / 俯视），文件名 `scroll-v1-*.jpg`
- [x] 尺寸实量：16.0 / 4.2 / 4.0 / 2.4 / 画心总长 11.92（10×1.192）
- [x] 10 段画心独立 mesh + 独立材质、单面片、UV 每段 0–1、无镜像、法线朝房间
- [x] 灯位 Empty 14 个全部就位且多余 Empty 为 0
- [x] 856 三角面 < 80k；GLB 85,376 字节 ≤ 8MB；GLB 内无贴图
- [x] Blender 5.2.2 LTS、文件名、集合命名符合规格

**本轮修掉的三个缺陷（第一版已导出，属真实缺陷）**
1. **平面法线大面积反了（严重）**：长卷墙一侧 14 个平面（绢底、金线×2、画心×10、绢带）法线指向墙里；尽端墙与对面墙一侧 6 个平面（题跋×2、说明牌、标题铭牌、放大图×2）法线背离房间。Blender 默认不剔除背面，渲染时看不出来；但导出 glTF 后若引擎按 FrontSide 渲染（zcode 注入贴图时新建的材质默认就是 FrontSide），**整幅画会在观众眼前消失**。已统一重绕为“面朝房间”，并在 `tools/verify-scroll-gallery-v1.py` 里加了 facing 审计（法线与“面心→观察点”方向点积必须 >0）防回归。
2. **标题铭牌与影墙共面（Z-fighting）**：铭牌原本贴在 X=2.0 与影墙盒体同面片，已前移 6mm 到 X=1.994。
3. 下金线 6mm 不对称：原为 Z 1.0785–1.0905，按衬底下缘 1.0725 对齐改为 1.0725–1.0845。

另：长凳按规格“圆角”补了倒角（宽 0.045、3 段，非 subdivision），三角面 680→856。

**渲染说明（zcode 复现用）**：`tools/render-scroll-gallery-v1.py` 打开交付 blend 后，按 14 个 `LT_*` 灯位**临时**生成 spot（600W、#ffd9a0、spot 0.5 / penumbra 0.6），另加一盏室内补光和一盏门厅光，曝光 +0.62，渲完直接退出**不保存**——所以交付的 blend/glb 里依然只有 Empty。可用 `-- --out=DIR --only=name1,name2` 覆盖输出目录与机位。立面图用正交相机正视长卷墙，并临时隐藏对面的墙/影墙/长凳/搁栅/放大图；实测该图亮带落在 X 3.00→14.99，与规格挂画带 3.0→15.0 一致，同时玻璃矮栏（Z 0.04–1.09）与绢底（Z 1.07–1.83）都可见。

**没做的事 / 交给 zcode**
- 未注入任何真画贴图（规格分工：故宫高清切片由 zcode 切 10 片注入）；GLB 内无贴图
- 未做引擎集成：传送出生点、碰撞代理、聚光灯、Pip 讲解点、古琴音区、地图热区
- GLB 材质目前全部导出为 doubleSided（Blender 默认不剔除背面）。法线已修正，zcode 若要为省性能切换成 FrontSide 是安全的。
## 2026-09-20 · 特展白模验收（zcode）

- **独立复测通过**：Blender CLI 重跑 tools/verify-scroll-gallery-v1.py，与 GPT 自报完全一致——房内 16.0/4.2/4.0、门洞 2.4；画心 10 段 span 与 sum 均 11.92、高 0.515；21 面朝向审计全 ok（法线朝房间）；灯位 Empty 14 个无多余、无真灯；集合四名齐全；856 三角面；GLB 85,376B、images=0/textures=0、29 材质 doubleSided（KHR_materials_transmission 用于玻璃）。四张渲染图人工过目通过：入口揭示构图、连续绢底金线、10 光池覆盖 X 3.0→15.0、俯视比例全部符合。
- **规格勘误两处（均为 zcode 规格自身笔误，SCROLL-GALLERY-SPEC.md 已同步修正）**：①天花搁栅"15.2"为算术笔误——采纳 GPT 实建 2.8→15.6 @1.6m 共 9 根（末梁与尽端墙 0.4m，与影墙端边距对称），模型不动；②段落铭牌 Y=+2.078 与画心共面，渲染可见铜牌压在画带上——列入第二轮（§2.11）：移至玻璃栏铜基座顶面 Y=+0.90/Z≈0.05，X 不变，可读文本由引擎 DOM 标签承担。
- **清理**：verify-shots/scroll-brief/（参考图临时副本，与 reference/scroll-brief/ 重复）已删除。
- **下一步（zcode 引擎阶段）**：真画高清扫描切片注入（10 画心 + 2 题跋 + 2 局部放大 + 2 铭牌底）；GLB 以 +200m X 偏移装载、传送出生点 (1.2,-0.6,0)、碰撞代理、14 盏聚光灯（#ffd9a0, angle 0.5, penumbra 0.6）、环境光压至大厅 ~15%、**不切 tone mapping**；画心材质切 FrontSide（GLB 已 doubleSided 且法线朝房间，切换安全）；地图 "Special Exhibition" 热区 + 传送。

## 2026-09-20 · 千里江山图特展厅：贴图注入 + 引擎集成（zcode）

**贴图管线**（tools/cut-scroll-slices.py，输出 assets/models/scroll/slices/ 共 16 文件 5.5MB）：
- 源 = Wikimedia Commons 完整合成扫描（PD-Art，39974×1600，14.7MB，临时目录处理不入盘同步）。
- 该合成版在卷首天空**叠印了溥光大字跋**（物理卷子上在独立接纸上）——按零编造原则，用同画面干净天空块 (x33500-36150,y0-540) 粘贴覆盖叠字区 (x36150-38800)，还原画心物理原貌。
- 切 10 画心（2048×885 q88，slice_01=扫描最右段=卷首，叙事顺序=行走顺序）+ 2 题跋（**蔡京真跋** x0-1880，"政和三年閏四月八月賜。希孟年十八歲…"，按真实比例居中于素绢）+ 2 局部放大 + 2 铭牌底图（PIL+Georgia 排版）+ manifest.json。

**引擎集成**（walkapp/walktest-entry.mjs）：
- 特展 GLB 加入 ASSETS 装载；房间绕 Y 转 180° 平移至 x∈[200,216]（world=(216−bx, bz, +by)）：画墙落在行走右手侧、卷首靠入口——刚体变换不镜像贴图。
- 10 画心独立材质各挂切片贴图（SRGB + aniso8）；全部 FrontSide（白模法线已审计）；玻璃 transmission→廉价透明；PLAQUE_01…04 暂隐藏（规格笔误压画心，待 GPT 二轮挪到栏座）。
- 14 盏 SpotLight(#ffd9a0,60,10,0.46,0.65,1.7) 按 LT_* Empty 定位；进入时全局灯压至 ~15%、曝光 1.12（**不切 tone mapping**）；退出逐项还原。
- 传送出生点 (214.8,0.15,-1.35)（前厅通道带内）+ 视角对齐反馈环（setToward dx=-err/sens 直乘弧度；抗弹簧 hold 机制，置于 frame 尾 player.update 之后才有效）。
- E/ESC 返回大厅（saved 全量还原）；走出入口门洞 (x>215.55,|z|<0.95) 自动返回；index.html 地图新增 SPECIAL EXHIBITION 呼吸徽标 → walktest.html?wing=scroll 直选；Pip 上下文含特展画作条目。

**排错记录（三个坑，均实证定位）**：
1. 贴图水平镜像：GLB UV dump（tools/inspect-scroll-uv.mjs）证明 u 轴与观者左右反向 → repeat.x=-1 补偿；**GLTFLoader 关闭 matrixAutoUpdate**，repeat/offset 必须配 `updateMatrix()` 才生效。
2. 贴图上下颠倒：TextureLoader 默认 flipY=true 与 glTF v=0=图顶约定相反 → flipY=false + needsUpdate 重传。
3. 传送朝向：GTA 式相机每帧从相机当前位置重算 yaw → 对齐必须放在 player.update 之后；一次性 lookAt 会被控制器弹簧覆盖。

**验证**（verify-shots/scroll-engine-*.png）：地图徽标→点击→fade→特展厅自动传送 ✓；前厅影墙揭示构图 ✓；铭牌文字正读、标题在上 ✓；长卷连续无接缝、山水方向正确、卷首滚筒在入口端 ✓；画心近观清晰（2048 宽 @1.2-1.8m 观距足够）；E 返回大厅灯光/位置/朝向全还原 ✓；全程 __err 空。renderer.info：31 draw calls / 5.2 万三角（特展房内）。画质三档与 G 键不冲突。
- 已知现象：IAB/被遮挡标签页 rAF 节流导致 tick 突发测试时控制器 splash 冻结可见——测试环境现象，真实前台使用无此问题。
- 未做（下一步可选）：古琴音区（待音频素材）、Pip 讲解点按段挂接、二期北走廊解绳开门、GPT 二轮铜牌挪位（§2.11）、2048→2560 切片锐化（如近观嫌软）。
- **vgallery-offline/ 与 zip 尚未同步本轮变更**（bundle/index/walktest/slices/scroll-gallery-v1.glb），部署前需重打包。

## 2026-09-20 · 特展厅用户实测反馈轮（zcode）

用户实测后五项反馈，全部处理并回归验证：
1. **地图徽标文字溢出**：SPECIAL EXHIBITION 超出胶囊底 → 底板加宽至 318、字号 20/字距 1.8。
2. **墙体塑料感/方块凳**：程序化凹凸贴图（canvas 织物/石板/木纹，bumpScale 0.008-0.02）上 INK_WALL/STONE_FLOOR/DARK_WALNUT/DARK_CEIL；长凳替换为大厅同款 **Oxblood tufted leather** 克隆（世界坐标 (207.2,-1.78)，贴对面墙），白模方块凳隐藏。
3. **出生镜头**：出生点移至画廊入口 (212.6,-1.2)，朝向 -X+0.25rad——影墙铭牌（克隆至影墙西侧画廊面，rotation.y+=π）落在画面左侧、长卷向纵深展开，与用户附图构图一致；HUD 左上标题进特展切换为 "SPECIAL EXHIBITION — A THOUSAND LI OF RIVERS AND MOUNTAINS / PALACE MUSEUM LOAN · VGALLERY WALK DEMO"，返回还原（存 childNodes[0].nodeValue 而非 textContent，避免拼接 small 子元素）。
4. **另外三面墙去重复**：detail_print_01/02 ←《清明上河图》虹桥段（张择端）、韩干《照夜白图》（大都会自藏）；scroll_colophon_01/02 ← 郭熙《早春图》、黄公望《富春山居图》段（均 Wikimedia PD-Art，tools/cut-scroll-slices.py 同款裁切）。Pip 上下文同步更新四件作品说明。
5. **跳回大厅+无法移动 bug**：根因=出门触发线 x>215.55 距出生点仅 0.75m，转身/后退即误触发；且触发时 clearHeldKeys 清掉了用户仍按住的键（松开重按才能动=体感冻结）。修复：触发线移到门 plane x=215.85、|z|<0.8（必须真正走进门洞）；走出门的回程 keepWalk 保留按键（无缝过门），E/ESC 主动返回才清键。回归：S 穿门→大厅 (0,6.3)→W 走 3.3m 无冻结 ✓。

验证截图：verify-shots/scroll-engine-*.png（含新增 spawn/中段/对面墙）。rAF 节流说明：被遮挡标签页 tick 突发测试时控制器 splash 会冻结可见，为测试环境现象。

## 2026-09-20 · 特展厅反馈轮 II：双向门户环线 + 五项打磨（zcode）

用户实测反馈五项 + 双向动线需求，全部落地（bundle ?v=scroll21）：

1. **双向门户（替代物理拼接）**：用户定调"游戏式切图，不用真走物理距离"。实现：两廊红绳移除（网格 visible=false + 删绳碰撞代理），走廊深处设触发线（z ∓11.85）→ 暖灰幕淡出 → enterScrollRoom("N"/"S")；特展厅两扇门对称回廊：前厅门 → 北廊 (0,-11.55)，尽端门 → 南廊 (0,+11.55)，形成 大厅北廊 → 特展（正叙看卷）→ 尽端门 → 南廊 → 大厅 的环线。尽端新增门洞+前室（程序化：WALL_END 关闭留 1.6×2.4 门洞，前室地/墙/顶/双开门 + 暖光 vLight，局部 x 16→18.8）。门户淡出用 worldCurtain（0.35s 入 / 0.5s 出）。
2. **皮凳**：首次实现错在克隆合并网格（Architecture_-_Oxblood_tufted_leather 含全部大厅长凳且顶点烘焙世界坐标，搬运即散架）。改为白模 BENCH 几何 + 大厅同款材质克隆 + 程序化拉扣凹点 bump（6×3 凹点），质感对齐大厅；位置贴对面墙 (207.2,-1.78)。
3. **顶灯灯具**：14 盏聚光灯位各加轨道射灯灯具（柱体+吊杆，深色金属），不再"灯光凭空出现"。
4. **玻璃→红地毯**：RAIL_GLASS/RAIL_BRONZE_BASE 隐藏、栏代理删除；画前铺 12.4×1.5 深红地毯 (0x6e1620)。
5. **E 主视角信息卡**：长卷前按 E → uiOpen="scrollfocus" + 玻璃卡（标题/作者/尺寸/馆藏/描述 + Audio Guide (A) 按钮）；相机贴玩家与画之间跟随最近画段（走到哪看到哪，0.55m 跟随偏移防玩家入镜）；A 键 TTS 语音（speechSynthesis en-US）；E/ESC 关闭并还原跟随视角。Pip 上下文含特展与四幅配画。

**排错记录**：①IAB 标签页 rAF 遮挡节流导致传送后无帧执行、门户"不触发"——测试时用 __tick 推帧；②enterScrollRoom 首帧相机恰在目标朝向 → 对齐被 0-err 提前解除、弹簧相机回拉——hold 机制保持;③相机穿门洞到房外——门洞是代理与实体墙共有的缺口，加 SCROLL.camGate（相机专用隐形门帘，入 cameraBlockers 不入玩家碰撞）。

**验证**：北廊走进→淡出→特展前厅（铭牌左、HUD 换特展标题）✓；E 卡 + 主视角 + Audio 按钮 ✓；尽端门 → 南廊 (0,11.55) + HUD 还原 ✓；南廊走进 → 特展尽端（倒叙入口，红毯/新画可见）✓；皮凳拉扣材质 ✓；全程 __err 空。
**未做**：进入世界全屏视频（等用户素材）、古琴音区、GPT 二轮铜牌挪位、offline 包与 git 同步本轮全部变更。

## 2026-09-20 · 特展厅反馈轮 III：单向动线回收 + 顶灯落实 + 进入世界全屏影片（zcode）

用户四项反馈 + 提供进入世界影片（D:\Download\qianlijiangshantu.mp4，4K/79s/219MB）：

1. **尽端回收为单路**：撤销上一轮的环线（WALL_END/CREDIT_PLATE 复显、题跋两幅归位、门洞填墙/前室/尽端门户/vLight 全部移除）。尽端恢复黑墙 + 早春图/富春山居两幅（按用户"另外三面墙放其他中国画作"保留）。
2. **顶灯落实 + 降密**：上一轮灯具太小（0.24m 深色柱在暗厅不可见）=用户仍看不到。本轮改为可见轨道射灯：吸顶盘 0.18 + 吊杆 + 0.4m 灯体（lookAt 目标）+ 暖光镜片圆片（MeshBasic 自发光观感）；画灯降密为 5 盏等距（LT_SCROLL 01/03/05/07/09，间距 2.4m，强度 60→85 补偿）。
3. **入口门外走廊纵深**：房间入口门洞外建纯视觉走廊（红墙 Venetian 红 + 木地板 + 米色顶 + 10m 尽端白门 + 暖光 PointLight），approach 时透过门洞有距离感；门户在 x>215.85 先触发淡出，走廊为纯景观不可达。
4. **南廊恢复绒绳**：环线取消后南向无目的地，恢复绒绳视觉（黄铜柱×2 + 红绳柱体，程序化）+ 边界代理。
5. **进入世界全屏影片**：源视频 ffmpeg（便携版 gyan 9.0.2，临时目录）压 1080p CRF25 + AAC 160k + faststart → assets/video/qianli-jiangshan.mp4（47MB，79s，含原声）。信息卡主按钮改 "ENTER THE PAINTING"（A 键同）→ 全屏金框影片（objectFit cover、非静音原声、E 退出走 closeUI video 分支）。移除浏览器 TTS 语音（用户否决僵硬机器音，原声替代）。

**验证**：北廊门户 → 特展 ✓；E 卡（ENTER THE PAINTING 按钮）✓；A/点击 → 全屏影片播放（t 递进、非静音、78.9s）✓；E 退出行内既有 closeUI video 分支 ✓；截屏 verify-shots 待补。南廊绒绳恢复 ✓。

## 2026-09-20 · 特展厅反馈轮 IV：键位回归语音管线 + 满铺红毯 + 顶棚封顶观感 + 无框全屏影片 + E 提示（zcode）

用户五项反馈（语音被删最严重），全部落地（bundle ?v=scroll25）：

1. **键位模型回归油画馆**：上一轮把 A 键错接成"进入画框"。本轮对齐主馆：E=开卡片，**A=Audio Guide 语音**，**回车=ENTER THE PAINTING（primary ⏎）**。卡片按钮结构与油画馆完全一致（primary+⏎ / Audio Guide (A) / stats 四行）。
2. **语音按原管线重新生成**：script.json 新增 `qianli` 文案（Wang Ximeng/1113/十八岁/十二米青绿/宫博馆藏/走栏杆看卷/走进画中），`node tools/gen-voice.mjs Cherry qianli` → assets/audio/Cherry/qianli.wav（2.3MB）。**关键坑：语音不能走 positional 声像**——Pip 精灵挂在主馆 spriteRoot（距特展 200+ 单位，inverse 衰减到无声），特展改用非空间化 `THREE.Audio`（scrollVoice）；playAudio 加 node 参数，stopAudio 双节点同停。
3. **地毯满铺**：12.4×1.5 短条出现"半红半别色"断裂观感 → 改 16.6×4.8 整间满铺红毯（局部 8,0.012,0），灯光下全间统一红色。
4. **顶棚"没封顶"观感**：实测 CEILING 板（y=4.0）法线朝下、渲染正常——真正原因是压暗灯光下顶面近乎纯黑，搁栅缝隙透出背景色像没封顶。修复：DARK_CEIL DoubleSide 兜底 + 木色微自发光（0x332412×0.55），顶面读得出是一个面。**附带根因：GTA 跟拍相机俯仰固定（feet+2.4 俯视），第三人称根本看不到天花板**——用户此前反复说灯"出不来"即此；灯具必须凑近/第一人称看。
5. **灯具终于可见（真 bug）**：灯具网格此前 `room.add()` 但用的是**世界坐标**——room 带 rotation.y=π+平移，二次变换把 5 组灯具甩到主馆 (3.6~13.2,4,-1.45) 附近漂浮，特展内当然没有。改 `scene.add()`（世界坐标直挂 scene）。
6. **无框全屏影片**：`#vid.raw` 模式（wrap inset:0、gilt/tag/cap 隐藏），playScrollCinematic 加 class、closeUI 与油画视频开启路径 remove，油画馆鎏金画框不受影响。仅留右上角 CLOSE—E 小字。
7. **画前 E 提示**：updateHighlight 加 SCROLL.active 分支——画前（z>0.1 且 202<x<215.5）"Press E — A Thousand Li of Rivers and Mountains"，其余区域 "Press E — Return to European Paintings"；提示条 bottom 抬到 112px 避开常驻横幅（bottom 内联在 updateHighlight 内设/清，不能放在帧末重置分支——会被同帧清掉）；开卡片/影片时收起常驻横幅、关闭恢复（SCROLL_BANNER 常量）。
8. **QA 钩子**：__reviewAudio playing 补 scrollVoice.isPlaying（此前特展语音在播但钩子读 positional 恒 false）。

**排错记录（测试方法学）**：①被遮挡标签页 rAF 节流下，Playwright page.screenshot 会拿到**陈旧呈现帧**（view 与 scene 状态对不上的"灵异截图"根源）——bringToFront 后配合"同 evaluate 内 tick+canvas.toDataURL"取帧 100% 新鲜（不经合成器）；DOM 覆盖层（卡片/提示）用"rAF promise→tick→screenshot"；②瞬移玩家到走廊 (219.5,0,0) 会触发 x>215.85 返程门户把房间藏掉，后续截图全变成大厅模式——freecam 截图前必须确认 SCROLL.active；③freecam 分支早退，控制器无自身渲染循环（已查证），手动摆机位安全。

**验证（全部通过）**：画前提示显示+分层 ✓；E→卡片（ENTER THE PAINTING ⏎ + Audio Guide (A) + 四行 stats）✓；A→qianli 播放（id/Stop 标签/AudioContext running/wav 200）✓；回车→全屏无框视频（raw 类、wrap inset 0、gilt none、非静音、78.9s 递进）✓；E 退出→回到漫游 ✓；走廊纵深（红墙木地板+尽端白门透过门洞可见）✓；顶棚搁栅+封顶面 ✓；5 盏轨道灯灯具+光锥可见 ✓；满铺红毯 ✓；返程门户 ✓。
**未做**：古琴音区（待素材）、GPT 二轮铜牌挪位、offline 包与 git 同步本轮变更（语音 wav/视频/引擎改动）。

## 2026-09-20 · 特展厅反馈轮 V：吊杆射灯垂进视野 + 影片换乐并拼接吸入片头（zcode）

用户两项反馈：

1. **顶灯"还是看不到"的真因与根治**：上轮灯具虽已挂对位置，但仍贴在 4m 顶棚下（y=3.75~3.99）——GTA 跟拍相机俯仰固定（feet+2.4 高俯视玩家），正常行走时视野上缘到不了 3m 以上，吸顶灯永远在画框外。本轮改为**吊杆射灯**：吸顶盘(3.99) + 细吊杆(3.94→2.88) + 锥形灯罩(2.78) + 大暖光镜片(2.64 朝下)，SpotLight 光源同步降到灯罩内（y=2.78），离墙更近强度 85→55 补偿。9 盏（5 画灯+题跋+引首+2 局部）统一。实测玩家第三人称真实相机帧中吊灯清晰可见 ✓（verify-shots/r5-pendant-thirdperson.png）。
2. **进入影片 v2：吸入片头 + vast-land 配乐**：用户提供 D:\Download\hero.mp4（人物立于画前被光吸入，10.1s/720p/含音效，末帧白屏正好接正片）与 vast-land 项目的 bg-music.mp3（5:38，实际路径 `myagent-work\claude workspace\vast-land\`）。ffmpeg filter_complex 一次合成：hero 上采样 1080p30（片尾音效 0.6s 淡出）+ 正片画面（原声弃用）+ bg-music 裁 78.88s（0.6s 淡入/末尾 2.5s 淡出）→ concat → assets/video/qianli-jiangshan.mp4（89.0s/1080p/48.6MB/faststart）。**同名换片必须加版本参数顶缓存**：引擎 src 改 `...mp4?v=2` 并重建 bundle（?v=scroll27）。验证：时长 89s ✓、t 递进 ✓、非静音 ✓、片头段/正片段画面均确认（r5-video-intro-dom.png / r5-video-dom.png）、E 退出 ✓。

**未做**：古琴音区（待素材）、GPT 二轮铜牌挪位、offline 包与 git 同步（含 qianli.wav、新影片、引擎改动）。

## 2026-09-20 · 特展厅反馈轮 VI：影片播完精准返回现实世界（zcode）

用户反馈：影片播到最后会隔几秒绕回"吸入"片头（loop 属性回绕 + 本机 http.server 无 Range 支持时回绕 seek 卡顿放大）。用户需求：**在影片结束的时刻精准返回现实世界，情愿早不能晚**。

实现：playScrollCinematic 关闭 `v.loop`；初始化处挂一次性 timeupdate/ended 监听（仅特展模式 raw 类在身时生效）——timeupdate 在 `currentTime >= duration - 0.3` 时提前触发返回（情愿早不能晚），ended 兜底；两者都走 closeUI 回展厅。油画馆视频路径显式还原 `v.loop = true`（展陈循环不受影响）。bundle ?v=scroll28。

**验证**：4 倍速自然播放（绕开本机服务器无 Range、seek 会重置回 0 的测试陷阱）完整跑一遍：88.95s 自动退出（时长 88.98）、overlay 隐藏、视频停住、未发生任何回绕（wrapped=false）、玩家原位留在特展厅 ✓。

**排错记录**：①无 Range 的 python http.server 上，`v.currentTime = X`（X 未缓冲）会被重置回 0——测试里"seek 到末尾却从头播"皆此因，用户最初"播完隔几秒才回片头"的卡顿同源（loop 回绕=一次 seek）；测试改用 playbackRate=4 顺序播完规避。②`v.duration` 在 src 重载后短暂为 NaN，seek 前必须等 duration 就绪。

## 2026-09-20 · 特展厅反馈轮 VII：吊灯改回轨道射灯样式（zcode）

用户反馈：吊灯能看到但垂得太低，正常应该是射灯样式、从高处往画上打光。改法：删除 2.78m 吊杆吊罩，改为**轨道射灯**——画墙侧共享轨道（11×0.06×0.1，贴搁栅下 y=3.94、世界 z=1.45）+ 吸顶盘/短连接杆 + 灯头（0.4 圆柱体，lookAt 瞄准画带）置于 y=3.62，暖光镜片推到灯体前端（lookAt+translateZ 0.21）；SpotLight 光源 3.55、强度 95（距墙 2.2m，按衰减回调）。高度取中：4.0 吸顶=视野外（历史教训），2.78 吊灯=用户嫌低，3.62 在视野上缘内且读作"从高处往下射"。实测第三人称玩家帧：灯头清晰、光锥打墙正常（verify-shots/r6-trackspot-thirdperson.png）。bundle ?v=scroll29。

## 2026-09-20 · 特展厅反馈轮 VIII：两只沙发放房间中部（zcode）

用户要求：沙发（长凳）放房间中间、放 2 只、相隔一定距离。实现：白模 BENCH 样板（牛津红拉扣皮+程序化拉扣 bump）克隆两只，置于房间中部红毯上世界 (205.6,-0.5) 与 (210.4,-0.5)——沿长卷方向、中心距 4.8m、凳体平行画墙；白模原"靠对面墙"位置 visible=false 收起。挪位用 Box3 中心对齐 + room.worldToLocal 换算 + 手动 updateMatrix（room 全员冻结矩阵）。无碰撞代理（与原长凳一致，可穿行）。实测截图 verify-shots/r8-benches-midroom.png：两凳居中分立、朝向画墙 ✓。bundle ?v=scroll30。

## 2026-09-20 · 特展厅反馈轮 IX：装饰画不再出提示、E 不再误触返回（zcode）

用户反馈：①走到另外三幅装饰画前提示语是"返回油画馆"，没必要——本馆只为《千里江山图》服务，其余是装饰；②误触 E 会被突然传回油画馆，得再跑回来，非常麻烦。

实现：①updateHighlight 特展分支只在真迹前（z>0.1 且 202<x<215.5）出"Press E — A Thousand Li of Rivers and Mountains"，其余区域完全不提示；②E 键处理移除馆内兜底 exitScrollRoom——馆内非真迹位置按 E 不再有任何动作，**退出只走前厅门户**（走进门洞 x>215.85|z|<0.8 自动返回北廊，与进门方向一致）。横幅"DOORS BACK TO GALLERY"文案不变仍准确。bundle ?v=scroll31。

**验证**：装饰画前无提示+按 E 无动作 ✓；尽端黑墙同 ✓；真迹前提示正常、E 开卡片 ✓；前厅门户走出返回北廊 (0,-11.55) ✓。

## 2026-09-20 · 角色换头：儿童人像头模替换 Ch23 默认头（zcode）

用户提供 D:\Download\儿童人像3d模型.glb（Tripo 生成，1.92M 面/98.6 万顶点/58.8MB，含衣领肩部），要求只换脖子以上，身体与手部动画不动。

**离线管线**（walkapp/tools/build-kid-head.mjs，node + meshoptimizer）：
1. 手写 GLB 解析（JSON+BIN chunk，accessor 逐分量解码，支持 stride/normalized）；
2. y 分带水平半径剖面找脖颈最细处（自动判定 cutY=最细点下方 4cm，保留完整颈环）；
3. 质心裁切（去衣服肩部）→ 开边顶点锁定 → MeshoptSimplifier.simplifyWithAttributes（保 UV、LockBorder）减面至 3 万；
4. 枢轴平移到裁切环中心；重打包 GLB（原 4MB JPEG 原样嵌入）→ assets/models/characters/kid-head.glb（5.1MB，24631 顶点/3 万面）。
产物：头模原点=颈环中心、+Y 向上、面朝本地 +X。

**引擎接入**（walktest-entry.mjs，player.init 之后）：
1. kid-head.glb 进 ASSETS 预载清单；
2. 原头隐藏：Ch23_Body 是头身合并蒙皮网格——按 skinIndex/skinWeight 主权重==Head 骨的三角形整片移除（重写 index）；Ch23_Hair、Ch23_Eyelashes 整网格隐藏（新头自带）；
3. 新头挂 mixamorigHead 骨：position(0,-6,0)、quaternion R_y(-90°)、scale 88（骨架局部单位≈厘米；四元数与缩放为实测定标）。

**关键事实（后续维护必读）**：①玩家模型是 characters/josh.glb＝Ch23 西装角色（8 个蒙皮网格共用 Armature001 骨架 135 骨）；tourist.glb（vanguard）未使用；②GLTFLoader 会清洗骨骼名冒号（mixamorig:Head→mixamorigHead）；③模型链有 scale 0.001×10（init 内 multiplyScalar），头模常量在此环境下实测定标；④?nohead URL 参数可关换头对照。

**验证**：源码级（刷新后）kid_head 挂 mixamorigHead ✓、Ch23_Hair 隐藏 ✓、Body 面数 41117 顶点→裁后剩余手/颈皮肤 ✓、正面视角新头+西装身体+蓝衬衫渲染正确（r9-swap4-front.png 同常量实时验证；r9-tight-back.png 俯视见新头发顶）✓。
**未做/注意**：头模大小角度如需微调，改 walktest-entry.mjs 换头块三常量（position/quaternion/scale）即可；离线工具重跑可调裁切线（PROF=1 环境变量只打印剖面）；offline 包与 git 未同步本轮变更（kid-head.glb 5.1MB 新资产）。

## 2026-09-20 · 换头事故修复：ASSETS 顺序与解构错位导致"房间套头"（zcode）

用户报告：角色头上套着整个房间（字面意义）。根因：kid-head.glb 插进 ASSETS 预载列表第 3 位，但 `Promise.all` 解构 `[gallery, tourist, crownGltf, scrollGltf, headGltf]` 未同步——headGltf 实际拿到的是**特展展厅 GLB**，`headBone.add(headGltf.scene)` × scale 88 = 14 米的房间头套；同时 crownGltf 拿到头模、scrollGltf 拿到皇冠，皇冠 360 与特展厅全部错位。

修复：kid-head.glb 移到 ASSETS 末位（解构顺序天然对齐）。重验：出生点角色戴新头站立 ✓；特展厅房间/长卷/轨道灯/地毯/提示全部正常 ✓；kid_head 挂 mixamorigHead ✓。bundle ?v=scroll35。

**教训**：ASSETS 数组与 Promise.all 解构是位置耦合的——往列表中间插资源必须同步检查解构变量名；此类错位不报错、只在运行时以荒诞形式表现（本次=房间套头），靠截图验收才暴露。

## 2026-09-20 · 换头修正：裁切线下移保住下颌 + 头模比例缩到原头尺寸（zcode）

用户反馈（附截图）：①头相对身体太大；②裁切线切在下颌处，下巴被平切掉。修复：①裁切线下移 0.671→0.585（build-kid-head.mjs 支持第 5 参数强制裁切线；自动探测的"脖颈最细"其实切在下颌中段——儿童头模脖子极短，下颌几乎贴领口）；②引擎缩放 88→68（含下颌后头模 0.395m×68≈27 单位≈原头 24.9cm 比例，头顶 176.8≈原 176.6 对齐）；③kid-head.glb URL 加 ?v=2 顶缓存（文件同名换内容，同视频教训）。重验：侧颜下颌/下巴完整、颈圈自然藏进西装领口、头身比例正常。bundle ?v=scroll37。

## 2026-09-20 · 换头修正 II：下颌保留 + 头轴居中 + 领口同色（zcode）

用户反馈（附截图）：①头相对身体比例过大；②裁切线切在下颌处，下巴平切消失；③后颈露出棕色领圈有裁切感；④头未水平居中、偏左。

根因与修复：①②自动脖颈探测在儿童头模上失准（儿童脖短、下颌贴领口），0.671 切线落在下颌中段且缩放按截短头计算——build-kid-head.mjs 加第 5 参数强制 cutY=0.585（保住完整下颌+短颈），缩放重标定 88→68（头模 0.395m×68≈27 单位≈原头 24.9cm+颈）；③领口同色：头模几何加 per-vertex color 渐变——y<3.5cm 全暗、3.5~5cm 渐隐，且面向(+X 下巴方向)不染——裁切环布料乘深色与西装同调，下巴皮肤不受影响；④头轴居中：枢轴从"裁切环平均中心"（环含下颌断面不对称）改为"颅顶段(y≥cutY+0.15)包围盒中心"，头轴对准脊柱。kid-head URL 加 ?v=3 顶缓存。bundle ?v=scroll43。

**验证**：正面（r9-centered-front.png）头居中、比例自然 ✓；侧颜（r9-centered-side.png）下颌完整、无平切 ✓；背后领口深色融入西装 ✓。工具：PROF=1 只打印剖面；第 5 参数=cutY。

## 2026-09-20 · 换头修正 III：颈部碎片清除 + 头位下移（zcode）

用户反馈（附特写截图）：①脖子略长、头可以再往下一点；②领口周围有原角色肉色碎片残留。

根因与修复：①碎片=原 Ch23_Body 颈部皮肤中"主权重=Neck 骨"的混合三角形——原规则只裁 Head 主权重三角形，Neck 权重皮肉全部留下，飘在新头模领口周围；②头位再降 2cm（-6→-8）压短颈长。裁除规则改为：任一顶点主权重∈{Head,Neck} 即整片移除（激进裁法，缺口由新头模颈环+衬衫领覆盖）。bundle ?v=scroll44。

**验证**：颈部特写（verify-shots/r9-neck-tight.png）无肉色碎片 ✓；头位降低后脖长自然、深色领圈与西装融合 ✓；正脸完整 ✓。

## 2026-09-20 · 换头修正 IV：头前移/上移 + 领口碎片精裁（zcode）

用户反馈：头再往前约 1cm、往上约 1cm；领口处再裁切干净些。修复：①头模局部坐标 pos(0,-8,0)→(0,-7,1)（骨架局部 +Z=角色前方，上抬 1cm+前移 1cm）；②原头裁除增加领口线规则：主权重∈{Spine1,Spine2} 且顶点 y>1.45（单位=cm）的锁骨/颈底皮肤一并移除，消除领口两侧肉色碎片。bundle ?v=scroll45。验证：正面特写（verify-shots/r9-tight-tuned.png）头位前移上抬生效、领口干净 ✓。

## 2026-09-20 · Pip 精灵重做：程序占位光球 → 立体萌宠（zcode）

用户反馈：小精灵还是"一个圆圈加点光晕"，眼睛太简单、不可爱、缺立体感。

重做（全程序化，无新增资产）：①身体=泪滴形 Lathe 车削体，自写菲涅尔 ShaderMaterial（中心奶白→底部暖金、边缘金色描边，uGlow 说话时抬亮）替代纯色小球；②五官=大深色瞳仁+双白高光点（水汪汪）+粉色球状腮红+微笑弧/说话椭圆双嘴型；③头顶小火苗（锥+亮尖+光晕，待机摇曳）；④背后一对双层半透明糖片翅膀（7.5Hz 扑扇，说话加速）；⑤动画=呼吸挤压拉伸（squash & stretch）、随机眨眼（2.2~5s，0.16s 闭合一循环）、说话时随音节弹跳+嘴型开合。

**踩坑**：①billboard Sprite 挂在每帧 lookAt 的脸组（spriteEyes）下不渲染——spriteRoot 下的光晕/闪星/名牌都正常，唯独脸组下两张腮红贴片无论 depthTest/opacity 如何都不出图，map=null 换纯色立刻可见；原因未深究，腮红改为真 3D 粉色小球（更立体，顺带绕过）；②帧循环里 innerGlow/outerGlow 每帧 setScalar 覆盖构造时的 scale——改基础尺寸必须同步改帧循环里的常量；③验证截图须在同一 evaluate 内完成"摆机位→脸组 lookAt→render→toDataURL"，lookAt 顺序写反会拍到脸朝旧机位的假象。

用户再反馈：身体加大、留白更多、五官向中心收拢显胖乎乎。执行：Lathe 剖面 ×1.3（半径 0.05→0.065、高 0.106→0.138），眼距 ±0.0225→±0.017、眼位降至中线略下，腮红/嘴同步内收，火苗上移 0.05→0.066，翅膀枢轴外移避开变大的身体。

**验证**：正面（verify-shots/pip-chubby.png）胖乎乎大圆脸、眼嘴聚中、腮红微笑 ✓；侧面（pip-chubby-side.png）泪滴轮廓、翅膀、火苗 ✓；嘴型状态 smileVis:true/talkVis:false（说话时嘴型才切换，属设计行为）。bundle ?v=scroll47。调试钩子：window.__pip={root,face,body}。

## 2026-09-23 · 导航主页上架 + 线上 vgallery 全量同步 + 特洛伊语音别名修复（zcode）

①导航页：`hanson/considerate-learning/deploy-index.html` 加 VGALLERY 卡片（网格首位，馆藏柱图标，tag 3D · WebGL，GitHub=zhouhouhan/themet，onclick='vgallery/'），SSH stdin+md5 部署到 /hanson/index.html（部署前 md5 对比线上无分歧，遵守"服务器为真理源"）。②线上 vgallery 自 0916 后首次同步：tools/deploy-0923.sh（md5 批量对比增量推送）推 67 文件（特展厅 GLB/切片×17/新头模/89s 影片 48.6MB/qianli 语音/scroll48 bundle 等），第二轮 skipped=67 ALL_OK 确认全同步。**部署脚本坑：多行 $FILES 嵌进远端 ssh 命令会被远端 bash 把换行当 for 列表终止符（"syntax error near walktest.html"）——嵌入前必须 tr '\n' ' ' 拍平；本地循环无此问题（IFS 分词），只坑"展开进远端源码"的场景。**③别名修复：展品 435908(特洛伊妇女) data.id='met-435908'，A 键取 met-435908.wav 必 404 静默失败（该语音当年以 trojan 为 id 生成：script.json/trojan.wav 俱在）——加 AUDIO_ALIAS={'met-435908':'trojan'} playAudio 入口改写，bundle ?v=scroll48。④离线包重打 vgallery-offline-20260923.zip（167MB，scroll48），作废 0920 版。线上验证：卡片/scroll48/别名串/6 关键资源全 200。
