import bpy
from pathlib import Path
ROOT=Path(r'Z:\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery')
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/models/blender/gallery-v4.blend'))
# Keep the master file untouched. Bake modifiers and merge static ornament for GLB.
groups={}
for o in list(bpy.context.scene.objects):
 if o.type!='MESH' or o.name.startswith('ART '):continue
 if len(o.data.materials)!=1:continue
 # Preserve the supplied crown hierarchy and artwork metadata.
 p=o.parent;is_crown=False
 while p:
  if p.name.startswith('USER CROWN'):is_crown=True;break
  p=p.parent
 if is_crown:continue
 if o.modifiers:
  old=o.data;o.data=bpy.data.meshes.new_from_object(o.evaluated_get(bpy.context.evaluated_depsgraph_get()))
  o.modifiers.clear()
 groups.setdefault(o.data.materials[0].name,[]).append(o)
for name,objects in groups.items():
 if len(objects)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name='Architecture - '+name
for im in bpy.data.images:
 if max(im.size)>2048:
  f=2048/max(im.size);im.scale(round(im.size[0]*f),round(im.size[1]*f))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/models/gallery-v4.glb'),export_format='GLB',export_apply=True,export_cameras=True,export_lights=False,export_extras=True)
print('OPTIMIZED EXPORT DONE',flush=True)
