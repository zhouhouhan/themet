# SCROLL GALLERY · 千里江山图特展厅 · 交接与建模规格 v1（2026-09-20）

> 本文是自足的交接文档：即使没有此前任何对话上下文，也应能只靠本文完成建模。
> 第一部分是项目背景与工作规矩，第二部分是建模规格。**两部分都要读完再动手。**

---

# 第一部分 · 项目上下文（Handoff）

## 1.1 项目是什么

vgallery 是一个网页端第一人称 3D 博物馆（three.js），主题为大都会艺术博物馆**欧洲绘画翼**，非官方致敬作品（Unofficial tribute to The Met）。现有内容：

- 入口流程 `index.html`：封面（cover-v2.png）→ Museum Map 展厅地图（map-v2.png，SVG 热区）→ 点击 European Paintings 进入 3D
- 3D 展厅 `walktest.html`：一座红墙拱顶大厅（gallery-v6），13 件展品：
  - 9 幅"画框内活画"（video：视频纹理贴进画框，含《麦田》等）
  - 1 部全屏沉浸影片（cinematic：Trojan Women，金框全屏播放）
  - 皇冠 360° 展柜（object，pointer-drag 环视）
  - 圣马可广场（world：走进 Canaletto 的画，3D 广场自由行走）
- Pip 伴游精灵：发光小球，看画时停在画框边，Q 呼出问答面板（DeepSeek），ESC 关闭
- 13 件展品的真实数据（标题/艺术家/尺寸/馆藏来源）全部来自 Met 官方 API，存在 `assets/paintings/met-originals/entrance-v6.json`

**产品规矩（必须遵守）**：界面文案全英文；UI 里不出现 AI/LLM 字样；藏品信息零编造，只来自官方来源；沟通用中文。

## 1.2 技术架构与铁律

| 事项 | 规矩 |
| --- | --- |
| 源码 | `walkapp/walktest-entry.mjs` 是唯一功能源码 |
| 构建 | 改源码后必须重建 bundle：`cd walkapp && ./node_modules/.bin/esbuild walktest-entry.mjs --bundle --minify --format=esm --outfile=../js/walktest-bundle.js` |
| bundle | `js/walktest-bundle.js` 是网页实际加载的产物，**禁止直接改** |
| 画廊母版 | `assets/models/blender/gallery-v6.blend`（编辑母版）→ `assets/models/gallery-v6.glb`（运行资源） |
| 尺度 | 1 Blender 单位 = 1 米，**禁止按包围盒自动归一化**（历史事故教训） |
| 日志 | `V6-REPAIRS.md` 是唯一事实日志，**每轮工作完成后按日期追加一节**（做了什么/参数/验证结果） |
| 版本 | 项目已是 git 仓库（github.com/zhouhouhan/themet，2026-09-20 建基线）；assets 大文件不入库，blend/glb 本地保存，改前留阶段备份 |
| 部署 | 线上 molin.wiki 由 zcode 管理，**本轮不要碰服务器、不要部署** |
| 备份 | 覆盖任何 blend/glb 前先留阶段备份（命名如 `xxx-before-<改动>.blend`） |

## 1.3 本轮任务在全局中的位置

新增《千里江山图》特展厅（A Thousand Li of Rivers and Mountains，王希孟，北宋，故宫博物院藏）。策展定位：**特展/借展**（On loan from the Palace Museum），不是中国馆；将来展品多了再升级成翼。

**场景关系**：特展厅是一个**独立的新 GLB**，与现有大厅同场景不同位置。第一期只能通过 Museum Map 的 "Special Exhibition" 热区传送进入；第二期再把现有大厅北端走廊（现在有绒绳拦着）的门打开、把特展厅焊接到走廊尽头。**因此绝对不要修改 gallery-v6 的任何文件**。

**分工（重要）**：

- **GPT（本轮）**：按第二部分规格建白模（灰占位材质），交付 blend + glb + 4 张验证渲染图，然后**停下来交回**。真画贴图（故宫高清扫描切片）由 zcode 制作注入。
- **zcode（后续）**：贴图注入、引擎集成（传送出生点、碰撞代理、聚光灯、Pip 讲解点、古琴音区、地图热区）。
- 若 GPT 也被要求做引擎集成：先和 zcode 确认没有并行编辑 `walktest-entry.mjs`，改完源码必须重建 bundle 并在 V6-REPAIRS.md 记录。

## 1.4 工作流程（白模两段式）

1. **第一轮（本轮）**：灰占位白模 → 自检尺寸 → 4 张渲染图 → 交付
2. zcode 注入真画切片贴图、进引擎验证动线
3. **第二轮（如有）**：修 UV/位移/比例问题 → 重新导出

