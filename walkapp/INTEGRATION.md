# three-player-controller 集成笔记（vgallery walk demo）

**仓库**：https://github.com/hh-hang/three-player-controller（MIT，npm: `three-player-controller`）
**版本**：controller 0.6.2 · three 0.184.0 · **three-mesh-bvh 必须用 0.8.x（0.9.x 会构造崩溃）**
**打包**：esbuild 单文件 ESM（`walkapp/walk-entry.mjs` → `js/walk-bundle.js`，~860KB）

## 踩坑实录（按发现顺序，全部已解）

1. **three-mesh-bvh 0.9.x 不兼容** → `X is not a constructor`。锁 0.8.0。
2. **collider 格式**：shape 是 `{ kind: "mesh", mesh: THREE.Mesh }`（不是 README 摘要里的
   `source`）；`init({ colliders })` 传了**不生效**（注册数 0），必须 init 后逐件
   `player.addCollider()`。
3. **BVH Worker 在打包环境失效**：控制器异步 Worker 建 BVH（esbuild 打包破坏 Worker URL），
   永远不 ready → 碰撞全无、角色坠穿世界。**解法：手动挂 three-mesh-bvh 原型补丁 +
   每个 mesh 预计算 `geometry.computeBoundsTree()` 后再 addCollider**（运行时查询直接读
   `geometry.boundsTree`）。
4. **游戏单位是厘米制**（人高=180）：米制场景必须 `scale: 0.01`，且**速度/重力/相机距离
   用默认值**（自动 ×scale 换算）。传 `scale: 1` 会被自动放大 98 倍（模型/胶囊全爆）。
5. **单面 plane 地板会被胶囊穿透**：展厅地板运行时换厚 Box（或 Blender 里给厚度）。
6. **出生点别嵌进碰撞体**：去穿透解算器会把角色弹上天（实测弹到 y=161）。出生抬高一点。
7. **键盘鼠标事件绑定是手动的**：init 后必须 `player.onAllEvent()`。
8. **渲染循环里不能再调 `controls.update()`**（控制器接管 OrbitControls）。
9. **注册 collider 前必须 `scene.updateMatrixWorld(true)`**：碰撞查询按世界矩阵走，
   若 update() 先于 render() 执行，地面还在原点 → 角色自由落体（实测坠到 y=-168）。
10. **速度公式：配置值 × scale = 米/秒**。米制世界：walk 1600/run 5000（scale 0.001 的
    Josh）。官方 example 的 150/600 是给他们自己场景的，别照抄。
11. **Josh（黑西装男人）= 仓库 example 自带角色**，毫米制（scale 0.001），44 个动画与
    控制器全对齐（idle1/walk/run/三段跳/fly 系列），朝向天生正确不倒走。
    Soldier 朝向反（倒走）——换 Josh 解决。
12. 少年模型（Tripo 生成）无骨架无动画，只能滑动不能走；要走需 Mixamo 自动绑骨
    （手动上传）或直接用带动画模型。

## 平地测试验证记录（2026-09-14）

walktest：站立稳定 ✓ 前进 1.4→1.6 m/s ✓ walk 迈腿动画 ✓ 背对相机正走不倒走 ✓
线上：https://molin.wiki/hanson/vgallery/walktest.html

## GTA 式相机（2026-09-14 晚）

控制器自带相机构图不达标（俯角 26.6°、机高仅 1.56m，角色顶在画面上半部）。
**方案：渲染前覆写相机位置**（控制器只管移动/碰撞/动画；yaw 从控制器算完的
相机位置反推，鼠标横转保留）：

```
CAM_DIST 4.2m · CAM_HEIGHT 2.4m（玩家脚底上方）· LOOK_HEIGHT 1.35m（胸口）
camera.position.lerp(desired, 0.3); camera.lookAt(feet + LOOK_HEIGHT)
```

实测结果：俯角 12°、机距 4.35m、角色头顶 44% / 脚 78% / 脚下留 22% 地面 —— 对齐
GTA 第三人称构图。注意：此覆写暂时跳过控制器自带的相机防穿墙（平地测试无需），
真实展厅阶段需要补一条相机射线碰撞。

## 语音小精灵 + 语音包（2026-09-14 深夜）

