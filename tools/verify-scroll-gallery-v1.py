"""Independent acceptance check for scroll-gallery-v1.

Re-opens the delivered blend and measures the geometry from the mesh data itself
(instead of trusting the build script's own report), then parses the exported GLB.
Writes verify-shots/scroll-v1-checklist.json and prints SCROLL_CHECK <json>.
"""
import bpy, os, json, struct
from mathutils import Vector

ROOT = r"\\192.168.31.246\Media\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery"
BLEND = os.path.join(ROOT, "assets", "models", "blender", "scroll-gallery-v1.blend")
GLB = os.path.join(ROOT, "assets", "models", "scroll-gallery-v1.glb")
OUT = os.path.join(ROOT, "verify-shots", "scroll-v1-checklist.json")

bpy.ops.wm.open_mainfile(filepath=BLEND)
bpy.context.view_layer.update()

def r4(v):
    return round(v, 4)

def wb(name):
    """world-space bbox of a mesh as [xmin,xmax,ymin,ymax,zmin,zmax]"""
    ob = bpy.data.objects.get(name)
    xs, ys, zs = [], [], []
    for v in ob.data.vertices:
        p = ob.matrix_world @ v.co
        xs.append(p.x); ys.append(p.y); zs.append(p.z)
    return [min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)]

def facing(name, viewer):
    """dot of the surface normal with (viewer - face centre). >0 means the face
    looks at the viewer; <=0 means it is a backface and would be culled."""
    ob = bpy.data.objects[name]
    c = ob.matrix_world @ (sum((v.co for v in ob.data.vertices), Vector()) / len(ob.data.vertices))
    n = (ob.matrix_world.to_3x3() @ ob.data.polygons[0].normal).normalized()
    d = (Vector(viewer) - c).normalized()
    return {"dot": r4(n.dot(d)), "normal": [round(x, 3) for x in n], "ok": n.dot(d) > 0}

res = {"blender": bpy.app.version_string}

# ---- dimensions, measured from mesh bounds ----
end, sc, op = wb("WALL_END"), wb("WALL_SCROLL"), wb("WALL_OPPOSITE")
fl, ce, et = wb("FLOOR"), wb("CEILING"), wb("WALL_ENTRY_TOP")
interior_length = end[0]
interior_width = sc[2] - op[3]
interior_height = ce[4] - fl[4]
door_height = et[4]
res["dims"] = {"interior_length": r4(interior_length), "interior_width": r4(interior_width),
               "interior_height": r4(interior_height), "door_height": r4(door_height)}
res["dims_ok"] = (abs(interior_length - 16.0) < 1e-6 and abs(interior_width - 4.2) < 1e-6
                  and abs(interior_height - 4.0) < 1e-6 and abs(door_height - 2.4) < 1e-6)

# ---- the ten scroll slices ----
slices = sorted((o for o in bpy.data.objects if o.name.startswith("scroll_slice_")), key=lambda o: o.name)
per = []
for o in slices:
    b = wb(o.name)
    me = o.data
    uv = me.uv_layers[0].data
    us = [d.uv[0] for d in uv]; vs = [d.uv[1] for d in uv]
    per.append({"name": o.name, "width": r4(b[1] - b[0]), "height": r4(b[5] - b[4]),
                "y": r4(b[2]), "x0": r4(b[0]), "x1": r4(b[1]),
                "materials": [m.name for m in me.materials], "uv_layers": len(me.uv_layers),
                "uv_range": [r4(min(us)), r4(max(us)), r4(min(vs)), r4(max(vs))],
                "faces": len(me.polygons)})
span = r4(per[-1]["x1"] - per[0]["x0"]) if per else 0.0
res["slice_summary"] = {"count": len(per), "span_x0_x1": span,
                        "sum_of_widths": r4(sum(p["width"] for p in per)),
                        "heights": sorted({p["height"] for p in per})}
res["slice_facing"] = {o.name: facing(o.name, (8.0, 0.0, 1.45)) for o in slices}
res["slices_ok"] = (len(per) == 10
    and all(abs(p["width"] - 1.192) < 1e-6 for p in per)
    and all(abs(p["height"] - 0.515) < 1e-6 for p in per)
    and abs(span - 11.92) < 1e-6
    and all(p["materials"] == [p["name"]] for p in per)
    and all(p["uv_layers"] == 1 for p in per)
    and all(p["uv_range"] == [0.0, 1.0, 0.0, 1.0] for p in per)
    and all(p["faces"] == 1 for p in per)
    and all(v["ok"] for v in res["slice_facing"].values()))
