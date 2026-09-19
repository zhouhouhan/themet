import bpy
from mathutils import Vector
from pathlib import Path
R=Path(r'Z:\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery')
bpy.ops.wm.open_mainfile(filepath=str(R/'assets/models/blender/gallery-v4.blend'))
s=bpy.context.scene
for o in s.objects:
 if o.type=='LIGHT' and o.name.startswith('Crown'):
  o.visible_glossy=True;o.visible_transmission=True;o.data.energy=160 if 'focused' in o.name else 100
bpy.ops.wm.save_as_mainfile(filepath=str(R/'assets/models/blender/gallery-v4.blend'))
s.render.resolution_percentage=50;s.cycles.samples=16;s.render.filepath=str(R/'assets/models/blender/gallery-v4-check.png');bpy.ops.render.render(write_still=True)
s.render.resolution_percentage=100;s.cycles.samples=64;s.render.filepath=str(R/'assets/models/blender/gallery-v4-front.png');bpy.ops.render.render(write_still=True)
s.camera.location=(3.4,-7.8,2.45);s.camera.rotation_euler=(Vector((-1,3.5,2.8))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/'assets/models/blender/gallery-v4-oblique.png');bpy.ops.render.render(write_still=True)
print('CROWN LIGHT FINAL COMPLETE')