## 1.5 验收清单（交付前逐条自检）

- [ ] 4 张渲染图：入口视角、长卷墙 45° 侧视、立面正视、俯视（输出 `verify-shots/scroll-v1-*.jpg`）
- [ ] 尺寸实量：房内长 16.0m / 净宽 4.2m / 净高 4.0m / 门洞高 2.4m / **画心总长 11.92m（10×1.192）**
- [ ] 10 个画心段是**独立 mesh + 独立材质**（scroll_slice_01…10），未合并未镜像
- [ ] 灯位 Empty 全部就位（LT_SCROLL_01…10、LT_TITLE、LT_COLOPHON、LT_DETAIL_01/02）
- [ ] 整房 < 80k 三角面；glb ≤ 8MB；GLB 内无大贴图
- [ ] Blender 版本、文件名、集合命名（SHELL / SCROLL / PROPS / LIGHT_MARKERS）符合规格

## 1.6 本机环境

- Blender：`C:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe`（其自带 python 有 numpy）
- 本地预览服务：双击 `start.bat`（端口 8080），或 `python -m http.server 8901 --bind 127.0.0.1`；入口 `http://127.0.0.1:8080/index.html`
- 浏览器调试钩子（引擎侧验证用）：`__exhibits` / `__openExhibit(id)` / `__state().uiOpen` / `__camera` / `__err`

---

# 第二部分 · 建模规格

美术基准 = 项目内 4 张已确认的效果渲染图，**先逐张打开看完再动手**：

| 文件（相对项目根目录） | 用法 |
| --- | --- |
| `reference/scroll-brief/v3-elevation-final.png` | **唯一展陈方式基准**：立面正视——连续无缝长卷、卷首滚筒在右端、题跋条在左端、绢边金线、玻璃矮栏。挂画方式以这张为准 |
| `reference/scroll-brief/v2-perspective-final.png` | 空间氛围基准：暗色画匣子、暖光只照亮画、墨绿吸光墙、深木搁栅低天花 |
| `reference/scroll-brief/v4-entrance-moodonly.png` | **仅前厅氛围参考**（影墙遮挡、拱门、揭示感）；其"斜面矮台展桌"展陈方式**不采用**；其"墙角转弯挂法"已采纳（见 2.5 题跋段） |
| `reference/scroll-brief/v1-perspective-panelsplit.png` | 落选方案存档（分屏挂法），仅说明"为什么不用它"——手卷的山势必须连续不断 |

## 2.1 局部坐标系（建模就按这套坐标）

原点 = 入口门洞处室内地面中点。

- **+X = 走进房间的方向**（入口墙 → 尽端墙），室内净长 16.0m（内面 X=0 → X=16.0）
- **+Y = 长卷墙一侧**，室内净宽 4.2m（内面 Y=-2.1 → Y=+2.1）
- **Z = up**，净高 4.0m（地面 Z=0，天花面 Z=4.0）

设计逻辑（防止改错方向）：中国手卷从右往左读。画墙放在行走方向的**左手侧**（Y=+2.1），卷首靠近入口；观众沿墙行走面对墙时，卷首正好在右手边起步。

## 2.2 房间外壳（Collection: SHELL）

| 部位 | 尺寸/位置 | 备注 |
| --- | --- | --- |
| 地面 | 16.0 × 4.2，Z=0 | 灰金石大板，材质 STONE_FLOOR |
| 天花 | Z=4.0 平面 | 深色材质 DARK_CEIL |
| 入口墙（X=0） | 带门洞 | 见下 |
| 尽端墙（X=16.0） | 整面 | 内面材质 INK_WALL |
| 长卷墙（Y=+2.1） | X 0→16 整面 | 内面材质 INK_WALL |
| 对面墙（Y=-2.1） | 整面 | 内面材质 INK_WALL |
| 墙厚 | 0.3 | 外壳封闭即可，不精修外面 |

- **门洞**（X=0 墙上）：宽 1.6 × 高 2.4，居中（Y=-0.8 → +0.8），平顶。四周做**石质门套**（copy 现有大厅 portal 的石作线脚风格，横平拱即可，套宽 0.25），材质 STONE_TRIM。
- **天花搁栅**（装饰）：主梁沿 Y 向，截面 0.16w×0.20h，梁底 Z=3.8，X = 2.8, 4.4, 6.0, …, **15.6**（每 1.6m，共 9 根；末梁 15.6，与影墙端留 0.4m 边距对称——2026-09-20 勘误，此前"15.2"为笔误，按 15.6 建模有效）；纵向边梁沿 X 向两根，Y=±1.9，同截面。材质 DARK_WALNUT。

## 2.3 影墙 / 标题墙（Collection: PROPS）

