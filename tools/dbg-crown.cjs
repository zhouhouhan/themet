const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Users/zeroz/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});
try{
  const q=await b.newPage({viewport:{width:960,height:540}});
  await q.goto('http://127.0.0.1:8901/walktest.html');
  await q.waitForFunction(()=>window.__vg,{},{polling:200,timeout:180000});
  const d=await q.evaluate(()=>{
    __openExhibit('crown');__startExperience();
    const st={ui:__state().uiOpen, canvas:!!__renderer.domElement};
    const cv=__renderer.domElement;
    cv.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:400,clientY:300,bubbles:true}));
    st.afterDown={objDragging:(typeof objDragging!=='undefined')?'?':'?'};   // 闭包外读不到，用行为探
    dispatchEvent(new PointerEvent('pointermove',{clientX:800,clientY:300,buttons:1,bubbles:true}));
    st.t1={rotY:__obj().rotY,tRotY:undefined};
    for(let i=0;i<20;i++)__tick(1/60);
    st.t2={rotY:__obj().rotY};
    // 直接探测：pivot 是否在转
    st.pivot=__obj();
    return st;
  });
  console.log(JSON.stringify(d));
}catch(e){console.log('ERR',e.message)}finally{await b.close()}})();
