# vgallery · The Met, Walkable — v1 产品与工程计划

**日期：** 2026-09-14 · **状态：** 待 Hanson 签字确认
**一句话：** 把大都会博物馆的一个馆做成可行走、可讲解、可走进画中的 3D 线上博物馆，商业级完成度。

---

## 1. 定位与原则

- **产品形态**：正经商业感的线上博物馆体验（非官方致敬版）。
  页脚小字：*An unofficial tribute to The Metropolitan Museum of Art · Built by Hanson Zhou*
- **语言**：界面与导览词纯英文。
- **硬规矩（Ted 课程）**：界面 chrome 绝不出现 AI/LLM 字样；一切数据零编造
  （导览词底稿全部来自 Met 官方藏品页/展签/官方解说，改写不杜撰）。
- **能耗原则**：预生成静态资产（音频、活画视频）而非实时生成；简单方法优先。
- **旧项目处置**：vast-land / solar-habitability 保持在线不动，源码存 `reference/` 备查；
  千里江山图管线（图生 3D → GLB → three.js 漫游）在沉浸式展品中复用。

## 2. 已定决策（2026-09-14 两轮确认）

| 决策点 | 结论 |
|---|---|
| 时间盒 | 不赶课程节点，按商业品质做 |
| 导览语音 | v1 预生成音频（界面叫 Audio Guide）；v2 再升级实时对话 |
| 沉浸式技术 | 按画混用：旗舰画真 3D（图生 3D 管线），其余 2.5D 多层视差 |
| 界面语言 | 纯英文 |
| v1 范围 | **1 个馆做绝：European Paintings（欧洲绘画馆）** |
| 移动端 | 桌面优先；手机能打开能走（触屏摇杆）即可，手感后调 |
| 展厅建法 | 程序化建模（three.js 按真实展馆尺寸建墙/画框/射灯，画作真图上墙） |
| 署名 | 商业感 + 页脚小字署名 |
| 平面图 | 按真实布局自绘风格化 SVG 地图；其他馆显示但标 "Opening Soon" |
| 3D 旋转展品归属 | 油画馆内设 "Featured Object" 特展展柜（跨馆藏借展，博物馆常规做法） |

## 3. v1 用户体验流程（闭环）

1. **首页**：风格化大都会平面图。European Paintings 高亮可点；其余馆灰显 + "Opening Soon"。
   顶部产品名，页脚署名与来源声明。
2. **进入展厅**：加载后第一人称 3D 展厅（WASD + 鼠标，触屏摇杆保底），
   Audio Guide 自动开始馆级导览。
3. **靠近展品 → 自动 highlight**：描边/射灯渐亮 + 展签浮出（标题/作者/年代）。
4. **highlight 后三个动作**（按展品类型提供）：
   - **Zoom**：OpenSeadragon 深缩放看 CC0 高清原图（服务器已有部署先例）
   - **Enter the Painting**：走进画中世界（旗舰真 3D / 其余 2.5D 视差飞行）
   - **Rotate**：3D 模型 360° 旋转 + 语音讲解（仅 Featured Object 展柜）
   - **Living Painting**：部分画作在框内即为无缝循环动画（豆包生成），靠近自动播放
5. **Audio Guide**：按展品触发的英文讲解（预生成 mp3），HUD 显示播放状态，可全局静音。

## 4. 展品清单草案（⚠️ Hanson 可否决调整；全部需经 Met API 核验 CC0 后定稿）

| # | 作品 | 作者/年代 | 类型 | 动作 |
|---|---|---|---|---|
| 1 | The Harvesters | Bruegel, 1565 | 沉浸式 | Enter（2.5D 视差） |
| 2 | Wheat Field with Cypresses | Van Gogh, 1889 | 沉浸式旗舰 | Enter（真 3D，图生 3D 管线） |
| 3 | Garden at Sainte-Adresse | Monet, 1867 | 活画 | 框内循环动画 |
| 4 | View of Toledo | El Greco, c.1600 | 活画 | 框内循环动画（雷雨云动） |
| 5 | Bridge over a Pond of Water Lilies | Monet, 1899 | 活画 | 框内循环动画（水波/柳动） |
| 6 | Young Woman with a Water Pitcher | Vermeer, c.1662 | 高清 | Zoom |
| 7 | Aristotle with a Bust of Homer | Rembrandt, 1653 | 高清 | Zoom |
| 8 | The Dance Class | Degas, 1874 | 高清 | Zoom |
| 9 | Crown of the Andes | Colombia, c.1660 | **3D 旋转**（特展柜） | Rotate + 讲解 |
| 10 | William（蓝釉河马） | Egypt, Middle Kingdom | **3D 旋转**（特展柜） | Rotate + 讲解 |

活画生成原则：保留笔触与颜料质感、无缝循环 5–8 秒、不加会穿帮的现代元素。

## 5. 技术架构

- **单页 three.js 应用**（本地 vendor，不用 CDN）；场景切换而非多页面。
- **程序化展厅**：按 800 号展厅真实尺寸建墙体/地板/画框/射灯；画作 = 自托管 CC0 图（WebP 分级压缩）。
- **深缩放**：OpenSeadragon + 切片金字塔图（构建期生成瓦片）。
- **3D 模型**：Met 官方模型下载（核验逐件许可）→ Draco 压缩（hanson/ 有现成 draco 管线）。
- **音频**：英文文案（Met 官方资料改写）→ TTS/录音 → mp3 静态托管；M2 时出 2–3 个声音样张给 Hanson 选。
- **接近检测**：raycast + 距离阈值触发 highlight。
- **部署**：`molin.wiki/hanson/vgallery/`，SSH stdin + md5 校验流程（照 hanson 交接规矩）。

## 6. 里程碑（质量闸门，无日期压力；每个都请 Hanson 实玩验收）

- **M0 地基**：本计划签字 → Met API 拉全部候选藏品数据与 CC0 图，逐件核验许可 → 资产管线跑通（下载/压缩/切图）。
- **M1 空间灰盒**：平面图首页 + 空展厅行走。验收点：视觉方向、手感。
- **M2 垂直切片**：一个房间 + 每种类型各 1 件 + 导览音。验收点：三动作闭环爽不爽、声音样张定版。
- **M3 完整一馆**：全部展品 + 活画 + 旗舰沉浸世界 + 特展柜。
- **M4 打磨**：加载性能（进度条/分块）、手机保底、音效细节 → 部署上线 → 找朋友实测。
- （发 Ted 的时机与材料在 M4 后另议。）

## 7. 风险与坑（提前想好）

- 逐件许可核验不能省：Open Access 图大多 CC0，但 3D 模型与个别摄影另有许可，构建时逐件查并留记录。
- 活画首尾帧接缝：豆包生成后必须检查循环点，必要时 pingpong 处理。
- WebGL 性能：多画框贴图 + 射灯容易爆 draw call；用图集/合并材质，加载分块（vast-land 29MB 单文件的教训）。
- 商标边界：不使用 Met logo、不暗示官方；平面图为自绘风格化版本。
- 手机端只求"能走不崩"，分辨率与贴图质量自动降档。

## 8. 明确不做（v1 范围外）

- 其他馆（Egyptian / American Wing / Armor → v2，平面图上留 "Opening Soon"）
- 实时对话导览（→ v2，接口预留）
- 中英双语、账号系统、社交分享

## 9. 待 Hanson 最终确认的三件事

1. 展品清单草案（§4）——换画/加减直接说。
2. 产品名：暂定 **"The Met, Walkable"**（副题 *A walkable museum of one great wing*），可换。
3. 无其他异议则从 M0 开工。
