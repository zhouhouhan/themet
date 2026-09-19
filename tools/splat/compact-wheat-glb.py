import json,struct,array,sys
from pathlib import Path
p=Path(sys.argv[1]);data=p.read_bytes();n=struct.unpack_from('<I',data,12)[0];j=json.loads(data[20:20+n]);raw=data[28+n:]
assert not j.get('skins') and not j.get('animations')
oldacc=j['accessors'];oldviews=j['bufferViews'];out=bytearray();views=[];acc=[];cache={}
def put(blob,target=None):
 out.extend(b'\0'*(-len(out)%4));v={'buffer':0,'byteOffset':len(out),'byteLength':len(blob)}
 if target:v['target']=target
 out.extend(blob);views.append(v);return len(views)-1
def copyaccess(index,color=False):
 key=(index,color)
 if key in cache:return cache[key]
 a=oldacc[index].copy();assert 'sparse' not in a;v=oldviews[a['bufferView']];assert 'byteStride' not in v
 count=a['count'];channels={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];width={5126:4,5125:4,5123:2,5121:1}[a['componentType']];start=v.get('byteOffset',0)+a.get('byteOffset',0);blob=raw[start:start+count*channels*width]
 if color and a['componentType']==5126:
  f=array.array('f');f.frombytes(blob);blob=bytes(max(0,min(255,round(x*255))) for x in f);a['componentType']=5121;a['normalized']=True;a.pop('min',None);a.pop('max',None)
 a['bufferView']=put(blob,v.get('target'));a.pop('byteOffset',None);acc.append(a);cache[key]=len(acc)-1;return len(acc)-1
for mesh in j['meshes']:
 surfel='surfel' in mesh.get('name','').lower()
 for prim in mesh['primitives']:
  prim['attributes']={k:copyaccess(v,k.startswith('COLOR')) for k,v in prim['attributes'].items() if not(surfel and k in ('NORMAL','TANGENT'))}
  if 'indices' in prim:prim['indices']=copyaccess(prim['indices'])
for im in j.get('images',[]):
 if 'bufferView' in im:
  v=oldviews[im['bufferView']];im['bufferView']=put(raw[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])
out.extend(b'\0'*(-len(out)%4));j['accessors']=acc;j['bufferViews']=views;j['buffers']=[{'byteLength':len(out)}];js=json.dumps(j,separators=(',',':')).encode();js+=b' '*(-len(js)%4)
result=struct.pack('<III',0x46546c67,2,28+len(js)+len(out))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(out),0x004e4942)+out
assert len(result)==struct.unpack_from('<I',result,8)[0]
p.write_bytes(result);print('Wheat optimized',len(data),'->',len(result))