- 位置：X=2.2（厚 0.4，即 X 2.0→2.4），宽 2.6（沿 Y，Y=-0.75 → +1.85），高 2.6（Z 0→2.6）
- 留出通道：影墙南缘（Y=-0.75）与对面墙（Y=-2.1）之间 1.35m
- 材质：哑光炭黑 CHARCOAL_PANEL
- 正面（面向入口的 X=2.0 面）挂**标题铭牌**：1.2×0.8 平面，材质名 `TITLE_PLATE`（纯深色占位；文字贴图后续由 zcode 提供）
- 铭牌文字内容（定稿）：
  - A Thousand Li of Rivers and Mountains
  - Wang Ximeng · Northern Song dynasty · Dated 1113
  - Ink and color on silk · 51.5 × 1191.5 cm
  - Collection of the Palace Museum, Beijing

## 2.4 长卷墙（Collection: SCROLL）★ 核心

长卷墙内面 Y=+2.1。挂画带 X 3.0 → 15.0（12.0m）。

### 2.4.1 绢色衬底（背板）
- 一整条 12.0 长 × 0.755 高平面，Y=+2.080，Z 居中 1.45（Z 1.0725 → 1.8275）
- 材质 SILK_MOUNT（米绢色 #e8ddc4，roughness 0.9）

### 2.4.2 金线
- 两条 12.0 × 0.012 细条，贴衬底上下边缘（Z=1.8215 与 Z=1.0785），Y=+2.078
- 材质 GOLD_LINE（#b08d3e，metallic 0.8，roughness 0.35）

### 2.4.3 画心 10 段 ★ 不要合并
- 10 个独立平面，每段 **1.192 宽 × 0.515 高**，沿 X 从 3.0 依次排布（段 i 起点 X = 3.0 + (i-1)×1.192），Y=+2.075（在衬底前 5mm）
- 材质名 `scroll_slice_01` … `scroll_slice_10`，先全部中性灰占位；UV 每段 0-1
- 真实画作贴图（故宫扫描切片）后续由 zcode 注入，**GPT 不需要原画**
- **保持 10 个独立 mesh + 独立材质，禁止合并、禁止镜像 UV、禁止翻转法线**（引擎要按段控制 Pip 讲解点）

### 2.4.4 卷首滚筒
- X=2.95 处竖直圆柱：Ø0.09 × 长 0.86（Z 1.45±0.43），轴沿 Z
- 材质 DARK_WALNUT；两端小轴头 Ø0.11×0.03
- 垂下绢带一条：0.06×0.35 平面，从上轴头垂下，材质 SILK_RIBBON（#d9cba6）

## 2.5 题跋段（墙角转弯，Collection: SCROLL）

画心到 X=15.0 后**拐上尽端墙**（致敬真实手卷的题跋接纸）：

- 2 个平面，各 1.2 宽 × 0.515 高，Z 居中 1.45
- 贴尽端墙内面 X=15.975（离墙 2.5cm），从墙角 Y=+2.1 向 -Y 排：第一段 Y +1.5→+0.3，第二段 Y +0.3→-0.9
- 材质 `scroll_colophon_01/02`，灰占位（文字贴图后续提供）
- 题跋下方放**说明墙牌**：1.4×0.9 平面，X=15.98，Y 居中 -1.4，Z 居中 1.3，材质 CREDIT_PLATE（占位深色）

## 2.6 家具与道具（Collection: PROPS）

| 道具 | 位置/尺寸 | 材质 |
| --- | --- | --- |
| 玻璃矮栏 | 沿 X 2.9→15.1，Y=+0.90；玻璃高 1.05、厚 0.012；底下深铜基座 0.06×0.04 | MUSEUM_GLASS + BRONZE_DARK |
| 长凳 | 中心 X=8.8, Y=-1.5；1.8×0.45×0.45 皮面软凳（圆角） | LEATHER_DARK（#241f19） |
| 局部放大图 ×2 | 对面墙 Y=-2.08，画框 1.1×0.75、框深 0.04；中心 Z=1.5；X=6.5 与 10.5 | 框 DARK_WALNUT，画面 `detail_print_01/02` 灰占位 |
| 段落铭牌 ×4 | **玻璃栏铜基座顶面**：Y=+0.90，Z≈0.05，X=6.6/9.0/11.4/13.8，0.16×0.10，面朝上（装饰锚点；可读文本由引擎 DOM 标签承担。2026-09-20 勘误：原坐标 Y=+2.078 与画心共面会压在画上） | BRONZE_PLAQUE |

## 2.7 灯位标记（Collection: LIGHT_MARKERS，只放 Empty，不放真灯）

引擎侧实时打灯，GPT 只放命名 Empty 标记位置与朝向：

