import bpy, math, json, numpy as np
from pathlib import Path
from mathutils import Vector
R=Path(r'\\192.168.31.246\Media\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery');O=R/'assets/models/worlds/piazza-san-marco-v2';O.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene
# Mottled colors are newly generated material textures, not edits of the source painting.
def mat(name,c,variation=.045):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.88
 if variation:
  w=256;yy,xx=np.mgrid[0:w,0:w]/w;v=(np.sin(xx*23+np.sin(yy*13))*np.cos(yy*19)+.35*np.sin(xx*137+yy*79))*.5
  rgba=np.ones((w,w,4),dtype=np.float32)
  for j in range(3):rgba[:,:,j]=np.clip(c[j]*(1+v*variation),0,1)
  im=bpy.data.images.new(name+' pigment',width=w,height=w);im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(rgba.ravel());im.pack();t=n.new('ShaderNodeTexImage');t.image=im;m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 return m
stone=mat('Warm ochre limestone',(.55,.43,.255));trim=mat('Sunlit pale stone',(.76,.66,.44));shade=mat('Arcade shadow',(.13,.155,.125));brick=mat('Muted tower brick',(.49,.315,.17));roof=mat('Weathered sage copper',(.25,.32,.23));gold=mat('Quiet mosaic gold',(.58,.40,.16));glass=mat('Blue grey window',(.14,.205,.21));pave=mat('Grey olive paving',(.35,.36,.285));line=mat('Paving inlay',(.61,.59,.46));terra=mat('Terracotta roof',(.37,.245,.16))
def meshob(name,vs,faces,loc,m):
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],faces);me.update();ob=bpy.data.objects.new(name,me);s.collection.objects.link(ob);ob.location=loc;me.materials.append(m)
 uv=me.uv_layers.new(name='UVMap')
 for poly in me.polygons:
  for k,li in enumerate(poly.loop_indices):uv.data[li].uv=((k==1 or k==2),k>=2)
 return ob
def cube(name,loc,dim,m,bev=0):
 x,y,z=[d/2 for d in dim];return meshob(name,[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],loc,m)
def cyl(name,loc,r,depth,m,vertices=12):
 vs=[(r*math.cos(i*2*math.pi/vertices),r*math.sin(i*2*math.pi/vertices),z) for z in [-depth/2,depth/2] for i in range(vertices)]
 faces=[tuple(reversed(range(vertices))),tuple(range(vertices,2*vertices))]+[(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)]
 return meshob(name,vs,faces,loc,m)
def sphere(name,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
# Arch ribbon in local x/z, with real thickness and no black fill plane.
def arch(name,c,r,spring,band,depth,m,rot=0):
 vs=[];N=12
 for y in [-depth/2,depth/2]:
  for rad in [r,r+band]:
   for i in range(N+1):
    a=math.pi*i/N;x=rad*math.cos(a);z=spring+rad*math.sin(a);vs.append((c[0]+x*math.cos(rot)-y*math.sin(rot),c[1]+x*math.sin(rot)+y*math.cos(rot),c[2]+z))
 faces=[];L=N+1
 for i in range(N):
  faces += [(i,i+1,L+i+1,L+i),(2*L+i,3*L+i,3*L+i+1,2*L+i+1),(i,2*L+i,2*L+i+1,i+1),(L+i,L+i+1,3*L+i+1,3*L+i)]
 faces += [(0,L,3*L,2*L),(N,2*L-1,4*L-1,3*L-1)]
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],faces);me.update();o=bpy.data.objects.new(name,me);s.collection.objects.link(o);me.materials.append(m);return o
cube('Walkable plaza',(0,-8,-.25),(70,130,.5),pave)
# Restrained paving lines, no clutter.
for x in range(-28,29,7):cube('Long paving seam',(x,-10,.008),(.07,115,.014),line)
for y in range(-65,48,7):cube('Cross paving seam',(0,y,.009),(59,.07,.016),line)
# Portico wings: front faces toward plaza; actual shallow sheltered arcades.
for side in [-1,1]:
 x=side*30.5
 cube('Wing masonry core',(side*34,-7,9),(5,90,18),stone)
 cube('Portico ceiling',(side*30.6,-7,5.65),(4.6,90,.65),trim)
 cube('Upper facade',(side*30.5,-7,12),(1.2,90,12),stone)
 for z,d,h in [(0.2,1.9,.4),(5.7,2,.3),(10.7,1.8,.25),(16.5,2,.25),(18.1,2.4,.6)]:cube('Continuous cornice',(x,-7,z),(d,90,h),trim,.04)
 for y in np.arange(-50.5,38,3.65):
  cyl('Arcade column',(x,y,2.05),.22,3.75,trim)
  cube('Column base',(x,y,.25),(.67,.67,.35),trim)
  cube('Column capital',(x,y,4.05),(.63,.68,.25),trim)
  arch('Open ground arcade',(x,y+1.825,0),1.48,4.1,.22,.6,trim,math.pi/2)
  for z in [8.15,13.3]:
   cube('Window recess',(x-side*.65,y+1.82,z),(.06,1.42,2.65),glass)
   for dy in [-.83,.83]:cube('Window jamb',(x-side*.72,y+1.82+dy,z),(.18,.15,2.95),trim)
   cube('Window sill',(x-side*.85,y+1.82,z-1.45),(.42,1.94,.17),trim)
   arch('Window crown',(x-side*.7,y+1.82,z+.65),.72,0,.15,.18,trim,math.pi/2)
  cube('Parapet post',(x,y,18.8),(.4,.4,1),trim)
 for y in np.arange(-48,38,14.6):
  cyl('Roof chimney',(side*32,y,19.4),.38,2,stone)
  cyl('Chimney cap',(side*32,y,20.4),.55,.22,trim)
 cube('Wing shallow roof',(side*34,-7,18.45),(5.8,90,.45),terra)
