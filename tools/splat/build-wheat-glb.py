import bpy,numpy as np,math,json
from pathlib import Path
from mathutils import Vector
R=Path(r'\\192.168.31.246\Media\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery');OUT=R/'assets/models/worlds'
p=Path(r'D:\Download\670a4590f25a0fdea9010a5b149975ce (1).ply')
with p.open('rb') as f:
 header=b''
 while not header.endswith(b'end_header\n'):header+=f.readline()
 a=np.fromfile(f,dtype='<f4').reshape(-1,14)
alpha=1/(1+np.exp(-a[:,6]));a=a[alpha>.22]
# Spatial sampling retains high opacity representatives, avoiding random holes.
order=np.argsort(-1/(1+np.exp(-a[:,6])));a=a[order]
_,ix=np.unique(np.floor(a[:,:3]/.14).astype(np.int32),axis=0,return_index=True);a=a[ix]
print('SURFELS',len(a),flush=True)
# PLY stores Gaussian log scales and wxyz quaternions. Preserve both principal axes.
q=a[:,10:14];q=q/np.linalg.norm(q,axis=1)[:,None];w,x,y,z=q.T
rot=np.stack([1-2*y*y-2*z*z,2*x*y-2*w*z,2*x*z+2*w*y,2*x*y+2*w*z,1-2*x*x-2*z*z,2*y*z-2*w*x,2*x*z-2*w*y,2*y*z+2*w*x,1-2*x*x-2*y*y],axis=1).reshape(-1,3,3)
sc=np.exp(a[:,7:10]);axes=np.argsort(sc,axis=1);ids=np.arange(len(a));u=rot[ids,:,axes[:,2]];v=rot[ids,:,axes[:,1]]
# A minimum footprint compensates spatial sampling; larger original splats keep their extent.
su=np.clip(sc[ids,axes[:,2]]*2.1,.105,1.8);sv=np.clip(sc[ids,axes[:,1]]*2.1,.105,1.8)
u*=su[:,None];v*=sv[:,None]
positions=np.stack([a[:,:3]-u-v,a[:,:3]+u-v,a[:,:3]+u+v,a[:,:3]-u+v],axis=1)
# Source Y-up -> Blender Z-up; authored scale and ground offset stored in the result.
positions=positions[:,:,[0,2,1]];positions[:,:,1]*=-1;positions[:,:,2]+=5.45;positions*=.7
rgb=np.clip(.5+.28209479177387814*a[:,3:6],0,1);linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene
# White disk texture supplies a stable masked footprint instead of sort-dependent alpha blending.
im=bpy.data.images.new('Surfel disk',width=64,height=64);yy,xx=np.mgrid[0:64,0:64];rr=((xx-31.5)/31.5)**2+((yy-31.5)/31.5)**2;pix=np.ones((64,64,4),dtype=np.float32);pix[:,:,3]=np.clip((1-rr)*6,0,1);im.pixels.foreach_set(pix.ravel());im.pack()
m=bpy.data.materials.new('Wheat source colour surfels');m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Roughness'].default_value=1
vc=n.new('ShaderNodeVertexColor');vc.layer_name='SourceColor';tex=n.new('ShaderNodeTexImage');tex.image=im;l.new(vc.outputs['Color'],bs.inputs['Base Color']);l.new(vc.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=1;l.new(tex.outputs['Alpha'],bs.inputs['Alpha']);m.surface_render_method='DITHERED';m.use_transparency_overlap=False
# Split into chunks for frustum culling and manageable loading.
for k,start in enumerate(range(0,len(a),22000)):
 pos=positions[start:start+22000];N=len(pos);vs=pos.reshape(-1,3);faces=np.arange(N*4).reshape(-1,4)
 me=bpy.data.meshes.new('Source surfel chunk');me.from_pydata(vs.tolist(),[],faces.tolist());me.update()
 uv=me.uv_layers.new();uv.data.foreach_set('uv',np.tile([0,0,1,0,1,1,0,1],N))
 col=me.color_attributes.new(name='SourceColor',type='FLOAT_COLOR',domain='POINT');rgba=np.ones((N*4,4),dtype=np.float32);rgba[:,:3]=np.repeat(linear[start:start+N],4,axis=0);col.data.foreach_set('color',rgba.ravel())
 ob=bpy.data.objects.new('WHEAT_SURFELS_'+str(k),me);s.collection.objects.link(ob);me.materials.append(m);ob['source_type']='gaussian_ply_surfel_approximation';ob['unlit_source_color']=True
# Flat support is only a visual underlay; runtime owns invisible collision floor.
bpy.ops.mesh.primitive_plane_add(size=70,location=(0,0,-.3));o=bpy.context.object;o.name='Wheat ground underlay';gm=bpy.data.materials.new('Wheat earth');gm.diffuse_color=(.24,.16,.035,1);o.data.materials.append(gm)
s.world=bpy.data.worlds.new('Wheat sky');s.world.color=(.12,.16,.22)
bpy.ops.object.camera_add(location=(0,-6,2.2));s.camera=bpy.context.object;s.camera.rotation_euler=(Vector((0,8,2))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.lens=23
s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='OPTIX'
s.cycles.device='GPU';s.render.resolution_x=960;s.render.resolution_y=540;s.render.resolution_percentage=100;s.view_settings.view_transform='Standard'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'wheat-world.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'wheat-world.glb'),export_format='GLB',export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
(OUT/'wheat-world.json').write_text(json.dumps({'source':p.name,'sourceFormat':'Gaussian PLY without faces','conversion':'oriented masked surfels, approximate; original PLY retained','surfelCount':len(a),'sourceGroundY':-5.45,'scale':.7,'runtimeNormalization':False,'spawn':[0,.15,0],'boundsXZ':[-34.3,31.8,-25.9,35.7]},indent=2))
print('WHEAT GLB COMPLETE',flush=True)
s.render.filepath=str(OUT/'wheat-world-preview.png');bpy.ops.render.render(write_still=True)

