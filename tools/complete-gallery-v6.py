import bpy,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'\\192.168.31.246\Media\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery');OUT=ROOT/'assets/models/blender'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'gallery-v5.blend'));scene=bpy.context.scene
source=(ROOT/'tools/build-gallery-v4.py').read_text(encoding='utf-8-sig');exec(source[source.index('def cube('):source.index('# Foundation')])
red=bpy.data.materials['Venetian red mineral plaster'];ivory=bpy.data.materials['Warm limestone cornice'];gold=bpy.data.materials['Aged gilt moulding'];bright=bpy.data.materials['Polished gilt highlights'];darkgold=bpy.data.materials['Recessed antique bronze'];marble=bpy.data.materials['Cream veined marble'];wooddark=bpy.data.materials['Carved walnut furniture'];labelmat=bpy.data.materials['Ivory collection cards'];ink=bpy.data.materials['Label ink'];floor=bpy.data.materials['V5 waxed oak parquet']
def mat(name,color,metal=0,rough=.45):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
# Replace the rear solid closure with a true opening. Keep all existing trim and art.
for name in ('Gallery end wall','End portal shadow'):
 ob=bpy.data.objects.get(name)
 if ob:bpy.data.objects.remove(ob,do_unlink=True)
for side in (-1,1):
 y=side*12.1
 for x in (-3.8,3.8):cube('V6 completed end wall',(x,y,3.25),(4.55,.24,6.5),red,.012)
 cube('V6 doorway lintel',(0,y,5.83),(3.05,.24,1.34),red)
 # Matching full width cornice and low marble dado, rather than a 1m plain strip.
 for z,dep,h in [(6.22,.20,.12),(6.36,.32,.12),(6.48,.43,.13),(6.6,.50,.10)]:cube('V6 return cornice',(0,side*(12-dep/2),z),(12,dep,h),ivory,.015)
 for x in (-3.85,3.85):
  for z,h,dep,ma in [(.26,.52,.16,marble),(.55,.08,.22,ivory),(.63,.035,.24,gold),(.07,.12,.22,ivory)]:cube('V6 matched end dado',(x,side*11.91,z),(4.3,dep,h),ma,.01)
 # Entrance portal repeats rear portal's proportions.
 if side==-1:
  for x in (-1.7,1.7):
   cube('V6 entrance pilaster',(x,-11.86,2.6),(.42,.32,5.2),marble,.025)
   for z,w,h in [(.17,.65,.34),(4.94,.63,.26),(5.17,.72,.16)]:cube('V6 entrance capital',(x,-11.8,z),(w,.44,h),ivory,.015)
  for z,w in [(5.35,4.25),(5.5,4.45)]:cube('V6 entrance entablature',(0,-11.8,z),(w,.5,.14),ivory,.015)
 # Real 16m sightline, ending in a softly illuminated transverse alcove.
 cube('V6 corridor floor',(0,side*20,-.025),(3.12,16,.09),floor)
 for x in (-1.64,1.64):
  cube('V6 corridor wall',(x,side*20,2.6),(.2,16,5.2),red)
  cube('V6 corridor dado',(x*.94,side*20,.27),(.14,16,.54),marble,.012)
  cube('V6 corridor cornice',(x*.94,side*20,4.99),(.22,16,.16),ivory,.012)
 cube('V6 corridor ceiling',(0,side*20,5.25),(3.4,16,.16),ivory)
 for k,dist in enumerate((13.4,17,20.6,24.2,27.5)):
  for x in (-1.43,1.43):
   cube('V6 receding corridor pilaster',(x,side*dist,2.5),(.13,.22,5),marble,.018)
  cube('V6 receding architrave',(0,side*dist,4.98),(3,.3,.15),ivory,.018)
  light('V6 corridor warm pool',(0,side*(dist+1),4.8),(0,side*(dist+1),0),85 if k<3 else 130,(1,.73,.46),1.0)
 cube('V6 corridor far illuminated wall',(0,side*28.2,2.6),(3.5,.2,5.2),ivory)
 for x in (-.95,.95):cube('V6 far decorative relief',(x,side*28.06,2.9),(.055,.03,2.6),gold,.009)
 # Brass stanchions and a low rope make the access limit legible, while retaining view depth.
 for x in (-1.16,1.16):
  rod('V6 passage stanchion',(x,side*11.35,.12),(x,side*11.35,1),.035,gold,16)
  ball('V6 stanchion finial',(x,side*11.35,1.04),(.07,.07,.07),gold)
  cube('V6 stanchion foot',(x,side*11.35,.05),(.28,.28,.07),darkgold,.03)
 rope=bpy.data.materials.get('V6 burgundy velvet rope') or mat('V6 burgundy velvet rope',(.08,.008,.005),0,.9)
 path('V6 velvet access rope',[(x,side*11.35,.98-.15*(1-(x/1.16)**2)) for x in [-1.16+i*2.32/40 for i in range(41)]],.025,rope)
# Two genuine Met paintings on the formerly missing entrance wall.
exec(source[source.index('def painting('):source.index('for side in (-1,1):\n for k,y')])
records=json.loads((ROOT/'assets/paintings/met-originals/entrance-v6.json').read_text(encoding='utf-8-sig'))
for rec,x in zip(records,(-3.92,3.92)):painting(rec,(x,-11.91,2.95),math.pi,2.8)
# Fill fine-scale stone UVs on new meshes consistently.
for ob in scene.objects:
 if ob.type!='MESH' or not ob.name.startswith('V6') or marble not in list(ob.data.materials):continue
 if not ob.data.uv_layers:ob.data.uv_layers.new()
 for p in ob.data.polygons:
  ax=max(range(3),key=lambda i:abs(p.normal[i]));axes=[i for i in range(3) if i!=ax]
  for li in p.loop_indices:
   v=ob.matrix_world@ob.data.vertices[ob.data.loops[li].vertex_index].co;ob.data.uv_layers.active.data[li].uv=(v[axes[0]]/1.8,v[axes[1]]/1.8)
for im in bpy.data.images:
 if im.source=='FILE':
  try:im.pack()
  except:pass
scene.render.resolution_x=1440;scene.render.resolution_y=810;scene.render.resolution_percentage=100;scene.cycles.samples=64
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='OPTIX';p.get_devices()
for d in p.devices:d.use=d.type=='OPTIX'
scene.cycles.device='GPU'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'gallery-v6.blend'))
scene.render.filepath=str(OUT/'gallery-v6-front.png');bpy.ops.render.render(write_still=True)
scene.camera.location=(0,6.8,2.45);scene.camera.rotation_euler=(Vector((0,-14,2.8))-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/'gallery-v6-entrance.png');bpy.ops.render.render(write_still=True)
print('V6 MODEL COMPLETE',flush=True)
