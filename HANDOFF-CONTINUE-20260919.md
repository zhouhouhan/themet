# 交接文档 · vgallery 3D 博物馆（2026-09-19 12:30）

> 写给新窗口/新会话的接续说明。旧主窗口「新建3D博物馆项目」（sess_9589b816-ffc8-4e8a-94bf-39f968f77d03）因对话历史超过 50MB 请求上限、compact 连续失败而卡死。本文档 + `.handoff-extract-20260919.md`（164 条用户消息与全部助手结论的原文提取，87KB）即为其完整上下文备份。

## 一、旧窗口怎么了 & 修复了什么

**根因**：会话从 9/13 用到 9/19，Browser Use / node_repl 每次调用的截图 base64 直接存在数据库 part 里（212 次浏览器调用 + 大量 Edit 输出），历史膨胀到 ~20MB 文本 + ~30MB 内联图片，打包成请求超过服务商 50MB 上限。compact 本身也要发送全部历史，因此从 9/15 起连续 6 次失败（09-15×4、09-19×2），会话彻底无法推进。

**已做修复（2026-09-19 12:30，ZCode 主会话）**：
1. 先全量备份：`C:/Users/zeroz/.zcode/cli/db/db.sqlite.backup-before-trim-20260919`（469MB）。如需还原：关闭 ZCode → 用备份覆盖 `C:/Users/zeroz/.zcode/cli/db/db.sqlite`。
2. 对该会话在 DB 中做了两遍修剪：截断超长工具输入/输出（保留头部+截断标记）、递归清除全部 base64 图片数据、剥离旧消息的图片附件引用。**所有正文文字、推理、最近工作内容原样保留**。
3. 体积：part 18.2MB → **5.43MB**（+ message 1.4MB ≈ 共 7MB），JSON 完整性已校验（4391 个 part 全部可解析）。

**复活步骤（按顺序做）**：
1. **完全关闭**卡住的旧窗口（建议退出整个 ZCode 应用——旧窗口内存里还是大历史，不要在里面点重试，会再次失败且可能把旧状态写回 DB）。
2. 重开 ZCode → 会话历史 → 找到「新建3D博物馆项目」→ 恢复。
3. 恢复后**立即手动 `/compact`**——现在请求约 7-10MB，应能成功。成功后旧会话即可正常继续。
4. 若摘要后细节有损，用本文档和 `.handoff-extract-20260919.md` 补课。

## 二、项目快照

**是什么**：梵高/大都会主题的网页 3D 第一人称博物馆（Three.js），有第三人称角色、13+ 件可交互展品（信息卡/语音导览/画框内活画视频/全屏沉浸影片/皇冠 360°/Pip 伴随精灵 + DeepSeek AI 问答）。

**架构要点**：
- 源码母版 `walkapp/walktest-entry.mjs` → esbuild 打包成 `js/walktest-bundle.js`（~950KB）。**改源码后必须重建 bundle**，不要直接改 bundle 或把 walktest.html 换成静态预览页。
- `walktest.html` 是验收入口；`index.html` 是封面+展厅地图入口流程（AI 底图 + HTML 交互层）；`dragtest.html` 是拖拽视角自检页（10 项断言）。
- 画廊模型 `assets/models/gallery-v6.glb`（53MB，Blender 母版 `assets/models/blender/gallery-v6.blend`，工具在 `tools/`）；麦田世界 `assets/models/worlds/wheat-world.glb`（高斯点云转面片，~45MB）。
- `js/ai-config.js` 内含 DeepSeek key（已随线上公开，择期轮换 + 挪到服务端代理）。
- 本地起服务用 `start.bat`；验证截图在 `verify-shots/`。

**部署**：线上 `https://molin.wiki/hanson/vgallery/`（ubuntu@<SERVER-IP>，`/opt/molin-wiki/frontend/dist/hanson/vgallery/`）。规矩：SSH stdin（`cat | ssh "cat >"`）+ 逐文件 md5 核对，不用 scp。**09-19 拖拽视角版本已部署上线**。

**文档索引**：`V6-REPAIRS.md`（按日期的完整修复日志，最新到 09-19 拖拽合并）、`PLAN.md`、`WHEAT-WORLD-EXPORT.md`、`DEEP-REVIEW-2026-09-15.md`、`HANDOFF-OPEN-ISSUES-TO-CODEX-2026-09-16.md`。

## 三、当前进行到哪（中断点）

09-19 上午完成「按住左键拖动才转视角（GTA 式）」合并（`__vgLookScale`/`__vgAutoSpin` 等运行时约定兼容另一台电脑的 workbuddy 补丁）、皇冠 360° 阻尼、`-`/`=` 灵敏度键（localStorage `vg-look-sens`）。dragtest 10/10 通过，离线包 `vgallery-offline-2026-0919-1127.zip`（100MB）+ 增量包 `vgallery-patch-draglook-20260919.zip`，已同步线上。

**中断时正在做的事**：子任务「Playwright 验证麦田展品交互与视角还原」（sess_587ee8e8-8698-4507-a143-4d5694742652）——用真实键盘走路验证《麦田与丝柏》信息卡（world 类型）打开/关闭时相机位置还原、E 键交互、高亮提示。用户贴出的失败日志里那段 page 代码就是该验证脚本，因主会话 compact 崩溃而中断。验证结果未知，**下一步 = 重跑该验证**（打开麦田卡→截图→E 关闭→确认视角还原→WASD 走路位移→《收获者》高亮提示）。

## 四、待办与已知事项

- [ ] 重跑麦田展品 Playwright 验证（见上）
- [ ] 世界模式退出瞬间角色残余滑行 ~0.3m（传送未清物理速度，待 polish）
- [ ] trojan 视频内烙印叠层是否裁切/重出干净版（可选）
- [ ] ai-config.js 的 DeepSeek key 移到后端代理并轮换（上线公开后遗留）
- [ ] 资产瘦身 + Tauri exe 打包（可选）
- [ ] 逐方向人工行走碰撞测试未做（绒绳碰撞 z=±11.4 已注册）
- [ ] 防复发：这个项目截图验证频繁，**每隔一两天主动 /compact**，别等撑爆（今后 compact 应该能成功了，但历史仍会持续增长）