# Basilica silhouette and five-portico facade.
cube('Basilica mass',(-4,43,6),(36,10,12),stone)
cube('Basilica lower step',(-4,36.7,.3),(38,5,.6),trim)
for i,x in enumerate([-18,-11,-4,3,10]):
 width=3.0 if i==2 else 2.55;height=6.0 if i==2 else 4.8
 cube('Deep basilica doorway',(x,37.88,2.4),(width*1.6,.08,4.8),shade)
 arch('Basilica portal',(x,37.5,0),width,3.5,.43,.8,trim)
 arch('Portal inner gold',(x,37.03,0),width-.20,3.5,.13,.12,gold)
 for dx in [-width-.18,width+.18]:
  cyl('Portal marble shaft',(x+dx,37.2,1.9),.22,3.8,trim)
  cube('Portal capital',(x+dx,37.2,3.8),(.65,.75,.28),trim)
 cube('Mosaic tympanum',(x,37.32,8.2),(width*1.8,.1,2.1),gold)
 arch('Upper basilica arch',(x,37,0),width,8.1,.32,.5,trim)
 sphere('Faded mosaic medallion',(x,37.18,8.8),(.55,.055,.7),stone)
 for dx in [-width,width]:
  cyl('Facade pinnacle',(x+dx,37.5,11.1),.14,2.0,trim)
  bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=.35,radius2=0,depth=1.0,location=(x+dx,37.5,12.3));bpy.context.object.data.materials.append(trim)
for x,y,z,r in [(-4,43,15.5,4.3),(-13,43,13.6,3.35),(5,43,13.6,3.35),(-10,49,15,3.1),(2,49,15,3.1)]:
 cyl('Dome drum',(x,y,z-1.7),r*.83,3,stone,24);sphere('Sage basilica dome',(x,y,z),(r,r,r*.90),roof)
 cyl('Dome lantern',(x,y,z+r*.88),.3,1.5,trim)
 cyl('Dome finial',(x,y,z+r*.88+1.3),.065,1.15,gold,8)
 cube('Dome cross',(x,y,z+r*.88+1.55),(.65,.07,.07),gold)
# Campanile, slightly right of center; recognizable mass with restrained detail.
tx,ty=13,29
cube('Tower plinth',(tx,ty,.65),(7,7,1.3),trim,.10)
cube('Tall campanile shaft',(tx,ty,17.9),(5.2,5.2,34.4),brick,.035)
for side in [-1,1]:
 for a in [-1.7,-.57,.57,1.7]:
  cube('Tower front pilaster',(tx+a,ty+side*2.63,18),(.15,.12,32),stone)
  cube('Tower side pilaster',(tx+side*2.63,ty+a,18),(.12,.15,32),stone)
 for z in [9,16.5,24,31]:
  cube('Tower slit front',(tx,ty+side*2.67,z),(.35,.035,1.3),shade)
  cube('Tower slit side',(tx+side*2.67,ty,z),(.035,.35,1.3),shade)