- **技术沉淀复用**：Qwen3-TTS（阿里 MaaS 私有部署）+ sha256(model|voice|text) 磁盘缓存
  （来自 hanson 项目 podcast 管线）。凭据从服务器 `~/video-learner-api/secrets.env` 读取，
  写入 vgallery `.env.local`（不回显）。生成器 `tools/gen-voice.mjs`，脚本 `assets/audio/script.json`
  （开场 5 句 + 9 件展品讲解稿），支持指定条目生成：`node tools/gen-voice.mjs Cherry intro-01 harvesters`
- 已生成：开场导览 intro-01..05 + harvesters（demo）；其余等展品清单定稿后批量出
- **小精灵**：程序化占位（暖金光核 + 加色光晕 + 6 环绕微粒 + 点光），跟随人物右前方 1.45m
  悬停浮动、说话时脉冲；真模型规格：15–25cm、GLB、idle+漂浮动画、<2 万面、emissive、米制
- 播放：首次移动/交互键自动连播开场 5 句；卡片 `Audio Guide` 播放该展品讲解（无音频则提示
  coming soon）；关闭卡片自动停播
- ⚠️ 音频播放需**真实用户手势**（浏览器策略）：合成按键测试会被 block，真机按键正常

## v5 内容与机位校正（2026-09-14 · 第二轮）

- **语音全覆盖**：script.json 对齐 v5 墙上 10 幅 + 皇冠（新增 socrates/cezanne/sunflowers/
  manet/pareja/degas-collector 六段，补生成 wheat/toledo/aristotle/crown），加开场 5 句共 16 段；
  `AUDIO_IDS` 绑定全部 11 件展品。旧条目（piazza/trojan/vermeer/degas）保留但不挂墙
- **机位校正（消除斜视）**：原实现"相机在法线轴上、注视点横向偏移"→ 视线与法线成角 → 画面透视斜。
  改为**位置与注视点同等横向平移**：`camTo = center + normal·d + right·L`、`lookTo = center + right·L`，
  视线严格平行法线（正面直视）；`camTo.y = center.y`（零俯仰，避免仰视变形）。
  `d` 按画幅自适应 `clamp(w×1.15, 2.4, 5.0)`，`L = d×0.36`（画心落在画面左侧约 20°）。
  实测 10 幅全部 `frontal=1.000`（点积核验），距离 2.47–3.62m
- **前墙补全**：v5 正面（z=+12）无装饰 → 运行时补 12.2×6.2 面板，**复用 v5 同款材质**
  （`Venetian red mineral plaster`）+ 同款大理石踢脚（`Cream veined marble`），颜色天然一致；
  同时作为碰撞代理（门洞仍封）
- **皇冠真实尺寸**：按 Crown of the Andes 实际高度 **34.3cm** 缩放（原约 1.42m），
  底面保持对齐原台座；缩放后柜内中心 (0, 2.07, -0.7)，锁定机位随之取新中心
- **元数据纠错**：塞尚静物、马奈《莫奈一家》在 Met API 标为未展出（G-）→ 原先我写的
  Gallery 826/818 属**编造**，已改为 "European Paintings"（如实呈现，不写假馆号）
- **踩坑（本轮）**：插入代码块时出现 TDZ —— 皇冠缩放块被放在展品绑定之后，而绑定时已引用其变量
  （`Cannot access 'p' before initialization`）。教训：**先声明、后使用，插入顺序要跟着依赖走**

## 信息卡：苹果式磨砂玻璃（2026-09-14）

`#card` 改为 vibrancy 材质：`backdrop-filter: blur(28px) saturate(135%)` +
亮色渐变基底 `linear-gradient(165deg, rgba(255,253,250,.88), rgba(248,244,238,.80))`
+ `border:1px solid rgba(255,255,255,.55)` 发丝高光 + `border-radius:20px`
+ 三层投影（外阴影/近阴影/内高光）；`@supports` 兜底为不透明底色；
`#dim` 压暗从 .35 降到 .22（磨砂自带分离感）；按钮同风格（半透明白底+发丝边+按压缩放）。
**注意**：基底若过透（如 .62）会被背景红墙染成粉色、文字对比度下降 —— Apple 质感的要点是
"亮基底 + 模糊"，而不是"高透明"。
代价：backdrop blur 对活动画布每帧有合成开销（单元素，成本可控；机器吃力可降 blur 或改回不透明）。

