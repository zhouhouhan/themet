# vgallery · 场景概念图总表与统一规范

**日期：** 2026-09-14 · **管线：** 文字 prompt（本目录）→ ChatGPT 出概念图 → 干净版喂图生 3D → GLB 进 three.js

## 工作流规矩

1. **每张出两版**：故事版（带学生导览员，定调用）+ 干净版（无人，图生 3D 用——人留在图里会被烤成几何体）。
2. **概念图里不画名画**：画框留空/抽象色块占位，真实 CC0 原图由引擎上贴图。
3. **画面零文字**：AI 烤字必错字，所有标识牌写 blank。
4. 图生 3D 挑选标准：地面平整连续、纵深轴清晰、中景不杂乱（利于几何生成）。
5. 每次先出 1 张测试，对齐风格后再批量出其余。

## 统一块（每张 prompt 复用，保证系列一致性）

- **人物块**：a 16-year-old East Asian male student, seen ONLY from behind —
  short black hair, dark charcoal hoodie, small navy backpack, holding a slim
  pocket audio-guide device in one hand, standing relaxed with a slight forward
  lean, like a young guide leading the way.
- **镜头块**：cinematic over-the-shoulder third-person shot — camera just behind
  and slightly above the student's shoulder; his back occupies the lower-center
  third of the frame while the scene opens up ahead along a strong one-point
  perspective depth axis.
- **风格块**：16:9 widescreen, photorealistic architectural visualization,
  ultra-detailed, warm elegant color grading, quiet museum atmosphere.
  IMPORTANT: no readable text anywhere — all signs and wayfinding boards are blank.

## 场景清单（v1 共 5 张概念图 × 2 版）

| # | 场景 | 文件 | 用途 | 状态 |
|---|---|---|---|---|
| W | 世界总设定（主视觉） | `00-world.md` | 定调图/对外介绍 | 🔄 新出，可生成 |
| 0 | Great Hall 大厅 | `01-great-hall.md` | 平面图点入后的落点；导览开场、选路 | ✅ 概念图达标，待图生3D |
| 1 | 欧洲绘画馆长厅 | `02-paintings-gallery.md` | 核心玩法空间 v2：**中央皇冠玻璃柜 + 三角度**（A正向/B反向/C斜角） | 🔄 v2 待生成（单馆 demo 核心） |
| 2 | ~~特展展柜厅~~ | `03-object-vitrine.md` | ⏸ 暂缓：皇冠并入油画馆中央柜，William 押后 | 暂缓 |
| 3 | ~~Wheat Field 沉浸世界~~ | `04-wheat-field.md` | ❌ 弃用：太简单不震撼（梵高转活画候选） | 弃 |
| 4 | ~~Harvesters 沉浸世界~~ | `05-harvesters.md` | ❌ 弃用：转活画（见 08） | 弃 |
| 5 | 沉浸①Piazza San Marco（Canaletto, G644） | `09-immersive-piazza-san-marco.md` | 旗舰沉浸：圣马可广场 | 🔄 待生成（原画已备） |
| 6 | 沉浸②Trojan Women（Claude Lorrain, G623） | `10-immersive-trojan-women.md` | 第二沉浸：燃烧的特洛伊舰队 | 🔄 待生成（原画已备） |

**当前 demo 范围（Hanson 2026-09-14 定）**：油画馆 + 中央皇冠柜先行，做通单馆
demo 再细化；大厅/沉浸世界随后。

**沉浸候选备胎**：Panini《Ancient Rome》/《Modern Rome》(G627, CC0)——"画中画廊"
的 meta 概念（走进一幅"挂满罗马风景的画廊"），题材巧但视觉冲击弱于上两者。

活画（莫奈 ×2 + 托莱多）走 Seedance/豆包视频管线，不需要场景概念图。

| # | 活画 | 文件 | 状态 |
|---|---|---|---|
| L1 | View of Toledo（埃尔·格列柯，G619） | `07-living-view-of-toledo.md` | 🔄 测试中（叙事暴风雨版） |
| L2 | The Harvesters（勃鲁盖尔，G638） | `08-living-harvesters.md` | 🔄 v2 故事版待生成（v1 竖屏+无故事，弃） |
| L3 | 备选：Wheat Field with Cypresses（梵高漩涡天空） | 待出（复用 07/08 模板） | 等 L1/L2 校准 |

**注意**：活画生成前必须在工具里选**横屏**比例（16:9/4:3）——Garden 首测和
Harvesters v1 都吃过竖屏亏。华盛顿渡河（美国翼）留 v2。

**展柜 3D 旋转件原图（CC0，已存 `assets/objects/`）**：
- 皇冠 `crown-of-the-andes.jpg`（**美国翼 G626**，API 修正；跨馆借展逻辑不变）
- William `william-hippo.jpg`（埃及馆 G111）

## 迭代记录

- 2026-09-14：定规范 + 出 01 Great Hall 场景测试 prompt + 06 莫奈活画测试 prompt，等 Hanson 出图/出片回传对齐。
- 2026-09-14（晚）：**单馆 demo 上线**——Hanson 的 PLY 网格（Open3D 重建，44万顶点）经
  Blender 清理/减面(34万面)/补端墙地板/加中央皇冠玻璃柜 → `gallery-v1.glb`(11MB) →
  three.js 页面 → 部署 **https://molin.wiki/hanson/vgallery/** ✅（8.5/10）。
  部署坑：GLB 相对路径必须平铺（页面与 assets 同级），不能用 `../`。
- 2026-09-14（深夜 v2→v3）：v1 减面太狠（顶点色网格减面=抹纹理）→ v2 全量 26.5MB 仍被
  判"粗糙"（顶点色天花板）→ **v3 程序化重建**：干净几何 + 8 幅真 CC0 原画上墙
  （piazza/wheat/trojan/harvesters/vermeer/toledo/aristotle/degas）+ 金框 + 射灯 +
  壁柱 + 天窗带 + 皇冠柜 → `gallery-v3.glb` **3.4MB**，线上 9.5/10 ✅。
  **教训：生成网格（顶点色）永远到不了商业质感；正路=程序化几何+真图贴图。**
  ⚠️ 许可：莫奈一批（Garden at Sainte-Adresse、睡莲等）Met API 标 isPublicDomain=false，
  全部弃用；墙上 8 幅全部逐件 API 核验过 CC0。