for z,w,h in [(35.1,6.2,.65),(35.65,6.6,.4),(40.3,6.5,.45),(40.75,7.0,.4),(44.6,5.0,.35)]:cube('Tower cornice',(tx,ty,z),(w,w,h),trim,.04)
# Open bell chamber: corner supports and pairs of arches on each face.
for dx in [-2.35,2.35]:
 for dy in [-2.35,2.35]:cube('Bell chamber pier',(tx+dx,ty+dy,37.8),(.6,.6,4.4),stone)
for side in [-1,1]:
 for a in [-1.42,0,1.42]:
  arch('Bell front arch',(tx+a,ty+side*2.35,0),.6,38.35,.17,.45,trim)
  arch('Bell side arch',(tx+side*2.35,ty+a,0),.6,38.35,.17,.45,trim,math.pi/2)
 for a in [-2.05,-.72,.72,2.05]:
  cyl('Bell front column',(tx+a,ty+side*2.35,37.05),.12,2.9,trim)
  cyl('Bell side column',(tx+side*2.35,ty+a,37.05),.12,2.9,trim)
cube('Tower attic',(tx,ty,42.65),(4.65,4.65,3.6),stone)
for side in [-1,1]:
 sphere('Attic stone emblem',(tx,ty+side*2.34,42.6),(.64,.055,.64),trim)
bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=3.8,radius2=0,depth=7.5,location=(tx,ty,48.6),rotation=(0,0,math.pi/4));bpy.context.object.name='Copper pyramidal spire';bpy.context.object.data.materials.append(roof)
cyl('Tower gold finial',(tx,ty,52.95),.10,1.2,gold)
sphere('Finial orb',(tx,ty,53.5),(.21,.21,.21),gold)
# A few background blocks close sightlines; no extensive city model.
cube('Rear connecting palazzo',(23,44,7),(16,9,14),stone)
for x in np.arange(18,29,2):
 cube('Rear palazzo window',(x,39.44,8),(1,.08,2),glass)
cube('Left rear connecting arcade',(-24,44,6),(14,9,12),stone)
for x in [-28,-25,-22]:
 cube('Rear side window',(x,39.44,7),(1.2,.08,2.6),glass)
# V2 architectural detail pass: rhythm, relief and fine stone bands.
rose=mat('Muted rose marble',(.43,.29,.22));mosaic=mat('Faded mosaic blue',(.24,.32,.34));joint=mat('Subtle stone joint',(.31,.30,.235))
def beam(name,a,b,r,m):
 d=Vector(b)-Vector(a);ob=cyl(name,(Vector(a)+Vector(b))/2,r,d.length,m,8);ob.rotation_euler=d.to_track_quat('Z','Y').to_euler();return ob
# Balustrades, engaged pilasters, glazing divisions, entablature dentils.
for side in [-1,1]:
 x=side*30.5
 for y in np.arange(-50.5,38,3.65):
  for z in [7.0,12.15]:
   cube('Balcony coping',(x-side*.95,y+1.82,z),(.50,2.5,.16),trim,.025)
   cube('Balcony lower rail',(x-side*.87,y+1.82,z-.8),(.32,2.4,.12),trim)
   for dy in np.linspace(-1.0,1.0,7):cyl('Stone baluster',(x-side*.97,y+1.82+dy,z-.43),.06,.65,trim,8)
  for z in [8.15,13.3]:
   cube('Window central mullion',(x-side*.73,y+1.82,z),(.12,.08,2.65),trim)
   cube('Window transom',(x-side*.73,y+1.82,z+.25),(.12,1.45,.07),trim)
  cube('Upper engaged pilaster',(x-side*.69,y,11.7),(.15,.30,11.7),trim)
  cube('Pilaster capital',(x-side*.80,y,17.4),(.35,.65,.30),trim,.025)
  for dy in [.4,1.1,1.8,2.5,3.2]:cube('Cornice dentil',(x-side*.78,y+dy,17.8),(.45,.18,.22),trim)
  arch('Ground arcade outer moulding',(x-side*.15,y+1.825,0),1.77,4.1,.08,.67,stone,math.pi/2)