## 信息卡移到左侧（2026-09-14）

**问题**：自适应机位改动后，**所有展品统一落在画面右侧**（经 `__focusSnap` 点积核验：10 幅画
side=+0.339 / 19.8°，皇冠 +0.412 / 24.3°），而信息卡也在右侧 → 重合。
**处理**：卡片整体改为左侧（`#card { left:22px }`）——展品一概不用再调机位；实测 11 件全部在右、
卡片在左，零遮挡（截图确认：卡片左、画正视占满右半屏）。
**QA 钩子**：`window.__focusSnap(id)` 返回该展品锁定机位下"展品在画面左/右"的点积符号（不依赖
矩阵投影——注意 three 新版 `Camera.updateMatrixWorld` 不更新 `matrixWorldInverse`，`project()`
会得 NaN，改用向量点积更稳）。

## 画中世界：泼溅方案放弃 → 网格 GLB（2026-09-14 深夜）

**结论（三次隔离验证后）**：@mkkellogg/gaussian-splats-3d 的加载/渲染管线跑不起来 ——
① 官方标准 Viewer（自驱动+内置控制）也停在 "Processing splats…"、calls=0；
② 压缩(28.7MB)与未压缩(52.5MB)两种 ksplat 均失败（前者内部抛 `null.set`、后者抛 `null.buffer`）；
③ three r160 与 r184 均同样失败；④ Hanson 真机同样只见背景色。**判定：该路线不可靠，弃用。**

**替代方案（已实现代码，等素材）**：
- `WORLD_GLB = { wheat: { url: "assets/models/worlds/wheat-world.glb", fit: 70, ... } }`
  —— 把画中世界导出为**网格 GLB**（与他做皇冠的同一条工具链），走我们已验证的 GLTF 管线
- `preloadWorld()`：**启动时随首屏预加载**（满足"一起读出来、进入无缝"），
  自动归一化（水平居中、缩放到 fit 米、地面落到 y=0.02）+ 各向异性 8
- 世界区自带光照（Hemisphere + Directional，仅在世界内可见）
- 未就绪时用**占位世界兜底**（画作贴图包裹的圆柱，避免空场景）
- 进/出：showWorld/hideWorld + enterWorldNow；E 退出已实测还原位置与视角 ✓
- splat 库已从 bundle 移除（体积 1.2MB → 958KB）；本地 `splattest.html` 为泼溅诊断页（未部署）

## "画框里的画活过来"：画布内视频播放（2026-09-14 深夜）

**需求（Hanson）**：The Harvesters 的活画视频不要单独的播放入口/播放器 —— 按 E 打开该展品时，
视频**以原画尺寸精确覆盖在画布上循环播放**（像画框里的画突然活了）；卡片不再出现播放按钮。

实现（`walktest-entry.mjs`）：
- `ensureVideoPlane(e, src)`：按展品 Box3 的真实尺寸建平面（侧墙用 z 向宽、后墙用 x 向宽），
  法线方向朝厅内偏移 0.03 避免 z-fighting；`VideoTexture` + `MeshBasicMaterial`（自发光感）、loop、**muted**
  （与 Audio Guide 并存不抢声）
- **cover 适配**：视频 16:9、画布 1.36:1 → `repeat(0.763,1) offset(0.118,0)` 按画布比例裁切两侧
  —— 既不变形，也顺带裁掉源视频左上角"AI生成"水印（不再需要整屏播放器的 CSS 裁切）
- 触发：`openInfo` 里 `xp.kind === "video"` → `playInFrame(e)`；卡片不再渲染主按钮（video 类型无 CTA）
- 退出：`closeUI` → `stopAllInFrame()`（暂停 + 隐藏平面；画布恢复为静止原画）
- 复用性：托莱多等其它视频展品自动套用同一机制（换真视频即生效）

实测：E 打开收割者 → 卡片仅 "Audio Guide (A) / Related Works"；视频平面 3.15×2.32m（=原画布）、
`playing: true`、repeat/offset 如上；截图确认画面在金框内播放、无水印、无拉伸。

