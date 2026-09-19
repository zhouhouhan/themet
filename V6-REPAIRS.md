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