# Basilica string courses and decorative marble column pairs.
for z in [.25,7.2,11.7]:cube('Basilica string course',(-4,37.14,z),(36.6,.55,.18),trim,.025)
for x in [-18,-11,-4,3,10]:
 for dx in [-2.2,-1.9,1.9,2.2]:
  cyl('Basilica rose marble column',(x+dx,36.82,2.0),.11,3.4,rose)
  cyl('Marble capital',(x+dx,36.82,3.74),.19,.18,trim)
 for rad in [2.83,3.04]:arch('Layered upper archivolt',(x,36.69,0),rad,8.1,.08,.18,gold)
 # Geometric mosaic tesserae imply colored historical decoration without figures.
 for a in range(0,180,20):
  t=math.radians(a);sphere('Mosaic border tile',(x+1.9*math.cos(t),37.06,8.1+1.9*math.sin(t)),(.13,.045,.16),mosaic)
 # Shallow pediment gives the roof line a varied silhouette.
 vs=[(x-2.4,37.4,11.7),(x+2.4,37.4,11.7),(x,37.4,13.4)]
 me=bpy.data.meshes.new('Gabled front');me.from_pydata(vs,[],[(0,1,2)]);me.materials.append(stone);ob=bpy.data.objects.new('Basilica shallow gable',me);s.collection.objects.link(ob)
 beam('Gable carved edge',(x-2.45,37.1,11.7),(x,37.1,13.45),.10,trim);beam('Gable carved edge',(x,37.1,13.45),(x+2.45,37.1,11.7),.10,trim)
 sphere('Gable roundel',(x,37.05,12.35),(.25,.06,.25),gold)
# Copper dome ribs, subtle instead of dense sculptural detailing.
for x,y,z,r in [(-4,43,15.5,4.3),(-13,43,13.6,3.35),(5,43,13.6,3.35),(-10,49,15,3.1),(2,49,15,3.1)]:
 for az in range(0,360,45):
  a=math.radians(az)
  for j in range(7):
   t1=.08+j*(math.pi/2-.08)/7;t2=.08+(j+1)*(math.pi/2-.08)/7
   aa=(x+r*math.sin(t1)*math.cos(a),y+r*math.sin(t1)*math.sin(a),z+r*.90*math.cos(t1))
   bb=(x+r*math.sin(t2)*math.cos(a),y+r*math.sin(t2)*math.sin(a),z+r*.90*math.cos(t2))
   beam('Dome seam',aa,bb,.026,stone)
# Tower base layered masonry and carefully restrained horizontal joints.
for z,w,h in [(1.1,7.4,.16),(1.5,6.6,.16),(2.0,5.75,.18)]:cube('Tower base course',(tx,ty,z),(w,w,h),trim,.03)
for z in np.arange(3,34,.9):
 for side in [-1,1]:
  cube('Tower horizontal mortar',(tx,ty+side*2.605,z),(5.15,.016,.022),stone)
  cube('Tower return mortar',(tx+side*2.605,ty,z),(.016,5.15,.022),stone)
for side in [-1,1]:
 for xoff in np.arange(-2.8,2.9,.46):cube('Bell cornice dentil',(tx+xoff,ty+side*2.96,40.47),(.18,.3,.26),stone)
 for dx in [-1.35,1.35]:cube('Attic frame upright',(tx+dx,ty+side*2.36,42.7),(.12,.12,2.7),trim)
 for z in [41.35,44.05]:cube('Attic frame lintel',(tx,ty+side*2.36,z),(2.8,.12,.12),trim)
# Visible bell and support inside the chamber.
beam('Bell crossbeam',(tx-1.8,ty,39.1),(tx+1.8,ty,39.1),.10,shade)
bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=.7,radius2=.3,depth=1.15,location=(tx,ty,37.8));bpy.context.object.name='Bronze bell';bpy.context.object.data.materials.append(gold)
# Narrow paving joints supplement the broad perspective inlays.
for y in np.arange(-63,37,2.33):cube('Fine paving joint',(0,y,.012),(58,.016,.01),joint)
for x in np.arange(-28,29,2.33):cube('Fine paving joint',(x,-13,.013),(.016,100,.01),joint)