## 《麦田与丝柏》画中世界：高斯泼溅接入（2026-09-14 深夜）

**素材**：Hanson 提供 `wheat-raw.ply` = **高斯泼溅**（1,251,629 球、70MB，非网格；
属性 f_dc/opacity/scale/rot）。包围盒 94×88×71m，地面 Y≈−5.4（1% 分位），天空延伸至 +55。
**转换**：`tools/splat/convert.mjs`（自建，基于 @mkkellogg/gaussian-splats-3d 的
PlyParser + SplatBufferGenerator）→ `wheat.ksplat` **28.7MB**（compression 1、alphaRemove 5、SH 0）。

**集成**（`walkapp/walktest-entry.mjs`）：
- 库：`@mkkellogg/gaussian-splats-3d`（DropInViewer，`gpuAcceleratedSort: true`），
  挂在 worldRoot（x=300），`addSplatScene(..., { position:[0,5.4,0] })` 把地面抬到 y=0，
  与 `proxy_world_floor`（120×120、顶面 y=0）对齐
- DropInViewer 的渲染由 callbackMesh.onBeforeRender → `viewer.update(renderer,camera)` 驱动，
  **不需要（也没有）手动 `viewer.update()`** —— 之前误调导致每帧异常、画面冻结
- **门禁坑**：dropIn 模式下 `splatRenderReady` 可能自锁（首排需 update 驱动、update 被门禁挡），
  数据就绪后手动放行：`if (V && !V.splatRenderReady) V.splatRenderReady = true`
- 进入体验：世界未加载时**留在展厅**显示 "LOADING THE PAINTING…"，就绪后自动传送；
  已缓存则直接传送。E 退出沿用 closeUI（回原位 + 恢复背景）
- 调试钩子：`__worldState()` / `__worldViewer` / `__freeCam`（临时接管相机的开关）

**⚠️ 未能在本机验证渲染**：本测试环境（ZCode 内嵌 webview）里，**连库的官方标准用法
（自驱动 Viewer + 内置控制）也永远停在 "Processing splats…"、calls=0**，因此判定为
环境无法运行该渲染管线（GPU 回读/Worker 限制），而非集成代码问题。**需 Hanson 真机验证**：
进入麦田世界是否出画面、帧率、E 退出。若真机也不出画面，改用库自带 Viewer 全屏接管方案。

### 加载进度条（2026-09-14）

**Bug**：进度条一直不动 —— 早前用 `loading.textContent = "LOADING GALLERY"` 把内部的
`#bar/#bar-fill` DOM 直接抹掉了，`getElementById("bar-fill")` 拿到 null，进度无处可写。
**修法**：重新写入完整加载 UI（`#ld-label` + `#bar/#bar-fill`），并改为**按字节加权**统计：
`GLTFLoader.loadAsync(url, onProgress)` 取每件资源的 `loaded/total`（服务器有 Content-Length），
总进度 = Σloaded/Σtotal（展厅 48.3MB 占大头）；完成时标签变 `PREPARING SCENE` 再淡出。
线上实测：4% → 27% 平滑递增，标签与进度条同步。

### 性能优化（2026-09-14 · 展厅内走动卡顿）

诊断（页面内实测）：50 网格 / **113.9 万三角面** / **14 盏灯** / **1 个 `transmission=1` 材质**。
**主因**：展柜玻璃 `Museum low iron glass` 是透射材质 → three.js 每帧把**整个场景额外渲染一遍**
到透射缓冲（≈成本×2），而该玻璃位于展厅中央、永远在视野内 —— 与"中间走路卡"完全对应。

处理（全部运行时，不改模型）：
1. **透射归零**：`transmission>0` 的材质 → `transmission=0; transparent=true; opacity=.18; depthWrite=false`
   （视觉近似，代价几乎为零）→ 实测 `transmissionLeft: []`
2. **灯架 8 射灯 → 4 射灯**（z=-8 / 2.5），总数 14 → 10，氛围靠 hemisphere/ambient/env 支撑
3. **静态布景冻结矩阵**：`matrixAutoUpdate=false`（约 50 网格省每帧矩阵遍历）
4. **分辨率自适应**：DPR 上限 1.5；连续 <45fps 自动降 0.25（下限 0.75），>58fps 升回

