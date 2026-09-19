import bpy
from pathlib import Path
from mathutils import Vector
R=Path(r'Z:\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery');O=R/'assets/models/blender';bpy.ops.wm.open_mainfile(filepath=str(O/'gallery-v5.blend'));s=bpy.context.scene
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='OPTIX';p.get_devices()
for d in p.devices:d.use=d.type=='OPTIX'
s.cycles.device='GPU';s.cycles.samples=96;s.render.resolution_percentage=100
print([(d.name,d.type,d.use) for d in p.devices],flush=True)
s.render.filepath=str(O/'gallery-v5-front.png');bpy.ops.render.render(write_still=True)
s.camera.location=(3.4,-7.8,2.45);s.camera.rotation_euler=(Vector((-1,3.5,2.8))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(O/'gallery-v5-oblique.png');bpy.ops.render.render(write_still=True)
print('V5 GPU RENDERS DONE',flush=True)
