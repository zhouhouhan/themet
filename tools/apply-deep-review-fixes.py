from pathlib import Path
p=Path(r'\\192.168.31.246\Media\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery\walkapp\walktest-entry.mjs');s=p.read_text(encoding='utf-8')
s=s.replace('  player.onAllEvent();','  player.input.buildKeyMap({toggleVehicle:null});\n  player.onAllEvent();')
s=s.replace('    if (!uiOpen || !GAME_KEY_CODES.has(ev.code)) return;','''    if (ev.target instanceof Element && ev.target.closest('input,textarea,[contenteditable="true"]')) return;
    if ((uiOpen || worldRoot?.visible) && ['KeyF','KeyV'].includes(ev.code)) {ev.preventDefault();ev.stopImmediatePropagation();return;}
    if (!uiOpen || !GAME_KEY_CODES.has(ev.code)) return;''')
s=s.replace('if (ev.code === "KeyA" && uiOpen === "focus")','if (!ev.repeat && ev.code === "KeyA" && uiOpen === "focus")')
s=s.replace('  function clearHeldKeys() {','  function clearHeldKeys() {\n    player.input.resetKeys();\n    player.playerVelocity.set(0,0,0);')
s=s.replace('  function openInfo(e) {\n    current = e;','  function openInfo(e) {\n    clearHeldKeys();\n    current = e;')
s=s.replace('    if (e.normal.x > 0.5) plane.rotation.y = Math.PI / 2;\n    else if (e.normal.x < -0.5) plane.rotation.y = -Math.PI / 2;','    plane.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), e.normal);')
s=s.replace('    if (ev.code === "KeyQ") { togglePipChat();', '    if (ev.repeat && ["KeyQ","KeyE","KeyG","Enter","NumpadEnter"].includes(ev.code)) return;\n    if (ev.code === "KeyQ") { togglePipChat();')
s=s.replace('      dprNow = dprCap;\n      renderer.setPixelRatio(dprNow);','      if (worldRoot?.visible) dprCap=Math.min(dprCap,1);\n      dprNow = dprCap;\n      renderer.setPixelRatio(dprNow);')
s=s.replace('  let worldRoot = null, worldLoadToken = null, worldIntro = null, worldSun = null;','  let worldRoot = null, worldPromise = null, worldLoadToken = null, worldIntro = null, worldSun = null;')
s=s.replace('    return gltfLoader.loadAsync(PIAZZA.src,','    if (worldPromise) return worldPromise;\n    worldPromise = gltfLoader.loadAsync(PIAZZA.src,')
s=s.replace('      return root;\n    });\n  }','      return root;\n    }).finally(() => { worldPromise=null; });\n    return worldPromise;\n  }')
s=s.replace('      if (token.cancelled) { worldStatus.style.display = "none"; return; }','      if (token.cancelled || worldLoadToken !== token) return;')
s=s.replace('      worldSaved.fov = camera.fov;','      worldSaved.fov = camera.fov;\n      worldSaved.toneMapping=renderer.toneMapping;\n      worldSaved.controlsEnabled=controls.enabled;\n      worldSaved.controlsTarget=controls.target.clone();\n      worldSaved.isFlying=player.isFlying;\n      player.isFlying=false;')
s=s.replace('    renderer.toneMappingExposure = worldSaved.exposure;', '    renderer.toneMapping=worldSaved.toneMapping;\n    renderer.toneMappingExposure = worldSaved.exposure;')
s=s.replace('    controls.enabled = true;\n    const cap', '    controls.enabled = worldSaved.controlsEnabled;\n    controls.target.copy(worldSaved.controlsTarget);\n    player.isFlying=worldSaved.isFlying;\n    const cap')
s=s.replace('      renderer.toneMappingExposure = 1.28;', '      renderer.toneMapping=THREE.AgXToneMapping;\n      renderer.toneMappingExposure = 1.2;')
# Audio lifecycle: cancelling while loading must invalidate eventual playback.
a=s.index('  const audioBuffers = new Map();');b=s.index('  function playIntroQueue',a)
s=s[:a]+'''  const audioBuffers = new Map();
  let audioTicket=0;
  async function loadSound(id) {
    if (!audioBuffers.has(id)) {
      const pending=fetch(AUDIO_BASE+id+".wav").then(res=>{if(!res.ok)throw new Error("audio "+res.status);return res.arrayBuffer();}).then(data=>audioListener.context.decodeAudioData(data)).catch(err=>{audioBuffers.delete(id);throw err;});
      audioBuffers.set(id,pending);
    }
    return audioBuffers.get(id);
  }
  function stopAudio() {
    ++audioTicket;
    try { if(positional.isPlaying)positional.stop(); } catch {}
    speaking=false;currentAudioId=null;
  }
  async function playAudio(id,onEnd) {
    stopAudio();
    const ticket=audioTicket;currentAudioId=id;
    try {
      if(audioListener.context.state==="suspended")await audioListener.context.resume();
      const buf=await loadSound(id);
      if(ticket!==audioTicket)return;
      positional.setBuffer(buf);
      positional.onEnded=()=>{
        positional.isPlaying=false;
        if(ticket!==audioTicket)return;
        speaking=false;currentAudioId=null;if(onEnd)onEnd();
      };
      positional.play();speaking=true;
    } catch(e) {
      if(ticket!==audioTicket)return;
      speaking=false;currentAudioId=null;if(onEnd)onEnd();
    }
  }
'''+s[b:]
s=s.replace('    if (pipChat.open) {','    clearHeldKeys();\n    if (pipChat.open) {')
s=s.replace('    if (!uiOpen && worldRoot?.visible) {\n      player.update();','    if (!uiOpen && worldRoot?.visible) {\n      if (!pipChat.open) player.update();').replace('    } else if (!uiOpen) {\n      player.update();','    } else if (!uiOpen) {\n      if (!pipChat.open) player.update();')
s=s.replace('  // ── 调试钩子 ──','  // ── 调试钩子 ──\n  window.__reviewAudio=()=>({id:currentAudioId,playing:positional.isPlaying,ticket:audioTicket});')
s=s.replace('every artwork is a real Met collection object shown at true size','the artworks are drawn from the Met collection and arranged in an interpretive virtual setting')
p.write_text(s,encoding='utf-8')