复测：fps 60（本环境封顶）、draw calls 65、透射材质 0、灯 10。
若真机仍卡，下一档杠杆是**几何简化**（gltf-transform simplify，约可降到 40% 面数，建筑不敏感），
但会动到已验收的模型，需先与 Hanson 确认。

### 代码审查发现（本轮）

1. `Raycaster` 用错：射线原点是 `ray.origin`/`ray.direction`（写成 `camRay.origin` 会抛错）
2. 控制器 `player.update()` 使用**内部时钟**计 delta → `__tick` 手动步进无法产生位移/碰撞效果，
   动态验收必须在真实时间下喂输入（已记档）
3. 小优化（未改，规模无碍）：精灵眼睛 `lookAt` 每帧 `new Vector3()`；`window.__ringClock`
   用了全局变量做计时器，宜改为模块内变量
4. 已知空档：长椅无碰撞（可穿过）；四面墙门洞全封；`object` 模式指针锁定失败时靠 clientX 差值兜底

## v5 展厅接入（2026-09-14 · 按 handoff 文档）

- **加载**：`assets/models/gallery-v5.glb`（48.3MB，米制/Y-up）原样 `scene.add`，不旋转/缩放/居中；
  加载进度按 3 个资源（v5 + Josh + crown-opt）计，不再提前隐藏 loading
- **移除**：GridHelper、平地地面、环形 8 展台、自建皇冠柜（v5 内含展柜与皇冠）；
  仅保留 `crownForViewer`（crown-opt.glb 克隆）供 360° 赏析
- **光照**：移植 index.html 配方（ACES exposure 1.15 + PMREM 环境 environmentIntensity .55 +
  ambient/key/fill + 8 盏射灯 + 皇冠点光）；parquet 运行时修正
  `color.setRGB(.52,.40,.31) roughnessMap=null roughness=.22` + 贴图 anisotropy；不整体替换 MeshPhysicalMaterial
- **碰撞代理**（隐藏盒体，非精细 GLB）：大厅地板 12.6×0.6×24.6（顶面 Y=0）、四面墙（门洞暂全封）、
  皇冠展柜 1.9×4.3×1.7 @(0,2.15,-0.7)、画中世界地板 @x=300；注册流程仍为
  updateMatrixWorld → 预计算 boundsTree → init 后逐件 addCollider
- **出生点**：`(0, 0.15, 6.3)` 面向 -Z（原 (0,0.15,15) 已在大厅外）
- **展品绑定**：遍历 GLB 里 `ART*` 画布节点 → `Box3` 取世界中心 + 轴向定法线
  （西墙 X=-5.93 朝 +X、东墙 X=+5.93 朝 -X、后墙 Z=-11.9 朝 +Z）→ 触发点 = 中心 + 法线×1.7（落地面）；
  记录按 `extras.met_object_url` 的 6 位 Met ID 匹配。**10 幅全部按 ID 正确绑定**，映射：
  435809 Harvesters（视频+语音）、436535 Wheat Field（画中世界）、436575 Toledo（视频占位）、
  437394 Aristotle（图文）+ 6 幅新图文（436105 苏格拉底 / 435882 塞尚静物 / 436524 向日葵 /
  436965 马奈 / 437869 帕雷哈 / 436122 德加版画收藏家）。旧 piazza/trojan/vermeer/舞蹈课数据保留但不挂墙
- **锁定机位**：改用画布真实中心/法线（相机 = 中心 + 法线×2.6，lookAt = 中心 + 右向右偏 0.95 →
  画落在画面左侧，右 44% 留给卡片）；皇冠用柜内中心 (0,2.6,-0.7)
- **相机防穿墙**：头部向目标机位射线，撞墙/展柜代理则拉近（`Raycaster`，注意是 `ray.origin` 不是 `origin`）
- **调试钩子**：`window.__tick(dt)` 手动步进一帧（rAF 被挂起时可用）；
  注意控制器 `player.update()` 用内部时钟计 delta，**手动步进无法产生位移**，位移/碰撞验收必须在真实时间下喂输入
- 验收（真实时间驱动）：出生稳定 ✓ 展柜阻挡（停 z=0.18，柜面 0.15）✓ 西墙阻挡（停 x=-5.97，墙面 -6.0）✓
  10 幅绑定 ✓ 卡片数据（含尺寸/来源/馆号）✓ 高亮+E ✓ 锁定机位（2.62m 正对，画在左）✓

