from pathlib import Path
r=Path(r'\\192.168.31.246\Media\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery');p=r/'walkapp/walktest-entry.mjs';s=p.read_text(encoding='utf-8-sig')
s=s.replace('assets/models/gallery-v5.glb','assets/models/gallery-v6.glb')
a=s.index('  // ── 无画的那面');b=s.index('  // ── 展品：',a);s=s[:a]+'''  // Entrance architecture is authored in v6; do not add another blocking red panel.
  const entranceRecords = await fetch('assets/paintings/met-originals/entrance-v6.json').then(r => { if (!r.ok) throw new Error('Entrance collection metadata failed'); return r.json(); });
  for (const rec of entranceRecords) ART_BY_MET_ID[String(rec.objectID)] = {
    id: 'met-' + rec.objectID, tex: null, title: rec.title, artist: rec.artistDisplayName,
    date: rec.objectDate, gallery: rec.department, desc: '', medium: '', credit: '', dims: ''
  };
''' +s[b:]
s=s.replace('else normal = new THREE.Vector3(0, 0, 1);','else normal = new THREE.Vector3(0, 0, center.z > 0 ? -1 : 1);')
s=s.replace('crownNode.scale.multiplyScalar(sReal);','crownNode.scale.multiplyScalar(sReal);\n      crownNode.updateMatrix();')
s=s.replace('crownNode.position.y += b0.min.y - b1.min.y;', 'crownNode.position.y += b0.min.y - b1.min.y;\n      crownNode.updateMatrix();')
anchor='  // ── 皇冠改为真实尺寸'
insert='''  // Passage views extend beyond the visitor boundary; the velvet ropes mark it.
  for (const z of [-11.4, 11.4]) addProxy('proxy_rope_boundary_' + z, 3.1, 10, .18, 0, 5, z);
  for (const x of [-34, 34]) addProxy('proxy_world_edge_x' + x, .6, 80, 70, WORLD_OFFSET + x, 35, 0);
  for (const z of [-30, 30]) addProxy('proxy_world_edge_z' + z, 70, 80, .6, WORLD_OFFSET, 35, z);
  // A few dim pools preserve the sightline through the modelled corridor portals.
  for (const sign of [-1, 1]) for (const distance of [15, 21, 27]) {
    const pool = new THREE.PointLight(0xffdcac, 18, 9, 2);
    pool.position.set(0, 3.9, sign * distance); scene.add(pool);
  }

'''
s=s.replace(anchor,insert+anchor)
s=s.replace('0.4, 6, 24.6, -6.2, 3, 0','0.4, 10, 24.6, -6.2, 5, 0').replace('0.4, 6, 24.6, 6.2, 3, 0','0.4, 10, 24.6, 6.2, 5, 0')
a=s.index('  // ── type3 占位画中世界');b=s.index('  // ── 交互 UI',a)
s=s[:a]+'''  // Wheat GLB is authored at runtime scale and height. Do not normalize its sky bounds.
  const worldRoot = new THREE.Group(); worldRoot.name = 'Wheat world';
  worldRoot.position.set(WORLD_OFFSET, 0, 0); worldRoot.visible = false; scene.add(worldRoot);
  let currentWorldColor = new THREE.Color(0xa8c4dd);
  const WORLD_GLB = { wheat: { url: 'assets/models/worlds/wheat-world.glb', sky: 0xa8c4dd, spawn: [0, .15, 0] } };
  let worldMesh = null, worldMeshReady = false, worldPromise = null, worldTicket = 0;
  let savedWorldEnvironment = null;
  const WORLD_LIGHT = new THREE.HemisphereLight(0xcfe0ff, 0x6b5f3e, 1.5);
  const WORLD_SUN = new THREE.DirectionalLight(0xfff2d8, 1.3);
  WORLD_SUN.position.set(WORLD_OFFSET + 40, 70, 30);
  WORLD_LIGHT.visible = WORLD_SUN.visible = false; scene.add(WORLD_LIGHT, WORLD_SUN);
  async function preloadWorld(id) {
    if (worldMeshReady) return worldMesh;
    if (worldPromise) return worldPromise;
    const cfg = WORLD_GLB[id]; if (!cfg) throw new Error('This painting has no world asset');
    worldPromise = gltfLoader.loadAsync(cfg.url, ev => {
      window.__worldProgress = ev.total ? Math.round(ev.loaded / ev.total * 100) : 0;
      const label = document.getElementById('worldcap');
      if (label && label.dataset.loading === 'true') label.textContent = 'ENTERING THE PAINTING — ' + window.__worldProgress + '% · E TO CANCEL';
    }).then(g => {
      const obj = g.scene;
      obj.traverse(o => {
        if (!o.isMesh) return;
        if (o.userData.unlit_source_color || o.name.startsWith('WHEAT_SURFELS')) {
          const old = o.material;
          o.material = new THREE.MeshBasicMaterial({map: old.map, vertexColors: true, side: THREE.DoubleSide, alphaTest: .25, transparent: false, depthWrite: true, toneMapped: false});
          o.material.name = 'Wheat baked source colour';
          o.frustumCulled = true;
        }
      });
      worldRoot.add(obj); worldRoot.updateMatrixWorld(true);
      worldMesh = obj; worldMeshReady = true;
      window.__worldReady = {wheat:true}; window.__worldError = null;
      return obj;
    }).catch(error => { window.__worldReady = {wheat:false}; window.__worldError = String(error.message || error); throw error; })
      .finally(() => {worldPromise = null;});
    return worldPromise;
  }
  function showWorld(id) {
    savedWorldEnvironment = {background: scene.background, fog: scene.fog, environment: scene.environment, lights: []};
    scene.traverse(o => { if(o.isLight && o !== WORLD_LIGHT && o !== WORLD_SUN) {savedWorldEnvironment.lights.push([o,o.visible]);o.visible=false;} });
    gallery.scene.visible = false; worldRoot.visible = true;
    scene.background = new THREE.Color(WORLD_GLB[id].sky); scene.fog = new THREE.Fog(WORLD_GLB[id].sky, 40, 80);scene.environment=null;
    WORLD_LIGHT.visible = WORLD_SUN.visible = true;
  }
  function hideWorld() {
    worldRoot.visible=false;gallery.scene.visible=true;WORLD_LIGHT.visible=WORLD_SUN.visible=false;
    if (savedWorldEnvironment) {
      scene.background=savedWorldEnvironment.background;scene.fog=savedWorldEnvironment.fog;scene.environment=savedWorldEnvironment.environment;
      for(const [lamp,visible] of savedWorldEnvironment.lights) lamp.visible=visible;
      savedWorldEnvironment=null;
    }
  }
  preloadWorld('wheat').catch(error => console.warn('[wheat preload]', error.message));

''' +s[b:]
s=s.replace('function startExperience() {','async function startExperience() {')
a=s.index('    } else if (xp.kind === "world") {',s.index('async function startExperience'));b=s.index('\n  function closeUI()',a)
s=s[:a]+'''    } else if (xp.kind === "world") {
      if (uiOpen === 'world-loading' || uiOpen === 'world') return;
      const wid = current.data.id, ticket = ++worldTicket;
      card.style.display='none';dimEl.style.display='none';focus=null;
      uiOpen='world-loading';worldCap.dataset.loading='true';worldCap.style.display='block';
      worldCap.textContent='ENTERING THE PAINTING · E TO CANCEL';hintEl.style.display='none';
      try {
        await preloadWorld(wid);
        if(ticket !== worldTicket || uiOpen !== 'world-loading') return;
        savedPos=player.getPosition().clone();
        if(!savedCamPos) savedCamPos=camera.position.clone();
        showWorld(wid);enterWorldNow(wid);uiOpen='world';
        worldCap.dataset.loading='false';worldCap.textContent='EXPLORE THE WHEAT FIELD · E TO RETURN';
      } catch(error) {
        if(ticket !== worldTicket) return;
        closeUI();toast('The painting could not load. Please try again.');
        console.error('[world entry]',error);
      }
    }
  }
''' +s[b:]
s=s.replace('  function closeUI() {','  function closeUI() {\n    ++worldTicket;\n    worldCap.dataset.loading = "false"; worldCap.style.display = "none";')
s=s.replace('      scene.background = new THREE.Color(0x0d0f14);','      // hideWorld restores the actual saved gallery background and environment.')
s=s.replace('cap.position.set(WORLD_OFFSET, 0.15, 0);', '''const spawn = WORLD_GLB[id].spawn;
    cap.position.set(WORLD_OFFSET + spawn[0], spawn[1], spawn[2]);
    cap.updateMatrixWorld(true);
    camera.position.set(cap.position.x, cap.position.y + 2.4, cap.position.z + 4.2);
    controls.target.set(cap.position.x, cap.position.y + 1.35, cap.position.z);
    player.setInput({moveX:0, moveY:0});''')
p.write_text(s,encoding='utf-8')
print('v6 scene and world integration written')
