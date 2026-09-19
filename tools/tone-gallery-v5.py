import bpy,numpy as np
from pathlib import Path
from mathutils import Vector
R=Path(r'Z:\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery');O=R/'assets/models/blender';bpy.ops.wm.open_mainfile(filepath=str(O/'gallery-v5.blend'));s=bpy.context.scene
m=bpy.data.materials['V5 waxed oak parquet'];n=m.node_tree.nodes;p=n.get('Principled BSDF');img=next(q.image for q in n if q.type=='TEX_IMAGE' and '_diff_' in q.image.name)
a=np.empty(len(img.pixels),dtype=np.float32);img.pixels.foreach_get(a);a=a.reshape(-1,4);a[:,:3]*=np.array([.52,.40,.31]);img.pixels.foreach_set(a.ravel());img.pack()
for q in n:
 if q.type=='NORMAL_MAP':q.inputs['Strength'].default_value=.16
# Veins derived from photographed stone, tinted as dark portoro.
source=next(im for im in bpy.data.images if im.name.startswith('marble_01_diff'))
a=np.empty(len(source.pixels),dtype=np.float32);source.pixels.foreach_get(a);a=a.reshape(-1,4);lum=a[:,:3].mean(axis=1);v=np.clip((np.quantile(lum,.7)-lum)*2.4,0,1)**1.5
for i,(base,gain) in enumerate(zip((.013,.016,.012),(.36,.20,.065))):a[:,i]=base+v*gain
a[:,3]=1;im=bpy.data.images.new('V5 portoro photographed veins',width=source.size[0],height=source.size[1]);im.pixels.foreach_set(a.ravel());im.pack()
m=bpy.data.materials['Portoro marble'];n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');tex=n.new('ShaderNodeTexImage');tex.image=im;l.new(tex.outputs['Color'],p.inputs['Base Color']);p.inputs['Roughness'].default_value=.22
for ob in s.objects:
 if ob.type=='LIGHT' and ob.name.startswith('V5 warm wall bounce'):ob.data.energy=115
s.render.resolution_percentage=100;s.cycles.samples=96
bpy.ops.wm.save_as_mainfile(filepath=str(O/'gallery-v5.blend'))
s.render.resolution_percentage=50;s.cycles.samples=24;s.render.filepath=str(O/'gallery-v5-check-final.png');bpy.ops.render.render(write_still=True)
s.render.resolution_percentage=100;s.cycles.samples=96;s.render.filepath=str(O/'gallery-v5-front.png');bpy.ops.render.render(write_still=True)
s.camera.location=(3.4,-7.8,2.45);s.camera.rotation_euler=(Vector((-1,3.5,2.8))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(O/'gallery-v5-oblique.png');bpy.ops.render.render(write_still=True)
print('V5 TONE COMPLETE',flush=True)