## 视角保持（2026-09-14 深夜修正）

**Bug**：按 E 关闭卡片后视角变了（例如原本背对展品，关闭后朝向被带偏）。
**根因**：GTA 跟随相机每帧从"相机当前位置"反推方位角（yaw）以支持鼠标转视角；
锁定机位把相机搬到了展品正前方，关闭后反推出的 yaw 就是那个新方向。
**修法**：`openInfo` 时记录 `savedCamPos`，`closeUI` 时把相机位置原样还原
（世界模式进入时也记录）。实测：按 E 前 [6.36,2.31,-0.62] → 关闭后完全一致 ✓

## 快捷键与沉浸态鼠标（2026-09-14 深夜）

- 卡片内：**⏎ = 主操作**（PLAY THE FILM / VIEW IN 360° / ENTER THE PAINTING）、
  **A = 语音导览**、**E = 关闭**（按钮文案带提示，页脚写 `⏎ SELECT · A AUDIO · E CLOSE`）
- **360° 赏析**：进入即请求指针锁定，**鼠标移动直接旋转**（无需按住），闲置 2 秒恢复自转；
  退出时释放锁定。未锁定环境下用 clientX 差值兜底
- **视频**：鼠标一动浮出字幕/关闭提示，3 秒无操作自动隐藏（沉浸感）

## 交互键：E 开关式（2026-09-14 深夜修正）

**E = 开/关切换**：靠近展品按 E 打开（锁定机位+信息卡），再按 E 关闭；视频 / 360° /
画中世界 里按 E 也直接关回展厅。**不再用 ESC 作提示**——ESC 是浏览器退出指针锁定的
行为，会让鼠标突然"跳出来"，体验困惑（ESC 仅作静默兜底保留）。
所有 UI 提示文案统一为 `CLOSE — E`。

## 信息卡 UI（按 Hanson 设计稿重做，2026-09-14 深夜）

E → **相机锁定该展品机位**（画作垂直正对/皇冠 3/4 角，展品落画面左约 1/3，
0.7s easeOutCubic 推镜；右 44% 留给卡片）+ 右侧米白信息卡：
眉标 / 大标题 / 作者·年代 / 描述 / **按互动类型变化的主按钮**
（`▶ PLAY THE FILM` ｜ `View in 3D →` ｜ `Enter the Painting →`）
+ `Audio Guide`、`Related Works`（当前为占位按钮，点了弹 coming soon 提示条）
+ 四格元数据（Dimensions / Materials / Credit Line / Location，全部 Met API 真实数据）
+ 页脚 `OBJECTS CONNECT US`。场景轻微压暗（#dim 层）衬托卡片。

## 真视频接入 + 默认播放（2026-09-14 深夜）

- **交互改直入**：有 `experience` 的展品，按 **E 直接进入体验并播放**（不再需要面板+按钮）；
  无体验的展品仍打开图文面板。作品简介移进体验内字幕条（视频/皇冠均带标题+作者+简介）
- **《收割者》活画**（Hanson 提供，10.05s 1280×720）→ `assets/video/harvesters-loop.mp4`，
  `loop` 播放；**源视频左上角有"AI生成"水印** → 播放器 `scale(1.12) translate(-1%,-2%)` 裁掉
  （该类问题统一用 `cropWatermark: true` 标记；更优解是源头重生成无水版）
- 其余视频展品暂用 placeholder-loop.mp4（UI 标 PLACEHOLDER FOOTAGE），换片只改数据里的 src

## 皇冠赏析：自动旋转 + 拖拽（2026-09-14 深夜修正）

两个 bug：
1. **拖拽无效** → `#obj` 全屏覆盖层没写 `pointer-events:none`，把 pointer 事件全吃了，
   canvas 收不到。修：覆盖层 `pointer-events:none` + 关闭按钮 `pointer-events:auto`。
2. **没有自动旋转** → 改成拖拽版时把自转删了。修：`if (!drag.active) drag.rotY += delta*0.55`
   （拖拽时接管，松手自动续转）。

