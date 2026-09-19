# 遗留问题接手检查 · 2026-09-16

## 本次局部修复
通过逐 draw 的 onAfterRender + gl.getError 定位：入场远景无错，约第 74 帧后玩家进入视野，Ch23_Suit/Shirt/Body/Belt/Pants/Shoes/Eyelashes/Hair 的绘制返回 1282。此时角色 receiveShadow 已为 false。单独关闭世界太阳阴影可消除错误，但本次没有关闭建筑阴影。
在 renderer.compile(scene,camera) 后将蒙皮材质 needsUpdate 置 true，保留预编译和世界静态阴影。推断为预编译后的角色材质采样状态未刷新；没有证明 Three 内部具体根因。修复后首次连续 180 帧未出现 GL 错误。修正 visual-polish.mjs 中将原因定论为油画缓存键的错误注释。
已修改 walkapp/walktest-entry.mjs、walkapp/visual-polish.mjs，并重建 js/walktest-bundle.js。原源文件备份在系统 TEMP/walktest-before-gl-fix.mjs。未修改离线目录、zip、模型或 reference。

## 验证事实
- tools/diagnose-world-gl.cjs：逐 draw 定位工具，会临时变更测试页面状态，不能作为完整验收。
- tools/review-world-gl.cjs：新增真实渲染帧/gl.getError 测试；第一轮 180 帧+退出成功，errors=[]，G 后 DPR=[0.75,1,0.75,1]，退出 velocity=[0,0,0]，world active=false。
- 三轮循环在后续轮次长时间未返回，已手动停止。没有三轮通过结果，不得声称重复进出已通过；需进一步区分自动化/软件渲染阻塞与应用问题。此前较大视口测试也因耗时过长停止。本次不是性能测量。
- 旧 15 项回归未作为本次通过证据，因为 zcoder 已修改特洛伊与相机行为，需要先更新相应断言。

## 交接清单核对
P3：当前 exitWorld 在位置恢复后调用 clearHeldKeys，后者清速度；首轮验证为零。暂不重复改。
P4：当前 G 已钳制世界 DPR<=1，首轮验证为 0.75/1.0，暂不重复改。
P2：源影片烧录 UI 仍需干净素材，未修改。
P5：未使用语音保留，未删除资产。
P6：未改变密钥配置或发布物，不记录密钥值。
P7：真实设备、弱网和跨设备调色仍未测。

## 下一步
先定位 review-world-gl.cjs 后续轮次停滞的位置（重入调用/等待世界激活/帧推进），再验证本次修复重复进出的稳定性。保留当前角色跟随相机及 zcoder 的特洛伊画框内影片，不恢复旧设计。当前仅局部验证，不具备全面验收结论，未部署。
