import json,struct,io,sys
from pathlib import Path
from PIL import Image
p=Path(sys.argv[1]);b=p.read_bytes();jl=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+jl]);bo=20+jl;binary=b[bo+8:]
normal_sources=set()
for m in j.get('materials',[]):
 if 'normalTexture' in m:normal_sources.add(j['textures'][m['normalTexture']['index']]['source'])
replace={};changed=0
for k,im in enumerate(j.get('images',[])):
 if 'bufferView' not in im or k in normal_sources or im.get('mimeType')!='image/png':continue
 vi=im['bufferView'];v=j['bufferViews'][vi];raw=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']];pic=Image.open(io.BytesIO(raw))
 if 'A' in pic.getbands() and pic.getchannel('A').getextrema()!=(255,255):continue
 out=io.BytesIO();pic.convert('RGB').save(out,format='JPEG',quality=92,subsampling=0,optimize=True);new=out.getvalue()
 if len(new)<len(raw):replace[vi]=new;im['mimeType']='image/jpeg';changed+=1
out=bytearray()
for i,v in enumerate(j['bufferViews']):
 old=v.get('byteOffset',0);data=replace.get(i,binary[old:old+v['byteLength']]);out.extend(b'\x00'*((-len(out))%4));v['byteOffset']=len(out);v['byteLength']=len(data);out.extend(data)
out.extend(b'\x00'*((-len(out))%4));j['buffers'][0]['byteLength']=len(out);js=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode();js+=b' '*((-len(js))%4)
result=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(out))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(out),0x004e4942)+out
assert struct.unpack_from('<I',result,8)[0]==len(result)
p.write_bytes(result)
print(json.dumps({'before':len(b),'after':len(result),'images_compressed':changed,'images_total':len(j.get('images',[]))}))
