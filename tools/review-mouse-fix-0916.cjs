// 鼠标修复验证：视角钳制 / 灵敏度键 / 皇冠阻尼 / 封面署名
const {chromium}=require('playwright-core');
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
(async()=>{
  const b=await chromium.launch({headless:true,executablePath:'C:/Users/zeroz/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});
  try{
    const p=await b.newPage({viewport:{width:960,height:540}});
    await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await p.addInitScript(()=>{window.requestAnimationFrame=()=>0;try{localStorage.removeItem('vg-look-sens')}catch(e){}});
    await p.goto('http://127.0.0.1:8901/walktest.html');
    await p.waitForFunction(()=>window.__state,{},{polling:200,timeout:180000});
    await p.evaluate(()=>{for(let i=0;i<5;i++)__tick(1/60)});

    // 1) 视角钳制：setToward(10000,0) 未钳制应转 5.0rad，钳制后 ≈0.024rad
    R1=await p.evaluate(()=>{
      const before={yaw:__camera.rotation.y, pyaw:__player.getPlayerCapsule().rotation.y};
      __player.cam.setToward(10000,0,1e-4);
      const after={yaw:__camera.rotation.y, pyaw:__player.getPlayerCapsule().rotation.y};
      return {dCameraYaw:+(after.yaw-before.yaw).toFixed(4), dPlayerYaw:+(after.pyaw-before.pyaw).toFixed(4),
        wrapped:String(__player.cam.setToward).includes('origSetToward')||String(__player.cam.setToward).length<80};
    });
    log('clamp test',JSON.stringify(R1));

    // 2) 灵敏度键：- 到 0.9 → 再 setToward(10000) 转幅应变小
    await p.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'Minus',bubbles:true}));__tick(1/60)});
    R2=await p.evaluate(()=>{
      const s1=localStorage.getItem('vg-look-sens');
      const before=__player.getPlayerCapsule().rotation.y;
      __player.cam.setToward(10000,0,1e-4);
      return {stored:s1,d:+(__player.getPlayerCapsule().rotation.y-before).toFixed(4)};
    });
    log('sens key',JSON.stringify(R2));

    // 3) 皇冠阻尼：打开 360，猛拖 300px（应被钳到 48×若干事件）
    await p.evaluate(()=>{__openExhibit('crown');__startExperience();__tick(1/60)});
    await p.evaluate(()=>{
      const cv=__renderer.domElement;
      cv.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:400,clientY:300,bubbles:true}));
      for(let x=700;x<=2200;x+=300) dispatchEvent(new PointerEvent('pointermove',{clientX:x,clientY:300,bubbles:true}));
      dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
    });
    R3=await p.evaluate(()=>{
      const seq=[];
      for(let i=0;i<30;i++){__tick(1/60);if(i%6===0)seq.push(+__obj().rotY.toFixed(3));}
      return {seq,target:+__obj().rotY.toFixed(3),active:__obj().active};
    });
    log('crown damp sequence(rotY over 30 frames)',JSON.stringify(R3));
    await p.screenshot({path:'verify-shots/mouse-fix-crown.jpg',type:'jpeg',quality:85});
    await p.evaluate(()=>{__closeUI();__tick(1/60)});

    // 4) 恢复 + err
    R4=await p.evaluate(()=>({state:__state(),err:window.__err||null}));
    log('final',JSON.stringify(R4));
  }finally{await b.close()}
})();
let R1,R2,R3,R4;