# Sky: painted soft cloud color on an inward sphere, glTF-compatible emission texture.
w,h=1024,512;yy,xx=np.mgrid[0:h,0:w];u=xx/w;v=yy/h
cloud=np.clip((np.sin(u*31+np.sin(v*17)*2)+.45*np.sin(u*71-v*29)+.25*np.cos(u*133+v*67)-.25)*.6,0,1)
cloud*=np.sin(v*math.pi)**2
base=np.zeros((h,w,4),dtype=np.float32);base[:,:,3]=1
for j,(a,b) in enumerate([(.23,.58),(.43,.68),(.56,.70)]):base[:,:,j]=a+(b-a)*(1-v)+cloud*.30
im=bpy.data.images.new('Painted blue sky',width=w,height=h);im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(base.ravel());im.pack()
m=bpy.data.materials.new('Painted sky unlit');m.use_nodes=True;n=m.node_tree.nodes;n.clear();t=n.new('ShaderNodeTexImage');t.image=im;e=n.new('ShaderNodeEmission');e.inputs['Strength'].default_value=.65;o=n.new('ShaderNodeOutputMaterial');m.node_tree.links.new(t.outputs['Color'],e.inputs['Color']);m.node_tree.links.new(e.outputs[0],o.inputs[0]);m.use_backface_culling=False
sky=sphere('SKY visual only',(0,0,0),(220,220,220),m);sky['collision']=False;sky.visible_shadow=False;sky.visible_diffuse=False;sky.visible_glossy=False
# Lighting and entry composition.
s.world=bpy.data.worlds.new('Blue ambient');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.45,.57,.67,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.45
bpy.ops.object.light_add(type='SUN',location=(-30,-20,60));sun=bpy.context.object;sun.name='Warm afternoon sun';sun.rotation_euler=(math.radians(28),math.radians(-25),math.radians(-35));sun.data.energy=2.0;sun.data.angle=math.radians(12);sun.data.color=(1,.90,.72)
bpy.ops.object.camera_add(location=(0,-64,8.4));cam=bpy.context.object;cam.name='ENTRY CAMERA';cam.rotation_euler=(Vector((0,31,24))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=31;s.camera=cam
s.render.engine='CYCLES';s.cycles.samples=48;s.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
 prefs.compute_device_type='OPTIX';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='OPTIX'
 s.cycles.device='GPU'
except:pass
s.render.resolution_x=1440;s.render.resolution_y=900;s.render.resolution_percentage=100;s.view_settings.view_transform='AgX'
s.render.image_settings.file_format='PNG';s.render.filepath=str(O/'piazza-entry.png')
bpy.ops.wm.save_as_mainfile(filepath=str(O/'piazza-san-marco.blend'));bpy.ops.render.render(write_still=True)
# Export from evaluated geometry, batching by material to keep draw calls bounded.
for ob in list(s.objects):
 if ob.type=='MESH':
  bpy.context.view_layer.objects.active=ob;ob.select_set(True)
  for mod in list(ob.modifiers):
   try:bpy.ops.object.modifier_apply(modifier=mod.name)
   except:pass
  ob.select_set(False)
for material in list(bpy.data.materials):
 obs=[o for o in s.objects if o.type=='MESH' and len(o.data.materials)==1 and o.data.materials[0]==material]
 if not obs:continue
 bpy.ops.object.select_all(action='DESELECT')
 for ob in obs:ob.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();obs[0].name='PIAZZA '+material.name
bpy.ops.export_scene.gltf(filepath=str(O/'piazza-san-marco.glb'),export_format='GLB',export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
tris=sum(len(o.data.polygons) for o in s.objects if o.type=='MESH');print('COMPLETE',tris,flush=True)
(O/'scene-spec.json').write_text(json.dumps({'units':'meters','gltfUp':'+Y','entryEye':[0,8.4,64],'entryLook':[0,24,-31],'entryLensMm':31,'sensorWidthMm':36,'recommendedWalkBounds':{'x':[-8,8],'z':[45,64]},'groundY':0,'skyIncluded':True,'skyCollision':False,'notes':'Small viewing zone only. Geometry is a simplified painting-inspired reconstruction, not a survey. No people, stalls, fabrics or animals. GLB excludes lights and cameras; host supplies lighting. Do not normalize bounds: sky radius220.'},indent=2))