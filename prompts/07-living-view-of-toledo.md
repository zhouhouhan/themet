# 07 · 活画 v2 测试：View of Toledo（埃尔·格列柯, c.1599）

**教训（06 莫奈失败原因）**：运动指令写得太保守（subtle/slow/dreamy），
Seedance 直接理解成"几乎不动"。活画必须有**事件/叙事**，运动动词要强烈。

**首帧图（CC0，直接下载）**：
https://images.metmuseum.org/CRDImages/ep/original/DP349564.jpg
（藏品页 metmuseum.org/art/collection/search/436575，Gallery 619）

## 视频 prompt（贴进 Seedance，图生视频模式）

```text
An oil painting comes ALIVE with dramatic motion — El Greco's "View of
Toledo" (c.1599) turns into a storm timelapse, hand-painted frame by frame.

The dark green storm sky BOILS: heavy clouds race and twist across the sky
like El Greco's elongated forms; pale shafts of light break through and sweep
across the city below; a sudden lightning flash silhouettes the Alcázar
fortress on the hill; the Tagus river flashes and ripples with reflected
storm light; wind ripples hard across the green slopes in the foreground;
the whole city flickers between deep shadow and eerie green light as the
storm passes overhead.

The motion is dramatic and continuous, like a weather timelapse painted by a
master's hand — yet the image ALWAYS stays an oil painting: visible
brushstrokes, El Greco's moody green-black palette, elongated Mannerist
forms.

The camera is completely locked: no zoom, no pan, no shake — the composition
stays exactly like the original painting.

No new objects, no added people, no style change to photograph or 3D render,
no text, no watermark.
```

## 关键操作

1. 时长 **5–8 秒**（不是 10s；戏剧运动短一点更紧）
2. 运动强度/motion 参数**拉到中高**（如果平台有）
3. 首帧 = 上面的 CC0 原图链接下载的高清图
4. 循环接缝：暴风雨类内容首尾难闭合，**允许有缝**，后期用正放+倒放拼 pingpong 必定无缝
5. 挑片标准：云在跑、光在扫、河流在闪、城有明暗节奏；笔触还在；零运镜；没有变成实拍

## 状态

🔄 2026-09-14 出 v2 测试 prompt，等 Hanson 生成回传。
（06 莫奈花园降级为备选——如果后面需要一张"安静呼吸感"的画，用强化版运动词重试）
