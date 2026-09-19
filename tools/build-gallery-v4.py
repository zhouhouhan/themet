import bpy, math, random, json, os
from mathutils import Vector
from pathlib import Path
random.seed(42)
ROOT=Path(r'Z:\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery')
OUT=ROOT/'assets/models/blender'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'

def mat(name,color,metal=0,rough=.45):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
red=mat('Venetian red mineral plaster',(.16,.025,.009),0,.72)
ivory=mat('Warm limestone cornice',(.64,.52,.36),0,.48)
gold=mat('Aged gilt moulding',(.63,.34,.085),.78,.25)
bright=mat('Polished gilt highlights',(.83,.53,.18),.83,.19)
darkgold=mat('Recessed antique bronze',(.17,.082,.022),.72,.36)
leather=mat('Oxblood tufted leather',(.035,.012,.009),0,.37)
wooddark=mat('Carved walnut furniture',(.055,.022,.009),0,.32)
black=mat('Showcase dark interior',(.012,.017,.013),0,.25)
labelmat=mat('Ivory collection cards',(.83,.78,.65),0,.8)
ink=mat('Label ink',(.045,.032,.02),0,.8)

def texmat(name,kind):
 m=mat(name,(.4,.3,.2),0,.19 if kind=='wood' else .27)
 n=384; im=bpy.data.images.new(name+' texture',width=n,height=n)
 pix=[]
 for y in range(n):
  for x in range(n):
   u=x/n;v=y/n
   if kind=='wood':
    g=.5+.2*math.sin(v*190+4*math.sin(u*7)+2*math.sin(v*33))+ .10*math.sin(v*730+7*math.sin(u*4))+.06*random.random()
    c=(.12+.23*g,.047+.115*g,.017+.048*g)
   else:
    f=math.sin(u*15+v*20+2*math.sin(v*13+u*9)+.6*math.sin(u*47-v*24))
    vein=max(0,1-abs(f)*17)
    if kind=='black':c=(.024+vein*.32,.027+vein*.19,.021+vein*.075)
    else:c=(.62-vein*.17,.55-vein*.20,.43-vein*.19)
   pix.extend((*c,1))
 im.pixels.foreach_set(pix);im.filepath_raw=str(OUT/(name+'.png'));im.file_format='PNG';im.save();im.pack()
 nd=m.node_tree.nodes.new('ShaderNodeTexImage');nd.image=im
 m.node_tree.links.new(nd.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 return m
marble=texmat('Cream veined marble','cream');nero=texmat('Portoro marble','black');oak=texmat('Parquet walnut','wood')

def cube(name,loc,scale,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if material:o.data.materials.append(material)
 if bevel:
  b=o.modifiers.new('Crafted edge','BEVEL');b.width=bevel;b.segments=3
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o

def rod(name,a,b,r,material,vertices=10):
 d=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d.length,location=(Vector(a)+Vector(b))/2);o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(material);return o

_sphere_cache={}
def ball(name,loc,scale,material):
 key=material.name
 if key not in _sphere_cache:
  vs=[];fs=[];N=12;R=8
  for j in range(R+1):
   t=math.pi*j/R
   for i in range(N):
    a=2*math.pi*i/N;vs.append((math.sin(t)*math.cos(a),math.sin(t)*math.sin(a),math.cos(t)))
  for j in range(R):
   for i in range(N):a=j*N+i;b=j*N+(i+1)%N;fs.append((a,b,b+N,a+N))
  me=bpy.data.meshes.new('Shared ornament '+key);me.from_pydata(vs,[],fs);me.materials.append(material)
  for f in me.polygons:f.use_smooth=True
  _sphere_cache[key]=me
 o=bpy.data.objects.new(name,_sphere_cache[key]);scene.collection.objects.link(o);o.location=loc;o.scale=scale;return o
def path(name,pts,r,material):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2;s=c.splines.new('POLY');s.points.add(len(pts)-1)
 for p,co in zip(s.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new(name,c);scene.collection.objects.link(o);o.data.materials.append(material);return o

def light(name,loc,target,power,color,size=1,kind='AREA'):
 d=bpy.data.lights.new(name,kind);d.energy=power;d.color=color;d.specular_factor=.12 if kind=='AREA' else 1;d.transmission_factor=0 if kind=='AREA' else 1
 if kind=='AREA':d.shape='DISK';d.size=size
 if kind=='SPOT':d.spot_size=math.radians(65);d.spot_blend=.65;d.shadow_soft_size=.12
 o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.visible_glossy=False;o.visible_transmission=False;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o

# Foundation and individually jointed parquet, arranged in herringbone.
cube('Floor foundation',(0,0,-.13),(12.4,24.4,.22),wooddark)
boards=[]
a=.22;L=5
for i in range(-48,49):
 for j in range(-48,49):
  if (i+j)%(2*L)!=0:continue
  for typ in (0,1):
   xx=(i+L/2)*a if typ==0 else (i+L+.5)*a
   yy=(j+.5)*a if typ==0 else (j+L/2)*a
   x=(xx-yy)/math.sqrt(2);y=(xx+yy)/math.sqrt(2)
   if abs(x)>5.65 or abs(y)>11.65:continue
   ob=cube('Walnut herringbone plank',(x,y,-.012),(L*a-.008,a-.008,.045) if typ==0 else (a-.008,L*a-.008,.045),oak)
   ob.rotation_euler.z=math.pi/4;boards.append(ob)
bpy.ops.object.select_all(action='DESELECT')
for ob in boards:ob.select_set(True)
bpy.context.view_layer.objects.active=boards[0];bpy.ops.object.join();bpy.context.object.name='Herringbone parquet - joined geometry'
for side in (-1,1):
 cube('Perimeter parquet border',(side*5.85,0,-.005),(.3,24,.04),oak)
 cube('Brass floor inlay',(side*5.68,0,.018),(.018,24,.008),darkgold)
 cube('End parquet border',(0,side*11.83,-.005),(11.4,.34,.04),oak)

print('PARQUET COMPLETE',flush=True)
# Walls with true open doorways; surrounding rooms remain modestly lit.
for side in (-1,1):
 x=side*6.12
 for lo,hi in [(-12,-5.95),(-4.05,5.05),(6.95,12)]:
  cube('Red plaster wall',(x,(lo+hi)/2,3.25),(.26,hi-lo,6.5),red)
 for y in (-5,6):
  cube('Door lintel wall',(x,y,5.75),(.26,1.9,1.5),red)
  cube('Side room floor',(side*7.65,y,-.03),(3.2,2.2,.09),marble)
  cube('Side room back wall',(side*9.15,y,2.5),(.2,2.5,5),red)
  for dy in (-1.1,1.1):cube('Door reveal',(side*7.65,y+dy,2.5),(3.2,.2,5),marble)
  light('Side room glow',(side*7.3,y,4.5),(side*7.3,y,0),100,(1,.71,.45),1.5)
  # Portal pilasters, inset panels, stepped capitals and dentils.
  for dy in (-1.08,1.08):
   cube('Portal pilaster',(side*5.91,y+dy,2.6),(.27,.29,5.2),marble,.025)
   cube('Pilaster recessed face',(side*5.74,y+dy,2.8),(.035,.16,3.65),ivory,.012)
   for z,w,h in [(.14,.46,.28),(.34,.4,.12),(4.85,.4,.15),(5.06,.5,.22)]:cube('Portal capital and plinth',(side*5.85,y+dy,z),(.42,w,h),marble,.018)
  for z,w,d,h in [(5.23,2.75,.43,.18),(5.39,2.92,.5,.12),(5.50,3.08,.57,.11)]:cube('Door entablature',(side*5.85,y,z),(d,w,h),ivory,.02)
  for k in range(14):cube('Door dentil',(side*5.58,y-1.29+k*.198,5.29),(.12,.085,.105),ivory,.007)
 for lo,hi in [(-12,-6.18),(-3.82,4.82),(7.18,12)]:
  for z,h,d,ma in [(.26,.52,.13,marble),(.55,.08,.2,ivory),(.63,.035,.22,gold),(.07,.12,.2,ivory)]:cube('Wall dado',(side*5.95,(lo+hi)/2,z),(d,hi-lo,h),ma,.008)
 for z,d,h in [(6.22,.20,.12),(6.36,.32,.12),(6.48,.43,.13),(6.6,.5,.10)]:cube('Continuous crown cornice',(side*(6-d/2),0,z),(d,24,h),ivory,.015)
# End wall and monumental central marble portal.
cube('Gallery end wall',(0,12.1,3.25),(12.3,.24,6.5),red)
for x in (-1.7,1.7):
 cube('End portal pilaster',(x,11.86,2.6),(.42,.32,5.2),marble,.025)
 for z,w,h in [(.17,.65,.34),(4.94,.63,.26),(5.17,.72,.16)]:cube('End portal capital',(x,11.8,z),(w,.44,h),ivory,.015)
cube('End portal shadow',(0,11.93,2.55),(2.97,.08,5.1),wooddark)
for z,w in [(5.35,4.25),(5.5,4.45)]:cube('End portal entablature',(0,11.8,z),(w,.5,.14),ivory,.015)
for x in (-4,4):cube('End wall marble skirting',(x,11.9,.26),(3.75,.18,.52),marble,.01)
# Elliptical barrel roof, with a physically open central skylight.
def archz(x):return 6.58+3.15*math.sqrt(max(0,1-(x/6)**2))
def strip(name,xs,ys,ma):
 verts=[(x,y,archz(x)) for y in ys for x in xs];faces=[];n=len(xs)
 for j in range(len(ys)-1):
  for i in range(n-1):q=j*n+i;faces.append((q,q+1,q+n+1,q+n))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();ob=bpy.data.objects.new(name,mesh);scene.collection.objects.link(ob);ob.data.materials.append(ma)
 for p in mesh.polygons:p.use_smooth=True
 return ob
for side in (-1,1):strip('Plaster barrel vault',[side*(2.25+i*3.75/48) for i in range(49)],[-12,12],ivory)
# End tympanum under barrel.
for y in (-12,12):
 v=[(-6,y,6.5),(6,y,6.5)]+[(6*math.cos(t*math.pi/64),y,6.58+3.15*math.sin(t*math.pi/64)) for t in range(65)]
 me=bpy.data.meshes.new('Vault end');me.from_pydata(v,[],[tuple(range(len(v)))]);ob=bpy.data.objects.new('Vault end',me);scene.collection.objects.link(ob);me.materials.append(ivory)
# Transverse raised ribs and recessed side panel outlines.
for y in (-11.8,-8,-4,0,4,8,11.8):
 for side in (-1,1):
  pts=[(side*(2.25+i*3.68/48),y,archz(side*(2.25+i*3.68/48))-.045) for i in range(49)]
  path('Barrel plaster rib',pts,.055,ivory)
for x in (-5.7,-4.8,-2.45,2.45,4.8,5.7):rod('Vault longitudinal moulding',(x,-12,archz(x)-.03),(x,12,archz(x)-.03),.035,ivory)
sky=mat('Soft blue translucent skylight',(.50,.66,.76),0,.35)
p=sky.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(.52,.7,.86,1);p.inputs['Emission Strength'].default_value=.35
strip('Skylight glazing',[-2.25+i*4.5/32 for i in range(33)],[-12,12],sky)
for x in (-2.25,-1.125,0,1.125,2.25):rod('Skylight longitudinal mullion',(x,-12,archz(x)-.025),(x,12,archz(x)-.025),.048,ivory)
for y in range(-12,13,2):path('Skylight cross glazing bars',[(x,y,archz(x)-.035) for x in [-2.25+i*4.5/32 for i in range(33)]],.055,ivory)
for y in (-8,-2,4,10):light('Daylight through skylight',(0,y,9.25),(0,y,0),550,(.73,.84,1),4)

print('ARCHITECTURE COMPLETE',flush=True)
# True Met paintings with preserved aspect ratio, nested gilded frame profiles.
records=json.loads((ROOT/'assets/paintings/met-originals/manifest.json').read_text(encoding='utf-8-sig'))
def painting(rec,center,angle,width):
 im=bpy.data.images.load(str(ROOT/f'assets/paintings/met-originals/{rec["objectID"]}.jpg'),check_existing=True)
 ratio=im.size[0]/im.size[1];h=min(width/ratio,3.6);w=h*ratio
 # Local X across painting, local Y toward back wall; front faces -Y.
 def world(x,y,z):return (center[0]+x*math.cos(angle)-y*math.sin(angle),center[1]+x*math.sin(angle)+y*math.cos(angle),center[2]+z)
 def box(n,loc,dim,ma,b=.005):
  ob=cube(n,world(*loc),dim,ma,b);ob.rotation_euler.z=angle;return ob
 box('Painting backing',(0,.04,0),(w+.16,.08,h+.16),wooddark)
 m=mat(rec['title'],(.8,.8,.8),0,.72);nd=m.node_tree.nodes.new('ShaderNodeTexImage');nd.image=im;m.node_tree.links.new(nd.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 verts=[world(-w/2,-.013,-h/2),world(w/2,-.013,-h/2),world(w/2,-.013,h/2),world(-w/2,-.013,h/2)]
 me=bpy.data.meshes.new('Canvas');me.from_pydata(verts,[],[(0,1,2,3)]);me.uv_layers.new()
 for loop,uv in zip(me.uv_layers.active.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=uv
 ob=bpy.data.objects.new('ART '+str(rec['objectID'])+' '+rec['title'],me);scene.collection.objects.link(ob);me.materials.append(m);ob['met_object_url']=rec['objectURL'];ob['is_public_domain']=True
 for off,thick,depth,ma in [(.025,.035,-.028,bright),(.061,.045,-.046,darkgold),(.112,.065,-.069,gold),(.172,.039,-.047,bright),(.212,.042,-.012,gold)]:
  for s in (-1,1):
   box('Gilt vertical frame',(s*(w/2+off),depth,0),(thick,.085,h+off*2+thick),ma,.012)
   box('Gilt horizontal frame',(0,depth,s*(h/2+off)),(w+off*2+thick,.085,thick),ma,.012)
 # A continuous bead-and-reel inner ornament.
 for s in (-1,1):
  for k in range(int(w/.075)+1):ball('Frame beading',world(-w/2+k*.075,-.102,s*(h/2+.112)),(.023,.018,.023),bright)
  for k in range(int(h/.075)+1):ball('Frame beading',world(s*(w/2+.112),-.102,-h/2+k*.075),(.023,.018,.023),bright)
 box('Artwork caption plate',(w/2+.36,-.015,-h/2+.17),(.19,.024,.30),labelmat,.003)
 # Legible caption on closer inspection, kept modest in the room view.
 cu=bpy.data.curves.new('Museum caption','FONT');cu.body=rec['artistDisplayName']+'\n'+rec['title']+'\n'+rec['objectDate'];cu.size=.023;cu.space_line=1.2
 tx=bpy.data.objects.new('Caption '+str(rec['objectID']),cu);scene.collection.objects.link(tx);tx.location=world(w/2+.278,-.032,-h/2+.275);tx.rotation_euler=(math.pi/2,0,angle);cu.materials.append(ink)
 # Warm ceiling spot and visible fixture.
 pos=world(0,-1.05,2.25);light('Picture spotlight',pos,world(0,0,0),210,(1,.76,.49),.35,'SPOT');ball('Spotlight housing',pos,(.085,.085,.13),darkgold)

for side in (-1,1):
 for k,y in enumerate((-9,-1.65,2.45,9.3)):
  rec=records[(k+(0 if side<0 else 4))%len(records)]
  painting(rec,(side*5.94,y,3.0),math.pi/2 if side<0 else -math.pi/2,3.15 if k in (0,3) else 2.75)
for k,x in enumerate((-3.95,3.95)):painting(records[(8+k)%len(records)],(x,11.91,2.85),0,2.15)

print('PAINTINGS COMPLETE',flush=True)
# Tufted leather benches and turned wooden legs.
for x,y in [(-3.45,-4.3),(3.45,-4.3),(-3.5,7.8),(3.5,7.8)]:
 cube('Bench carved frame',(x,y,.44),(2.5,.79,.18),wooddark,.06)
 for i in range(6):
  for j in range(2):cube('Stitched leather cushion',(x-1.04+i*.416,y-.205+j*.41,.60),(.409,.404,.24),leather,.065)
 for dx in (-1.07,1.07):
  for dy in (-.28,.28):
   rod('Turned bench leg',(x+dx*1.03,y+dy,.06),(x+dx,y+dy,.43),.055,wooddark,16)
   for z,r in [(.13,.068),(.3,.08),(.4,.075)]:ball('Leg turning',(x+dx,y+dy,z),(r,r,.06),wooddark)
 for dx in [-1.1+i*.14 for i in range(17)]:ball('Brass upholstery tack',(x+dx,y-.397,.47),(.014,.011,.014),gold)

# Small classical decorative busts, modeled as sculptural studies, not Met objects.
for side in (-1,1):
 for by in (-4.75,6.25):
  bx=side*5.42
  cube('Sculpture marble plinth',(bx,by,.65),(.58,.56,1.3),nero,.018)
  for z,w,h in [(.08,.68,.16),(1.32,.67,.1),(1.42,.48,.1)]:cube('Sculpture pedestal moulding',(bx,by,z),(w,w,h),marble,.013)
  # Face toward the central aisle with a subtle turn toward the entrance.
  origin=Vector((bx,by,1.47));theta=side*-.75
  def sculpt(name,loc,sc):
   xx,yy,zz=loc;v=origin+Vector((xx*math.cos(theta)-yy*math.sin(theta),xx*math.sin(theta)+yy*math.cos(theta),zz));ob=ball(name,v,sc,marble);ob.rotation_euler.z=theta;return ob
  sculpt('Bust shoulder mantle',(0,0,.20),(.26,.15,.23))
  sculpt('Bust neck',(0,0,.42),(.085,.085,.17))
  sculpt('Bust head',(0,-.018,.63),(.133,.119,.185))
  sculpt('Bust nose',(0,-.135,.635),(.027,.05,.052))
  sculpt('Bust chin',(0,-.076,.51),(.073,.055,.052))
  for s in (-1,1):
   sculpt('Bust ear',(s*.132,-.005,.625),(.025,.032,.055))
   sculpt('Bust brow',(s*.052,-.116,.682),(.043,.025,.018))
  for k in range(26):
   a=k*2.399;z=.69+random.random()*.105;rr=.12*math.sqrt(max(.1,1-((z-.63)/.2)**2))
   sculpt('Carved classical curls',(rr*math.cos(a),.007+rr*math.sin(a),z),(.033,.03,.032))
  for k in range(5):
   sculpt('Draped mantle fold',(-.19+k*.086,-.123,.15+abs(k-2)*.023),(.034,.031,.16))
# Central crown case: stepped portoro base, slender bronze structure, clear glass.
CY=.7
for z,w,d,h,ma in [(.08,1.95,1.75,.16,marble),(.19,1.81,1.61,.12,gold),(.90,1.61,1.41,1.32,nero),(1.58,1.78,1.58,.09,gold),(1.65,1.53,1.33,.07,marble)]:cube('Crown vitrine base',(0,CY,z),(w,d,h),ma,.016)
for x in (-.79,.79):
 for y in (-.69,.69):
  cube('Vitrine bronze corner',(x,CY+y,2.28),(.045,.045,4.12),bright,.008)
  for z in (.35,1.38):ball('Vitrine ornamental rivet',(x,CY+y-.03,z),(.032,.022,.032),bright)
for z in (1.73,4.33):
 for y in (-.69,.69):cube('Case cross rail',(0,CY+y,z),(1.64,.048,.065),gold,.008)
 for x in (-.79,.79):cube('Case side rail',(x,CY,z),(.048,1.43,.065),gold,.008)
glass=mat('Museum low iron glass',(.96,.99,1),0,.06);p=glass.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=1;p.inputs['IOR'].default_value=1.45
for x in (-.765,.765):cube('Vitrine side glass',(x,CY,3.02),(.006,1.33,2.55),glass)
for y in (-.665,.665):cube('Vitrine front back glass',(0,CY+y,3.02),(1.51,.006,2.55),glass)
cube('Vitrine top glazing',(0,CY,4.3),(1.5,1.33,.008),glass)
cube('Crown velvet riser',(0,CY,1.78),(1.04,.88,.18),labelmat,.035)
# Import supplied GLB and normalize world-space bounds without altering its design.
before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(OUT/'crown-user.glb'));imported=list(set(bpy.data.objects)-before);meshes=[o for o in imported if o.type=='MESH'];bpy.context.view_layer.update()
pts=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box];lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)))
parent=bpy.data.objects.new('USER CROWN - supplied model',None);scene.collection.objects.link(parent)
for o in imported:
 if o.parent not in imported:o.parent=parent
