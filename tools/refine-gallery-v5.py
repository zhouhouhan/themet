import bpy, math, random
from pathlib import Path
from mathutils import Vector
R=Path(r'Z:\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery');O=R/'assets/models/blender';P=R/'assets/materials/polyhaven'
bpy.ops.wm.open_mainfile(filepath=str(O/'gallery-v4.blend'));s=bpy.context.scene;random.seed(19)
# Reuse established modelling helpers, without recreating the room.
source=(R/'tools/build-gallery-v4.py').read_text(encoding='utf-8-sig')
helpers=source[source.index('def cube('):source.index('# Foundation')]
scene=s
exec(helpers)
gold=bpy.data.materials['Aged gilt moulding'];ivory=bpy.data.materials['Warm limestone cornice'];bright=bpy.data.materials['Polished gilt highlights'];bronze=bpy.data.materials['Recessed antique bronze']

def pbr(name,asset,rough=.3):
 m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
 for link in list(l):
  if link.to_node==p:l.remove(link)
 for suffix,socket in [('diff','Base Color'),('nor_gl','Normal')]:
  f=P/asset/'textures'/f'{asset}_{suffix}_2k.jpg';im=bpy.data.images.load(str(f),check_existing=True);t=n.new('ShaderNodeTexImage');t.image=im
  if suffix=='nor_gl':
   im.colorspace_settings.name='Non-Color';normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.32;l.new(t.outputs['Color'],normal.inputs['Color']);l.new(normal.outputs[0],p.inputs[socket])
  else:l.new(t.outputs['Color'],p.inputs[socket])
 p.inputs['Roughness'].default_value=rough
 p.inputs['Coat Weight'].default_value=.3;p.inputs['Coat Roughness'].default_value=.18
 return m
stone=pbr('Cream veined marble','marble_01',.29)
floor=pbr('V5 waxed oak parquet','diagonal_parquet',.23)
# Gloss variation is retained in Cycles; export keeps the scalar varnish finish.
n=floor.node_tree.nodes;l=floor.node_tree.links;p=n.get('Principled BSDF')
im=bpy.data.images.load(str(P/'diagonal_parquet/textures/diagonal_parquet_arm_2k.jpg'));im.colorspace_settings.name='Non-Color';t=n.new('ShaderNodeTexImage');t.image=im;sep=n.new('ShaderNodeSeparateColor');l.new(t.outputs['Color'],sep.inputs['Color']);rng=n.new('ShaderNodeMapRange');rng.inputs['To Min'].default_value=.15;rng.inputs['To Max'].default_value=.29;l.new(sep.outputs['Green'],rng.inputs['Value']);l.new(rng.outputs['Result'],p.inputs['Roughness'])
# Photographed parquet replaces the repetitive synthetic plank surface.
for o in list(s.objects):
 if o.name.startswith(('Herringbone parquet','Perimeter parquet border','End parquet border')):bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.mesh.primitive_plane_add(size=2,location=(0,0,.021));o=bpy.context.object;o.name='V5 photographed parquet';o.scale=(6,12,1);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(floor)
for loop in o.data.uv_layers.active.data:
 loop.uv.x*=4;loop.uv.y*=8
# Add slight plaster grain and tactile leather pores without changing the architecture.
for name,scale,distance in [('Venetian red mineral plaster',190,.008),('Oxblood tufted leather',130,.004),('Warm limestone cornice',100,.003)]:
 m=bpy.data.materials[name];n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=scale;noise.inputs['Detail'].default_value=3;b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.18;b.inputs['Distance'].default_value=distance;l.new(noise.outputs['Fac'],b.inputs['Height']);l.new(b.outputs['Normal'],p.inputs['Normal'])
# Replace all small synthetic bust pieces with a CC0 scanned sculpture.
for o in list(s.objects):
 if o.name.startswith(('Bust ','Carved classical curls','Draped mantle fold')):bpy.data.objects.remove(o,do_unlink=True)
before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(P/'marble_bust_01/marble_bust_01.gltf'));added=list(set(bpy.data.objects)-before);meshes=[o for o in added if o.type=='MESH'];bpy.context.view_layer.update()
# Bake import transform and normalize each mesh using common world bounds.
pts=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box];lo=Vector([min(v[i] for v in pts) for i in range(3)]);hi=Vector([max(v[i] for v in pts) for i in range(3)]);fac=.92/(hi.z-lo.z);mid=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
for src in meshes:
 me=src.data.copy()
 for v in me.vertices:v.co=(src.matrix_world@v.co-mid)*fac
 for side in (-1,1):
  for y in (-4.75,6.25):
   ob=bpy.data.objects.new('V5 scanned marble bust',me);s.collection.objects.link(ob);ob.location=(side*5.42,y,1.47);ob.rotation_euler.z=-side*math.radians(45);ob['source']='https://polyhaven.com/a/marble_bust_01';ob['license']='CC0'
