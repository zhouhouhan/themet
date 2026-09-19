import bpy, math, random
from mathutils import Vector
from pathlib import Path
R=Path(r'Z:\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery')
bpy.ops.wm.open_mainfile(filepath=str(R/'assets/models/blender/gallery-v4.blend'))
s=bpy.context.scene
for o in s.objects:
 if o.type=='LIGHT' and o.name.startswith('Crown'):
  o.data.type='POINT';o.data.energy=42 if 'focused' in o.name else 26;o.data.shadow_soft_size=.035;o.data.specular_factor=1;o.data.transmission_factor=1
 if o.name.startswith(('Bench','Stitched','Turned bench','Leg turning','Brass upholstery')) and o.location.y<0:
  o.location.x-=math.copysign(.65,o.location.x);o.location.y+=.8
# Fine irregular mineral veins, with multiple spatial frequencies.
for name in ('Cream veined marble texture','Portoro marble texture'):
 im=bpy.data.images.get(name)
 if not im:continue
 n=im.size[0];pix=[];dark=name.startswith('Portoro')
 for y in range(n):
  for x in range(n):
   u=x/n;v=y/n
   warp=2*math.sin(v*13+u*9)+.65*math.sin(u*47-v*24)+.3*math.sin(u*113+v*81)+.12*math.sin(u*251-v*179)
   f=math.sin(u*15+v*20+warp);vein=max(0,1-abs(f)*28)**2
   fine=max(0,1-abs(math.sin(u*42-v*36+warp*1.4))*50)*.2
   cloud=.02*math.sin(u*38+math.sin(v*19))*math.sin(v*23)
   if dark:c=(.023+vein*.23+fine*.08,.026+vein*.14+fine*.05,.021+vein*.055+fine*.02)
   else:c=(.62-vein*.12+cloud,.55-vein*.14+cloud,.43-vein*.13+cloud)
   pix.extend((*c,1))
 im.pixels.foreach_set(pix);im.pack()
s.view_settings.exposure=.25
bpy.ops.wm.save_as_mainfile(filepath=str(R/'assets/models/blender/gallery-v4.blend'))
s.render.filepath=str(R/'assets/models/blender/gallery-v4-front.png');bpy.ops.render.render(write_still=True)
s.camera.location=(3.4,-7.8,2.45);s.camera.rotation_euler=(Vector((-1,3.5,2.8))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/'assets/models/blender/gallery-v4-oblique.png');bpy.ops.render.render(write_still=True)
print('POLISH COMPLETE')
