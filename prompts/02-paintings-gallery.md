# 02 · 欧洲绘画馆长厅（核心玩法空间）· v2

**v2 变更（2026-09-14，Hanson 定）**：
1. **中央加入皇冠玻璃展柜**（单馆 demo：皇冠并入油画馆，原 03 特展柜厅暂缓，William 押后）
2. **三角度出图**：A 正向纵深（已达标）/ B 反向入口 / C 斜角双墙——提高图生 3D 准确度

**多角度规矩**：B、C 必须在 A 的**同一对话**里生成（先贴 A 的成品图再说 "same
gallery"），否则会生成另一个馆。每个角度都要故事版+干净版两版。

## 角度 A · 正向纵深（v2 更新版，重出或沿用旧图+局部指令）

```text
Photorealistic cinematic concept art of a grand long gallery room in the
European Paintings wing of a great art museum, faithful to The Metropolitan
Museum of Art's second-floor skylit European galleries (the 600s and 800s
rooms).

Subject in foreground: a 16-year-old East Asian male student, seen ONLY from
behind — short black hair, dark charcoal hoodie, small navy backpack, holding
a slim pocket audio-guide device in one hand, standing relaxed with a slight
forward lean, like a young guide leading the way.

The gallery around him: a long rectangular hall with a high coved ceiling and
soft skylight glow from above, deep burgundy-red walls, a row of large
gilt-framed paintings hung at eye level on both walls — every canvas shows
only a soft abstract field of muted color (placeholder, no real artworks, no
detail), a slim white blank label card beside each frame, dark wood parquet
floor with soft reflections, two simple dark leather benches. AT THE CENTER
of the gallery stands a tall freestanding glass display vitrine, lit from
within by a focused museum spotlight, holding a small baroque gold crown set
with clusters of emeralds that catch the light — the vitrine is the visual
centerpiece, its light pool reflecting on the parquet floor. Warm accent
spotlights wash each painting in a gentle pool of light, quiet museum
atmosphere.

Camera: cinematic over-the-shoulder third-person shot — camera just behind
and slightly above the student's shoulder; his back occupies the lower-center
third of the frame while the long gallery stretches ahead in strong
one-point perspective, the glowing crown vitrine on the central axis,
paintings receding symmetrically on both sides.

Style: 16:9 widescreen, photorealistic architectural visualization,
ultra-detailed, warm elegant color grading. IMPORTANT: no readable text
anywhere — labels and signs are blank.
```

（若沿用已达标的旧图：同对话贴旧图 + "Add a tall freestanding glass vitrine
with a gold and emerald crown at the center of this gallery, lit from
within, keep everything else identical."）

## 角度 B · 反向入口视角（在 A 的同一对话里）

```text
Using the attached gallery image as the exact same room, generate the reverse
viewpoint: the camera now stands at the far end of the gallery looking back
toward the entrance — same deep burgundy walls, same row of gilt-framed
paintings with abstract placeholder canvases and blank white label cards on
both walls, same dark wood parquet floor with soft reflections, same leather
benches, same skylight glow from above. The central glass vitrine with the
gold-and-emerald crown is now seen from the far side in the middle distance,
still lit from within. The same 16-year-old student (dark charcoal hoodie,
navy backpack, audio-guide device) stands far away near the entrance with his
back to us, small in frame. Same camera height, same warm lighting, strong
one-point perspective back down the gallery. 16:9, photorealistic, no
readable text.
```

## 角度 C · 斜角双墙视角（在 A 的同一对话里）

```text
Using the attached gallery image as the exact same room, generate an oblique
corner view: the camera stands inside the gallery at 45 degrees, showing two
walls meeting — the long wall of gilt-framed paintings receding to the left,
the end wall with one large framed painting to the right, the central glass
vitrine with the gold-and-emerald crown prominent in the right foreground,
its internal spotlight glowing, a leather bench in the mid-frame, skylight
above. The same 16-year-old student (dark charcoal hoodie, navy backpack,
audio-guide device) is seen from behind at the left third of the frame,
facing the long wall of paintings. Strong diagonal composition, same
materials and warm lighting as the original. 16:9, photorealistic, no
readable text.
```

## 干净版指令（每个角度各用一次，同对话追加）

```text
Now generate the exact same scene from the same camera position, but with the
student completely removed — an empty, people-free clean plate of the
gallery.
```

## 挑图标准（三角度通用）

- 三张图是**同一个厅**：墙色、地板、长椅、天窗、画框排布一致；皇冠柜都在中轴/前景
- 画框内容是抽象色块占位；白色小展签空白
- A 角中轴笔直；B 角能看到入口方向纵深；C 角双墙+柜的斜线构图成立
- 皇冠柜内部打亮、地面有光池反射
- 零文字