sc=1.28/max(hi.x-lo.x,hi.y-lo.y);parent.scale=(sc,sc,sc);parent.location=(-(lo.x+hi.x)/2*sc,CY-(lo.y+hi.y)/2*sc,1.9-lo.z*sc)
print('CROWN BOUNDS',list(lo),list(hi),'SCALE',sc)
light('Crown focused warm light',(0,CY,4.15),(0,CY,2.1),100,(1,.8,.51),.65)
light('Crown soft front fill',(0,CY-2,3.4),(0,CY,2.3),90,(1,.84,.63),1.5)
# Discrete rails supporting warm architectural accents.
for side in (-1,1):
 rod('Ceiling lighting rail',(side*2.48,-11.7,9.22),(side*2.48,11.7,9.22),.025,darkgold)
 for y in range(-11,12,2):
  ball('Track fixture',(side*2.48,y,9.15),(.075,.10,.11),gold)
  light('Architectural wall wash',(side*4.8,y,5.8),(side*5.95,y,2.9),85,(1,.66,.39),.3,'SPOT')
world=bpy.data.worlds.new('Gallery environment');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.24,.29,.38,1);world.node_tree.nodes['Background'].inputs[1].default_value=.12;scene.world=world
bpy.ops.object.camera_add(location=(0,-10.7,2.45));cam=bpy.context.object;cam.name='Gallery reference camera';cam.rotation_euler=(Vector((0,5,2.7))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=24;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.cycles.max_bounces=8;scene.cycles.transmission_bounces=6
try:
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
 for d in prefs.devices:d.use=True
 scene.cycles.device='GPU'
except Exception as e:print('CPU fallback',e)
scene.render.resolution_x=1440;scene.render.resolution_y=810;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'gallery-v4-front.png')
# Pack original paintings for a self-contained editable project.
for im in bpy.data.images:
 if im.source=='FILE':
  try:im.pack()
  except:pass
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'gallery-v4.blend'))
print('SAVED BLEND',flush=True)
bpy.ops.render.render(write_still=True)
print('RENDER DONE',flush=True)
# Export a web version with capped image resolution, retaining originals in .blend.
for im in bpy.data.images:
 if max(im.size)>2048:
  f=2048/max(im.size);im.scale(round(im.size[0]*f),round(im.size[1]*f))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/models/gallery-v4.glb'),export_format='GLB',export_apply=True,export_cameras=True,export_lights=True,export_extras=True)
print('EXPORT DONE',flush=True)



