import * as THREE from 'three';

// Static, shared period silhouettes. Placements leave the player's viewing zone clear.
export function addPiazzaFigures(root) {
  const placements=[[-17,36,.2],[-15.8,35,2.5],[12,29,-.6],[13.2,30,2.2],[-7,21,.8],[-5.7,20,3], [18,12,1], [2,9,-1], [3.2,9,2],[-18,0,.3],[-16.5,-1,2.7],[10,-8,1.7],[-4,-15,.4],[0,-24,2], [15,-22,1],[-22,25,1.6],[21,39,-2],[-11,3,2.2]];
  const group=new THREE.Group();group.name='Piazza period visitors (shared instances)';
  const palette=[0x574e49,0x6a6050,0x72504a,0x445861,0x81735d,0x514848];
  const parts=[
    [new THREE.CylinderGeometry(.19,.33,.93,8),[0,.83,0],[1,1,.72],'coat'],
    [new THREE.SphereGeometry(.13,8,6),[0,1.51,0],[.87,1.13,1],'skin'],
    [new THREE.CylinderGeometry(.20,.22,.045,6),[0,1.65,0],[1,1,.75],'hat'],
    [new THREE.CylinderGeometry(.105,.12,.10,8),[0,1.69,0],[1,1,1],'hat'],
    [new THREE.CylinderGeometry(.062,.065,.44,6),[-.105,.23,.01],[1,1,1],'hat'],
    [new THREE.CylinderGeometry(.062,.065,.44,6),[.105,.23,.07],[1,1,1],'hat'],
    [new THREE.CapsuleGeometry(.064,.43,2,6),[-.22,1.05,.04],[1,1,1],'coat'],
    [new THREE.CapsuleGeometry(.064,.43,2,6),[.22,1.05,-.035],[1,1,1],'coat'],
    [new THREE.SphereGeometry(.066,6,4),[-.22,.77,.04],[1,1,1],'skin'],
    [new THREE.SphereGeometry(.066,6,4),[.22,.77,-.035],[1,1,1],'skin']
  ];
  const matrix=new THREE.Matrix4(),local=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
  for(const [geo,pos,scale,kind] of parts){
    const mat=new THREE.MeshStandardMaterial({color:kind==='skin'?0xab9172:kind==='hat'?0x383733:0xffffff,roughness:1});
    const mesh=new THREE.InstancedMesh(geo,mat,placements.length);mesh.name='Period figure '+kind;mesh.castShadow=true;mesh.receiveShadow=true;
    placements.forEach(([x,z,yaw],i)=>{const size=.94+(i%4)*.05;matrix.compose(new THREE.Vector3(x,.025,z),q.setFromAxisAngle(up,yaw),new THREE.Vector3(size,size,size));local.compose(new THREE.Vector3(...pos),new THREE.Quaternion(),new THREE.Vector3(...scale));mesh.setMatrixAt(i,matrix.clone().multiply(local));if(kind==='coat')mesh.setColorAt(i,new THREE.Color(palette[i%palette.length]));});
    mesh.instanceMatrix.needsUpdate=true;group.add(mesh);
  }
  root.add(group);
}

// World-local material treatment; no full-screen blur or extra render pass.
export function softenPiazza(root){
  const seen=new Set();
  root.traverse(o=>{if(!o.isMesh)return;for(const m of (Array.isArray(o.material)?o.material:[o.material])){
    if(!m||seen.has(m))continue;seen.add(m);
    const sky=/sky/i.test(o.name+' '+m.name);
    if(sky){if(m.emissive)m.emissive.multiply(new THREE.Color(0xd5e2df)).multiplyScalar(1.18);if(m.color)m.color.multiply(new THREE.Color(0xc6d4d3));}
    else {if(m.color)m.color.lerp(new THREE.Color(0xc0b39a),.08);if('roughness' in m)m.roughness=Math.max(.82,m.roughness);}
    m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
      float paper = fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453)-0.5;
      float luma = dot(gl_FragColor.rgb,vec3(0.2126,0.7152,0.0722));
      gl_FragColor.rgb = mix(vec3(luma),gl_FragColor.rgb,0.91);
      gl_FragColor.rgb += paper * 0.009;
    `);};m.needsUpdate=true;
    // 不要强制 customProgramCacheKey：14 个材质贴图槽位不同（天空用 emissiveMap，其余用 map），
    // 此处保持默认缓存键；2026-09-16 逐 draw 检查定位报错在玩家蒙皮材质，非此油画 shader。
  }});
}

export function detailVitrine(parent,cx,cz,w,h,d){
  const group=new THREE.Group();group.name='Vitrine bronze joinery';
  const bronze=new THREE.MeshStandardMaterial({color:0x8f7449,metalness:.78,roughness:.29});
  const dark=new THREE.MeshStandardMaterial({color:0x25211b,metalness:.65,roughness:.4});
  const box=(x,y,z,sx,sy,sz,mat=bronze)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);m.position.set(cx+x,y,cz+z);group.add(m);};
  for(const y of [.035,.105,h-.045,h+.012,h+.92]){
    const edge=y>h?.89:1.005;
    box(0,y,-edge/2,edge,.018,.018);box(0,y,edge/2,edge,.018,.018);
    box(-edge/2,y,0,.018,.018,edge);box(edge/2,y,0,.018,.018,edge);
  }
  for(const x of [-.43,.43])for(const z of [-.43,.43]){
    box(x,h+.46,z,.009,.92,.009);
    box(x,h+.035,z,.023,.065,.023);
  }
  // Recessed plinth and fine front panel outline, with a discreet lock.
  box(0,.06,0,.89,.1,.89,dark);
  for(const x of [-.405,.405])box(x,h/2,-.48,.008,.80,.007);
  for(const y of [.15,.88])box(0,y,-.48,.81,.008,.007);
  box(.34,h+.04,.444,.035,.045,.012,dark);
  parent.add(group);
}
