const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Users/zeroz/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});
try{
  const p=await b.newPage({viewport:{width:960,height:540}});
  await p.goto('http://127.0.0.1:8901/walktest.html');
  await p.waitForFunction(()=>window.__state,{},{polling:200,timeout:180000});
  await p.evaluate(()=>{__openExhibit('crown');__startExperience()});
  await p.waitForTimeout(400);
  await p.evaluate(()=>{
    const cv=__renderer.domElement;
    cv.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:400,clientY:300,bubbles:true}));
    dispatchEvent(new PointerEvent('pointermove',{clientX:1000,clientY:300,bubbles:true}));
    dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
  });
  await p.waitForTimeout(1200);
  console.log('crown rotY after swipe (sens default 1.0):', await p.evaluate(()=>__obj().rotY.toFixed(3)));
  await p.screenshot({path:'verify-shots/mouse-fix-crown.jpg',type:'jpeg',quality:85});
  await p.evaluate(()=>__closeUI());
  // 封面署名截图
  await p.goto('http://127.0.0.1:8901/index.html');
  await p.waitForTimeout(1500);
  await p.screenshot({path:'verify-shots/hanson-credit-cover.jpg',type:'jpeg',quality:90});
  console.log('cover shot saved');
}catch(e){console.log('ERR',e.message)}finally{await b.close()}})();