实测：横拖 400px → rotY +4.2 rad（≈240°，灵敏度 0.01 rad/px）；纵拖 20px → rotX 0.16。

**通用坑**：任何全屏覆盖 UI 层叠在 canvas 上，都必须 `pointer-events:none`（弹出层同理），
否则 3D 场景收不到鼠标交互。

## 跳跃物理（2026-09-14 深夜修正）

源码真相：`c.playerVelocity.y = c.jumpHeight` —— **jumpHeight 是起跳初速度，不是高度**；
gravity / jumpHeight / speed 全部 ×scale。官方默认（gravity -2400、jump 600、scale 0.001）
在他们玩具尺度世界成立，米制世界必须重算：

```
setGravity(-9800)    // 9.8 m/s²
setJumpHeight(4650)  // 初速 4.65 m/s → 跳高 ≈ v²/2g = 1.1m
```

实测：跳高 1.09m、落回原点、三段跳动画（jump → Jump_Loop → Jump_Land）正常。
另：跳跃输入是**边沿触发**（false→true 才起跳），真实按键天然满足。

## 三种展品交互（2026-09-14 深夜 · 功能完成）

展品数据里加 `experience: { kind }`，图文面板做枢纽（E → 面板 → CTA 按钮进入体验）：

| kind | 交互 | 实现 |
|---|---|---|
| `video` | 全屏播放视频（活画/影片） | `<video loop>` 全屏层 + 标题条 + PLACEHOLDER 标记；ESC 暂停退出。换片只改 `src` |
| `object` | 360° 拖动赏析 | 独立 objScene + 专用相机；指针拖拽转 yaw/pitch（±0.9 限位）；成品见皇冠 |
| `world` | 进入画中 3D 世界 | 世界内容放在 x=+300 偏移处（同一 scene，玩家直接传送过去走）；ESC 传送回原位并恢复雾/背景 |

- 皇冠真模型：Tripo 55.6MB → **gltf-transform optimize → 2.77MB**（贴图 2048 + meshopt；
  **加载器必须挂 MeshoptDecoder**）
- 占位视频 `assets/video/placeholder-loop.mp4`（旧项目 hero.mp4，UI 标 PLACEHOLDER FOOTAGE），
  等 Hanson 活画/影片替换
- 世界为占位（画作贴图包裹圆柱 + 地面圆盘），等 ChatGPT/Blender 的真世界 GLB 替换
- 真世界 GLB 到位后的接法：加载进 worldRoot（同一场景偏移位），其余逻辑不变

## 互动功能测试台（2026-09-14 晚）

- 平地中央皇冠玻璃展台（程序化占位）+ 环形 8 幅真画（Met CC0 高清图，1400px 贴图）
- 走近 2.4/2.6m → 底部提示条 → **E 打开**：画=全屏图文面板（真馆藏号+英文简介），
  皇冠=相机特写 + 360° 旋转 + 讲解文案；**ESC 关闭**，UI 打开期间冻结玩家更新
- 展品数据为独立数组（标题/作者/年代/馆号/描述/贴图路径），换素材只改数据不改逻辑
- 测试钩子：`__openExhibit(id)` / `__closeUI()` / `__state()`

**环境坑（重要）**：ZCode 内置浏览器会静默挂起 rAF（实测 1 秒 0 帧，页面仍显示
visible），导致渲染/物理/输入全部"冻结"——所有动态功能必须真机验证；内置浏览器
只适用于刚 reload 后的活帧截图与 DOM 层验证。

## 待真机验证（内嵌浏览器测不了）

- WASD 行走 / Shift 跑 / Space 跳 / V 切第一人称 / F 飞行 / 拖拽转视角 / 滚轮缩放
- 内嵌浏览器里已验证：模型加载 ✓ 第三人称相机 ✓ 胶囊人形尺寸 ✓ 站地板稳定 ✓
  119 件碰撞体注册+BVH ready ✓ 动画机运行 ✓（输入→位移链路因环境节流无法测）

## 快速命令

```bash
cd walkapp
npm i          # 首次
npx esbuild walk-entry.mjs --bundle --minify --format=esm --outfile=../js/walk-bundle.js
# 本地: vgallery 目录 python -m http.server 8901 → /walk.html（?debug=1 显示碰撞线框）
```