for o in added:bpy.data.objects.remove(o,do_unlink=True)
# Marble surface UV scale in world units: continuous believable stone grain.
for ob in s.objects:
 if ob.type!='MESH' or stone not in list(ob.data.materials):continue
 if ob.name.startswith('V5 scanned'):continue
 if not ob.data.uv_layers:ob.data.uv_layers.new()
 for poly in ob.data.polygons:
  axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3) if i!=axis]
  for li in poly.loop_indices:
   co=ob.matrix_world@ob.data.vertices[ob.data.loops[li].vertex_index].co;ob.data.uv_layers.active.data[li].uv=(co[axes[0]]/1.8,co[axes[1]]/1.8)
# End portal receives a dark inset panel and layered inner architraves.
for x in (-1.43,1.43):
 cube('V5 inner portal bead',(x,11.70,2.65),(.065,.085,4.9),ivory,.014)
for z in (.20,5.08):cube('V5 end portal border',(0,11.70,z),(2.9,.085,.07),ivory,.014)
# Fine dentil band under the existing cornice.
for side in (-1,1):
 for i in range(100):cube('V5 cornice dentil',(side*5.81,-11.85+i*.24,6.26),(.12,.09,.10),ivory,.006)
# Carved corner flourishes on the painting frames. Each is a curled gilt leaf.
for art in [o for o in s.objects if o.name.startswith('ART ')]:
 vs=[v.co for v in art.data.vertices];a,b,c,d=vs[:4];across=(b-a).normalized();up=(d-a).normalized();normal=across.cross(up);w=(b-a).length;h=(d-a).length;center=(a+c)/2
 for sx in (-1,1):
  for sz in (-1,1):
   origin=center+across*sx*(w/2+.13)+up*sz*(h/2+.13)+normal*.09
   for branch in (-1,1):
    pts=[]
    for j in range(20):
     t=j/19;v=origin+across*sx*(.20*t)+up*sz*(branch*.075*math.sin(t*math.pi))+normal*.018*math.sin(t*math.pi);pts.append(v)
    path('V5 corner acanthus scroll',pts,.013,gold)
# Crown pedestal thin bronze fillets and carved corner appliques.
for x in (-.70,.70):
 cube('V5 vitrine base fillet',(x,-.017,.93),(.022,.025,1.11),bright,.006)
for z in (.38,1.47):cube('V5 vitrine base horizontal fillet',(0,-.017,z),(1.42,.025,.022),bright,.006)
# Lighting: restrained skylight, warm wall pools, and floor-level reflected highlights.
for ob in s.objects:
 if ob.type!='LIGHT':continue
 if ob.name.startswith('Daylight'):
  ob.data.energy=400;ob.data.color=(.83,.9,1)
 if ob.name.startswith('Architectural wall wash'):
  ob.data.energy=145;ob.data.color=(1,.66,.36);ob.data.spot_size=math.radians(48)
 if ob.name.startswith('Picture spotlight'):
  ob.data.energy=290;ob.data.color=(1,.80,.56)
 if ob.name.startswith('Crown'):
  ob.data.energy=180 if 'focused' in ob.name else 140;ob.data.color=(1,.77,.45)
# Wide soft lights above each artwork give richer indirect bounce and broad floor reflections.
for side in (-1,1):
 for y in (-8,-1,5,10):
  ob=light('V5 warm wall bounce',(side*4.7,y,5.5),(side*5.6,y,2.0),170,(1,.69,.43),1.4)
  ob.visible_glossy=True;ob.data.specular_factor=.65
# Showcase light pool in front of the vitrine, with tiny lamps reflected as highlights.
ob=light('V5 crown floor pool',(0,-.3,4.55),(0,.35,0),170,(1,.72,.39),.5,'SPOT');ob.data.spot_size=math.radians(48)
# Recessed brass lamp housings along skylight, with softly emissive lenses.
lens=bpy.data.materials.new('V5 warm lamp lens');lens.use_nodes=True;p=lens.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(1,.75,.43,1);p.inputs['Emission Color'].default_value=(1,.62,.28,1);p.inputs['Emission Strength'].default_value=4
for side in (-1,1):
 for y in range(-11,12,2):ball('V5 visible warm lamp lens',(side*2.48,y,9.045),(.045,.05,.012),lens)
s.world.node_tree.nodes['Background'].inputs[1].default_value=.16
s.view_settings.exposure=.45;s.cycles.samples=96;s.cycles.use_denoising=True
s.render.resolution_x=1600;s.render.resolution_y=900;s.render.resolution_percentage=100
for im in bpy.data.images:
 if im.source=='FILE':
  try:im.pack()
  except:pass
bpy.ops.wm.save_as_mainfile(filepath=str(O/'gallery-v5.blend'))
s.render.resolution_percentage=50;s.cycles.samples=24;s.render.filepath=str(O/'gallery-v5-check.png');bpy.ops.render.render(write_still=True)
s.render.resolution_percentage=100;s.cycles.samples=96;s.render.filepath=str(O/'gallery-v5-front.png');bpy.ops.render.render(write_still=True)
s.camera.location=(3.4,-7.8,2.45);s.camera.rotation_euler=(Vector((-1,3.5,2.8))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(O/'gallery-v5-oblique.png');bpy.ops.render.render(write_still=True)
print('V5 FINISHED',flush=True)