| 名称 | 位置 | 瞄向 |
| --- | --- | --- |
| LT_SCROLL_01 … LT_SCROLL_10 | Z=3.75, Y=+1.45, X = 3.6, 4.8, 6.0, …, 14.4（每 1.2m） | (同 X, 2.08, 1.45) |
| LT_TITLE | (2.2, 0.55, 3.90) | 竖直向下照影墙铭牌 |
| LT_COLOPHON | (15.4, +0.3, 3.75) | (15.98, +0.3, 1.45) |
| LT_DETAIL_01/02 | (6.5, -1.6, 3.75) / (10.5, -1.6, 3.75) | 对面墙两张放大图 |

引擎参数（zcode 用，GPT 不做）：暖白 #ffd9a0，spot angle ~0.5rad，penumbra 0.6；环境光压到大厅的 ~15%；**不改 tone mapping**（历史教训：切 tone mapping 触发全场景材质重编译卡顿，明暗对比全靠灯强）。

## 2.8 材质总表（全部 ASCII 命名）

| 名称 | 参考色 | roughness | 说明 |
| --- | --- | --- | --- |
| INK_WALL | #1d2a26 | 0.95 | 墨绿吸光布面墙（主体墙） |
| DARK_CEIL | #14100c | 0.95 | 天花底色 |
| DARK_WALNUT | #2a1d14 | 0.7 | 搁栅/门套内沿/画框/滚筒 |
| STONE_FLOOR | #4a4a48 | 0.55 | 灰金石大板，轻微反射 |
| STONE_TRIM | #b8b0a2 | 0.65 | 门洞石套（同大厅石材语系） |
| CHARCOAL_PANEL | #232323 | 0.9 | 影墙/铭牌底板 |
| SILK_MOUNT | #e8ddc4 | 0.9 | 绢色衬底 |
| SILK_RIBBON | #d9cba6 | 0.9 | 卷首绢带 |
| GOLD_LINE | #b08d3e | 0.35, metal 0.8 | 金线 |
| MUSEUM_GLASS | tint #cfd8d4 | transmission 0.9 | 同大厅低铁玻璃 |
| LEATHER_DARK | #241f19 | 0.6 | 长凳 |
| BRONZE_DARK / BRONZE_PLAQUE | #4d4237 / #8a6f3c | 0.4, metal 0.9 | 栏座 / 铭牌 |
| scroll_slice_01…10 / scroll_colophon_01/02 / detail_print_01/02 / TITLE_PLATE / CREDIT_PLATE | 中性灰占位 | — | 贴图后续由 zcode 注入 |

## 2.9 工程约束

- 面数预算：整房 < 80k 三角面（全是平面几何，不要开 subdivision）
- 贴图：GLB 里**只允许** TITLE_PLATE/CREDIT_PLATE 这类小图（≤256KB）；切片大图走独立文件夹 `assets/models/scroll/slices/`
- 尺度自检：导出前用标尺工具量——画心总长必须 = 11.92m（10×1.192）、房内长 16.0m、门洞高 2.4m
- 不要添加本规格之外的任何画、家具、文字、装饰
- 不要烘焙光照；不要改色调映射；石墙保持硬边，不要自动平滑法线

## 2.10 引擎侧分工（zcode 做，GPT 不用管）

- GLB 装载到场景远端偏移（第一期 +200m X），传送出生点：房内 (1.2, -0.6, 0)，面向影墙
- 碰撞代理：四面墙、影墙双面、玻璃栏（X 2.9→15.1 @ Y+0.9）、长凳、滚筒
- 10 段切片贴图注入（故宫/Wikimedia 高清扫描切 10 片，compact-glb-images.py 压缩）
- 10 个 Pip 讲解点 + 古琴音区 + 每段聚光灯
- 地图入口："Special Exhibition" 热区 + 传送
- 第二期：北走廊解绳开门，本房 GLB 平移/旋转焊到现有走廊尽头

## 2.11 第二轮修正清单（2026-09-20 zcode 验收白模后开出）

白模已通过全部验收（zcode 独立复测 + 四图人工过目）。第二轮只需做以下小事，随贴图轮回一并处理：

1. **PLAQUE_01…04 挪位**：从画带表面（Y=+2.078, Z=1.45）移到玻璃栏铜基座顶面（Y=+0.90，Z≈0.05，X 保持 6.6/9.0/11.4/13.8，法线朝上）。原因：原坐标是规格笔误，铜牌会压在画心上（渲染图已可见）。
2. 搁栅末梁 X=15.6 **维持现状不动**（勘误已确认，见 2.2）。
3. 其余一切保持；真实贴图由 zcode 注入，GPT 不需要原画。