res["slices_tile_ok"] = all(abs(per[i]["x1"] - per[i + 1]["x0"]) < 1e-6 for i in range(len(per) - 1))
res["slice_start_x_ok"] = bool(per) and abs(per[0]["x0"] - 3.0) < 1e-6

# ---- every planar decal must face its viewer, or three.js culls it as a backface ----
AUDIT = ([("FLOOR", (8.0, 0.0, 2.0)), ("CEILING", (8.0, 0.0, 1.0)),
          ("SILK_MOUNT_OBJ", (8.0, 0.0, 1.45)), ("GOLD_LINE_TOP", (8.0, 0.0, 1.45)),
          ("GOLD_LINE_BOTTOM", (8.0, 0.0, 1.45)), ("SILK_RIBBON_OBJ", (5.0, 0.0, 1.7)),
          ("TITLE_PLATE_OBJ", (1.0, 0.55, 1.5)), ("CREDIT_PLATE_OBJ", (13.0, -1.4, 1.3)),
          ("scroll_colophon_01", (13.0, 0.9, 1.45)), ("scroll_colophon_02", (13.0, -0.3, 1.45)),
          ("detail_print_01", (6.5, 0.0, 1.5)), ("detail_print_02", (10.5, 0.0, 1.5))]
         + [("scroll_slice_%02d" % i, (8.0, 0.0, 1.45)) for i in range(1, 11)])
res["facing_audit"] = {name: facing(name, view) for name, view in AUDIT}
res["facing_ok"] = all(v["ok"] for v in res["facing_audit"].values())

# ---- light markers / collections / budget ----
empties = sorted(o.name for o in bpy.data.objects if o.type == "EMPTY")
want = sorted(["LT_COLOPHON", "LT_DETAIL_01", "LT_DETAIL_02", "LT_TITLE"] + ["LT_SCROLL_%02d" % i for i in range(1, 11)])
res["empties"] = empties
res["empties_ok"] = empties == want
res["no_real_lights"] = len([o for o in bpy.data.objects if o.type == "LIGHT"]) == 0
res["collections"] = sorted(c.name for c in bpy.data.collections)
res["collections_ok"] = res["collections"] == ["LIGHT_MARKERS", "PROPS", "SCROLL", "SHELL"]
res["materials"] = sorted(m.name for m in bpy.data.materials)
tris = 0
for o in bpy.data.objects:
    if o.type == "MESH":
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)
res["triangles"] = tris
res["tris_ok"] = tris < 80000
res["subdivision_modifiers"] = [o.name for o in bpy.data.objects if any(m.type == "SUBSURF" for m in o.modifiers)]

# ---- GLB header / JSON chunk ----
glb = {}
with open(GLB, "rb") as fh:
    magic, ver, length = struct.unpack("<III", fh.read(12))
    clen, ctype = struct.unpack("<II", fh.read(8))
    j = json.loads(fh.read(clen).decode("utf-8"))
    glb.update({"magic": magic == 0x46546C67, "version": ver, "declared_length": length,
                "file_bytes": os.path.getsize(GLB), "json_chunk_type_ok": ctype == 0x4E4F534A,
                "meshes": len(j.get("meshes", [])), "nodes": len(j.get("nodes", [])),
                "materials": len(j.get("materials", [])), "images": len(j.get("images", [])),
                "textures": len(j.get("textures", [])), "cameras": len(j.get("cameras", [])),
                "extensionsUsed": j.get("extensionsUsed", []),
                "double_sided_count": len([m for m in j.get("materials", []) if m.get("doubleSided")]),
                "node_names_sorted": sorted(n.get("name", "") for n in j.get("nodes", [])),
                "material_names_sorted": sorted(m.get("name", "") for m in j.get("materials", []))})
res["glb"] = glb
res["glb_ok"] = (glb["magic"] and glb["version"] == 2 and glb["file_bytes"] <= 8 * 1024 * 1024
                 and glb["images"] == 0 and glb["textures"] == 0 and glb["cameras"] == 0
                 and glb["declared_length"] == glb["file_bytes"])
res["glb_nodes_match_blend"] = glb["node_names_sorted"] == sorted(o.name for o in bpy.data.objects)
res["glb_materials_match_blend"] = glb["material_names_sorted"] == sorted(m.name for m in bpy.data.materials)

print("SCROLL_CHECK " + json.dumps(res, ensure_ascii=False))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(res, fh, ensure_ascii=False, indent=2)