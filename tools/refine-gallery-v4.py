import bpy
from mathutils import Vector
from pathlib import Path
R=Path(r'Z:\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery')
bpy.ops.wm.open_mainfile(filepath=str(R/'assets/models/blender/gallery-v4.blend'))
s=bpy.context.scene
for o in s.objects:
 if o.type=='LIGHT' and o.data.type=='AREA':
  o.visible_glossy=False;o.visible_transmission=False;o.data.transmission_factor=0
  if o.name.startswith('Crown'):o.data.specular_factor=0
s.camera.rotation_euler=(Vector((0,5,2.7))-s.camera.location).to_track_quat('-Z','Y').to_euler()
s.cycles.samples=64
bpy.ops.wm.save_as_mainfile(filepath=str(R/'assets/models/blender/gallery-v4.blend'))
s.render.filepath=str(R/'assets/models/blender/gallery-v4-front.png');bpy.ops.render.render(write_still=True)
s.camera.location=(3.4,-7.8,2.45);s.camera.rotation_euler=(Vector((-1,3.5,2.8))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/'assets/models/blender/gallery-v4-oblique.png');bpy.ops.render.render(write_still=True)
print('FINAL RENDERS COMPLETE')
