// 相机修复验证：角色回画内 + 塔顶仍在 + 移动/边界/退出不回归
const {chromium}=require('playwright-core');
const fs=require('fs'),path=require('path');
const OUT=p=>path.join(__dirname,'../verify-shots',p);
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
(async()=>{
  const b=await chromium.launch({headless:true,executablePath:'C:/Users/zeroz/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});
  try{
    const p=await b.newPage({viewport:{width:960,height:540}});
    const consoleErrs=[];
    p.on('pageerror',e=>consoleErrs.push('PAGEERROR '+String(e).slice(0,160)));
    await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await p.addInitScript(()=>{window.requestAnimationFrame=()=>0});
    await p.goto('http://127.0.0.1:8901/walktest.html');
    await p.waitForFunction(()=>window.__state,{},{polling:200,timeout:180000});
    log('loaded');
    await p.evaluate(()=>{__openExhibit('piazza');__startExperience()});
    await p.waitForFunction(()=>__world().active,{},{polling:250,timeout:540000});
    log('world active');
    await p.evaluate(()=>{for(let i=0;i<160;i++)__tick(1/60)});
    const R={};
    const proj=()=>p.evaluate(()=>{
      const f=__player.getPosition(),v=new (f.constructor)();
      const ndc=(dy)=>{v.set(f.x,f.y+dy,f.z).project(__camera);return [+v.x.toFixed(2),+v.y.toFixed(2)]};
      return {feet:ndc(0),head:ndc(1.5),top:ndc(1.85),cam:__camera.position.toArray().map(x=>+x.toFixed(2)),
        pitchDeg:+(__camera.rotation.x*180/Math.PI).toFixed(1)};
    });
    R.spawn=await proj();
    log('spawn',JSON.stringify(R.spawn));
    await p.screenshot({path:OUT('camera-fix-spawn.jpg'),type:'jpeg',quality:85});
    for(const x of [8,-8]){
      await p.evaluate((x)=>{const c=__player.getPlayerCapsule();c.position.set(x,0.3,__player.getPosition().z);c.updateMatrixWorld(true);__player.playerVelocity.set(0,0,0);for(let i=0;i<5;i++)__tick(1/60)},x);
      R['side'+(x>0?'P':'N')]=await proj();
      log('side x='+x,JSON.stringify(R['side'+(x>0?'P':'N')]));
      await p.screenshot({path:OUT('camera-fix-side'+(x>0?'P':'N')+'.jpg'),type:'jpeg',quality:85});
    }
    R.walk=await p.evaluate(()=>{
      const gl=__renderer.getContext(),errs=[];
      const z0=__player.getPosition().z;
      dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));
      for(let i=0;i<90;i++){__tick(1/60);const e=gl.getError();if(e)errs.push(e);}
      dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
      return {dz:+(__player.getPosition().z-z0).toFixed(2),errs};
    });
    log('walk',JSON.stringify(R.walk));
    R.exit=await p.evaluate(()=>{
      __player.playerVelocity.set(3,0,2);__closeUI();
      const vel=+Math.hypot(__player.playerVelocity.x,__player.playerVelocity.z).toFixed(3);
      const curtain=document.querySelector('[style*="c4c1ae"]');
      return {active:__world().active,vel,curtain:curtain?getComputedStyle(curtain).opacity:'none',state:__state()};
    });
    log('exit',JSON.stringify(R.exit));
    R.consoleErrs=consoleErrs;
    fs.writeFileSync(OUT('camera-fix-2026-09-16.json'),JSON.stringify(R,null,2));
    log('DONE');
  }finally{await b.close()}
})();
