// Codex 本轮改动综合验收：GL 错误 / 相机构图（角色是否在画内）/ 移动方向 / G 键 / 多轮进出
// 用法：node tools/review-codex-round-0916.cjs   （需 8901 服务）
const {chromium}=require('playwright-core');
const fs=require('fs'),path=require('path');
const OUT=p=>path.join(__dirname,'../verify-shots',p);
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
(async()=>{
  const b=await chromium.launch({headless:true,executablePath:'C:/Users/zeroz/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});
  try{
    const p=await b.newPage({viewport:{width:960,height:540}});
    const consoleErrs=[];
    p.on('console',m=>{if(m.type()==='error')consoleErrs.push(m.text().slice(0,160));});
    p.on('pageerror',e=>consoleErrs.push('PAGEERROR '+String(e).slice(0,160)));
    await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await p.addInitScript(()=>{window.requestAnimationFrame=()=>0});   // 手动驱动帧，结果可复现
    await p.goto('http://127.0.0.1:8901/walktest.html');
    await p.waitForFunction(()=>window.__state,{},{polling:200,timeout:180000});
    log('loaded');
    const R={consoleErrs};

    // ── 画廊基线：60 帧真实渲染 + 误差扫描 + 帧耗时 ──
    R.gallery=await p.evaluate(()=>{
      const gl=__renderer.getContext(),errs=[];
      const t0=performance.now();
      for(let i=0;i<120;i++){__tick(1/60);const e=gl.getError();if(e)errs.push(e);}
      const ms=(performance.now()-t0)/120;
      return {errs,msPerFrame:+ms.toFixed(2),fpsEst:+(1000/ms).toFixed(0)};
    });
    log('gallery baseline',JSON.stringify(R.gallery));

    // ── 进世界 ──
    await p.evaluate(()=>{__openExhibit('piazza');__startExperience()});
    await p.waitForFunction(()=>__world().active,{},{polling:200,timeout:120000});
    log('world active, ticking through intro');
    await p.evaluate(()=>{for(let i=0;i<160;i++)__tick(1/60)});   // 2.4s 运镜 + 余量
    R.intro=await p.evaluate(()=>({intro:__world().intro,camPos:__camera.position.toArray().map(v=>+v.toFixed(2)),
      fov:+__camera.fov.toFixed(1),curtain:getComputedStyle(document.getElementById('worldload')||document.body).opacity==='1'?'??':undefined}));
    log('intro done',JSON.stringify(R.intro));

    // ── 出生点构图：角色（脚/头/头顶）投到屏幕 NDC，|x|>1 或 y<-1 即出画 ──
    const proj=()=>p.evaluate(()=>{
      const f=__player.getPosition(),v=new (f.constructor)();
      const ndc=(dy)=>{v.set(f.x,f.y+dy,f.z).project(__camera);return [+v.x.toFixed(2),+v.y.toFixed(2)]};
      return {feet:ndc(0),head:ndc(1.5),top:ndc(1.85),cam:__camera.position.toArray().map(x=>+x.toFixed(2)),
        pitchDeg:+(__camera.rotation.x*180/Math.PI).toFixed(1),dpr:__renderer.getPixelRatio()};
    });
    R.spawnProj=await proj();
    log('spawn projection',JSON.stringify(R.spawnProj));
    await p.screenshot({path:OUT('codex-review-spawn.jpg'),type:'jpeg',quality:85});

    // ── W 前进：应朝教堂 -z；行进中扫 GL 错（角色全程在渲染） ──
    R.walk=await p.evaluate(async()=>{
      const gl=__renderer.getContext(),errs=[];
      const z0=__player.getPosition().z,x0=__player.getPosition().x;
      dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));
      const t0=performance.now();
      for(let i=0;i<90;i++){__tick(1/60);const e=gl.getError();if(e)errs.push(e);}
      const ms=(performance.now()-t0)/90;
      dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
      const f=__player.getPosition();
      return {dz:+(f.z-z0).toFixed(2),dx:+(f.x-x0).toFixed(2),errs,msPerFrame:+ms.toFixed(2),fpsEst:+(1000/ms).toFixed(0)};
    });
    log('walk W',JSON.stringify(R.walk));

    // ── 侧向极限 x=±8：角色是否还在画内 ──
    for(const x of [8,-8]){
      await p.evaluate((x)=>{const c=__player.getPlayerCapsule();c.position.set(x,0.3,__player.getPosition().z);c.updateMatrixWorld(true);__player.playerVelocity.set(0,0,0);for(let i=0;i<5;i++)__tick(1/60)},x);
      R['side'+(x>0?'P':'N')]=await proj();
      log('side x='+x,JSON.stringify(R['side'+(x>0?'P':'N')]));
      await p.screenshot({path:OUT('codex-review-side'+(x>0?'P':'N')+'.jpg'),type:'jpeg',quality:85});
    }

    // ── G 键画质循环（世界内应 ≤1） ──
    R.gkey=await p.evaluate(()=>{
      const dpr=[];
      for(let i=0;i<4;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'KeyG',bubbles:true}));__tick(1/60);dpr.push(+__renderer.getPixelRatio().toFixed(2));}
      return dpr;
    });
    log('G dpr cycle in world',JSON.stringify(R.gkey));

    // ── 退出：速度清零 / 遮罩清零 / 画廊还原 ──
    R.exit=await p.evaluate(()=>{
      __player.playerVelocity.set(3,0,2);
      __closeUI();
      const out={active:__world().active,vel:+Math.hypot(__player.playerVelocity.x,__player.playerVelocity.z).toFixed(3),
        curtain:document.querySelector('[style*="c4c1ae"]')?getComputedStyle(document.querySelector('[style*="c4c1ae"]')).opacity:'none'};
      const gl=__renderer.getContext(),errs=[];
      for(let i=0;i<30;i++){__tick(1/60);const e=gl.getError();if(e)errs.push(e);}
      out.errs=errs;out.state=__state();
      return out;
    });
    log('exit',JSON.stringify(R.exit));

    // ── 多轮进出（Codex 未完成项）：每阶段落盘，超时前先抓现场 ──
    const partial=f=>fs.writeFileSync(OUT('codex-review-partial.json'),JSON.stringify(R,null,2)+f);
    for(let cycle=2;cycle<=3;cycle++){
      const t0=Date.now();
      await p.evaluate(()=>{__openExhibit('piazza');__startExperience()});
      try{
        await p.waitForFunction(()=>__world().active,{},{polling:250,timeout:240000,
          onSlow:async ms=>{if(ms%30000<300)log(`  cycle${cycle} waiting… ${Math.round(ms/1000)}s`)}});
      }catch(e){
        R['cycle'+cycle]={failed:'enter timeout 240s',diag:await p.evaluate(()=>({world:__world(),state:__state(),
          loadTip:(document.getElementById('worldload')||{}).textContent||null}))};
        log('cycle'+cycle,'ENTER TIMEOUT',JSON.stringify(R['cycle'+cycle].diag));
        partial(',"enterTimeoutCycle'+cycle+'":true}');break;
      }
      const enterS=((Date.now()-t0)/1000).toFixed(1);
      await p.evaluate(()=>{for(let i=0;i<160;i++)__tick(1/60)});
      const gl=await p.evaluate(()=>{const gl=__renderer.getContext(),errs=[];
        for(let i=0;i<120;i++){__tick(1/60);const e=gl.getError();if(e)errs.push(e);}
        __player.playerVelocity.set(2,0,0);__closeUI();
        for(let i=0;i<10;i++){__tick(1/60);const e=gl.getError();if(e)errs.push('exit:'+e);}
        return {errs,vel:+Math.hypot(__player.playerVelocity.x,__player.playerVelocity.z).toFixed(3),active:__world().active};});
      R['cycle'+cycle]={enterSeconds:+enterS,...gl};
      log(`cycle${cycle}`,`enter ${enterS}s`,'errors:',gl.errs.length,'exitVel:',gl.vel,'active:',gl.active);
      partial('');
    }

    R.consoleErrs=consoleErrs;
    fs.writeFileSync(OUT('codex-review-2026-09-16.json'),JSON.stringify(R,null,2));
    log('DONE → verify-shots/codex-review-2026-09-16.json');
  }finally{await b.close()}
})();
