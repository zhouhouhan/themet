const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Users/zeroz/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});
try{
  const q=await b.newPage({viewport:{width:960,height:540}});
  q.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,200)));
  await q.goto('http://127.0.0.1:8901/walktest.html');
  await q.waitForFunction(()=>window.__vg,{},{polling:200,timeout:180000});
  const d=await q.evaluate(()=>{
    const out={};
    out.enableToward=__vg.ctrl.enableToward;
    out.boundMouseDown=typeof __vg.input.boundMouseDown;
    out.onMouseDown=typeof __vg.input.onMouseDown;
    out.onMouseMove=typeof __vg.input.onMouseMove;
    out.locked=!!document.pointerLockElement;
    const cv=__renderer.domElement;
    cv.dispatchEvent(new MouseEvent('mousedown',{button:0,clientX:200,clientY:300,bubbles:true}));
    out.dragAfterDown=__vg.input.drag;
    dispatchEvent(new MouseEvent('mousemove',{clientX:400,clientY:300,bubbles:true}));
    out.dragAfterMove=__vg.input.drag;
    dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
    return out;
  });
  console.log(JSON.stringify(d,null,1));
}finally{await b.close()}})();
