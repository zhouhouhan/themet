# 06 · 活画测试：Garden at Sainte-Adresse（莫奈, 1867）

**管线**：Met CC0 原图作首帧 → Seedance 图生视频 → 无缝循环 mp4 → 画框内播放
**取图**：metmuseum.org 搜 "Garden at Sainte-Adresse" → Open Access 下载高清原图
（或 Wikimedia Commons，同为 CC0）。分辨率/比例按原图设置。

## 视频 prompt（贴进 Seedance，图生视频模式）

```text
A hand-painted impressionist oil painting slowly comes to life, keeping the
exact style of Claude Monet's visible thick impasto brushstrokes.

The scene is a sunny seaside garden terrace in the 1860s: gentle waves ripple
and sparkle across the sea, two small sailboats drift slowly along the horizon,
the flags on the terrace flutter softly in the sea breeze, red flowers in the
foreground sway gently, the seated figures stay completely still like posed
portraits, sunlight flickers subtly on the water.

All motion is subtle, slow and dreamy — the painting breathes, it never becomes
a photograph. The camera is completely locked: no zoom, no pan, no shake, the
composition stays exactly like the original painting.

Preserve the original painterly texture, colors and brushwork at all times.
No new objects, no people walking, no style change, no text, no watermark.
Seamless 5-second loop.
```

## 关键操作要点

1. **必须图生视频**（首帧 = 原画高清图），不要文生视频——否则画不像。
2. 若平台支持"首尾帧"，把同一张图同时设为首帧和尾帧，循环天然闭合；
   不支持就生成后检查首尾帧差异，必要时正放+倒放拼 pingpong 循环。
3. 运动幅度参数（motion strength）调低；时长 5s。
4. 挑图标准：笔触还在、旗帜和海在动、人物没动、没有运镜、没变成实拍感。

## 状态

🔄 2026-09-14 出测试 prompt，等 Hanson 生成回传。
