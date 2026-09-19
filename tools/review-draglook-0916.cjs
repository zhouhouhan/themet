// drag-look 合并验证：dragtest 自检页 + 拖拽行为 + 皇冠阻尼
const {chromium}=require('playwright-core');
const log=(...a)=>console.log(...a);
(async()=>{
  const b=await chromium.launch({headless:true,executablePath:'C:/Users/zeroz/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});
  try{
    // ── 1) dragtest 自检页 ──
    const p=await b.newPage({viewport:{width:1100,height:800}});
    await p.goto('http://127.0.0.1:8901/dragtest.html');
    await p.waitForFunction(()=>{const s=document.getElementById('status');return s&&s.textContent.startsWith('完成')},{},{polling:500,timeout:240000});
    const rep=await p.evaluate(()=>document.getElementById('report').value);
    log('=== dragtest ===');log(rep);
    await p.close();

    // ── 2) walktest.html 直接行为验证 ──
    const q=await b.newPage({viewport:{width:960,height:540}});
    await q.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await q.goto('http://127.0.0.1:8901/walktest.html');
    await q.waitForFunction(()=>window.__vg,{},{polling:200,timeout:180000});
    const drag=await q.evaluate(async()=>{
      const out={};
      const cv=__renderer.domElement,yaw=()=>__camera.rotation.y;
      // 按住左键拖 300px → 相机应转；未按键移动鼠标 → 不转
      const y0=yaw();
      cv.dispatchEvent(new MouseEvent('mousedown',{button:0,clientX:200,clientY:300,bubbles:true}));
      dispatchEvent(new MouseEvent('mousemove',{clientX:500,clientY:300,buttons:1,bubbles:true}));
      out.dragging=__vg.input.drag;
      out.afterDrag=+(yaw()-y0).toFixed(4);
      dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
      out.afterUp=__vg.input.drag;
      const y1=yaw();
      dispatchEvent(new MouseEvent('mousemove',{clientX:800,clientY:300,buttons:1,bubbles:true}));
      out.afterFreeMove=+(yaw()-y1).toFixed(4);
      // 极端尖峰：单事件 5000px 应被钳到 140px×scale×sens×lookSens
      cv.dispatchEvent(new MouseEvent('mousedown',{button:0,clientX:100,clientY:300,bubbles:true}));
      const y2=yaw();
      dispatchEvent(new MouseEvent('mousemove',{clientX:5100,clientY:300,buttons:1,bubbles:true}));
      dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
      out.spikeClamped=+(yaw()-y2).toFixed(4);
      out.spikeExpect=+( -140*__vgLookScale*__vg.cam.sensitivity).toFixed(4);
      return out;
    });
    log('=== drag behavior ===',JSON.stringify(drag));

    // 3) 皇冠：打开 + 猛拖 → 阻尼收敛；自动旋转默认关（静置 3s 不自转）
    const crown=await q.evaluate(()=>{
      __openExhibit('crown');__startExperience();
      const cv=__renderer.domElement;
      cv.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:400,clientY:300,bubbles:true}));
      dispatchEvent(new PointerEvent('pointermove',{clientX:800,clientY:300,buttons:1,bubbles:true}));
      dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
      const t1=__obj().rotY;
      for(let i=0;i<20;i++)__tick(1/60);
      return {t1:+t1.toFixed(3),t20:+__obj().rotY.toFixed(3),autoSpin:window.__vgAutoSpin,ui:__state().uiOpen};
    });
    log('=== crown ===',JSON.stringify(crown));
    await q.evaluate(()=>__closeUI());
    log('=== err ===',await q.evaluate(()=>window.__err||'null'));
  }finally{await b.close()}
})();
