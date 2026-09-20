"""Build the A Thousand Li of Rivers and Mountains special-exhibition room (white model).
Spec: SCROLL-GALLERY-SPEC.md v1 (2026-09-20), part 2.
Units: meters. X = walking direction, Y = scroll-wall side, Z = up.
"""
import bpy, os, math, json
from mathutils import Vector

ROOT = r"\\192.168.31.246\Media\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery"
BLEND_OUT = os.path.join(ROOT, "assets", "models", "blender", "scroll-gallery-v1.blend")
GLB_OUT = os.path.join(ROOT, "assets", "models", "scroll-gallery-v1.glb")

# ---------- scene reset ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1.0

COLLECTIONS = {}
def coll(name):
    if name not in COLLECTIONS:
        c = bpy.data.collections.new(name)
        scene.collection.children.link(c)
        COLLECTIONS[name] = c
    return COLLECTIONS[name]

# ---------- materials ----------
MATS = {}
def srgb_to_linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_rgba(h):
    h = h.lstrip("#")
    return tuple(srgb_to_linear(int(h[i:i+2], 16)) for i in (0, 2, 4)) + (1.0,)

def make_mat(name, hexcol, rough=0.8, metal=0.0, transmission=0.0, tint=None):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    col = hex_rgba(tint or hexcol)
    b.inputs["Base Color"].default_value = col
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if "Transmission Weight" in b.inputs:
        b.inputs["Transmission Weight"].default_value = transmission
    elif "Transmission" in b.inputs:
        b.inputs["Transmission"].default_value = transmission
    m.diffuse_color = col
    MATS[name] = m
    return m

make_mat("INK_WALL", "#1d2a26", 0.95)
make_mat("DARK_CEIL", "#14100c", 0.95)
make_mat("DARK_WALNUT", "#2a1d14", 0.70)
make_mat("STONE_FLOOR", "#4a4a48", 0.55)
make_mat("STONE_TRIM", "#b8b0a2", 0.65)
make_mat("CHARCOAL_PANEL", "#232323", 0.90)
make_mat("SILK_MOUNT", "#e8ddc4", 0.90)
make_mat("SILK_RIBBON", "#d9cba6", 0.90)
make_mat("GOLD_LINE", "#b08d3e", 0.35, 0.8)
make_mat("MUSEUM_GLASS", "#cfd8d4", 0.05, 0.0, 0.9, tint="#cfd8d4")
make_mat("LEATHER_DARK", "#241f19", 0.60)
make_mat("BRONZE_DARK", "#4d4237", 0.40, 0.9)
make_mat("BRONZE_PLAQUE", "#8a6f3c", 0.40, 0.9)
GREY = "#808080"
for i in range(1, 11):
    make_mat("scroll_slice_%02d" % i, GREY, 0.9)
for i in (1, 2):
    make_mat("scroll_colophon_%02d" % i, GREY, 0.9)
for i in (1, 2):
    make_mat("detail_print_%02d" % i, GREY, 0.9)
make_mat("TITLE_PLATE", GREY, 0.9)
make_mat("CREDIT_PLATE", GREY, 0.9)

# ---------- geometry helpers ----------
def mesh_obj(name, verts, faces, mat, colname, uvs=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    if uvs is not None:
        uvl = me.uv_layers.new(name="UVMap")
        for poly in me.polygons:
            for li in poly.loop_indices:
                vi = me.loops[li].vertex_index
                uvl.data[li].uv = uvs[vi]
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(mat)
    coll(colname).objects.link(ob)
    return ob

def box(name, x0, x1, y0, y1, z0, z1, mat, colname):
    v = [(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),
         (x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)]
    f = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    return mesh_obj(name, v, f, mat, colname)

def plane(name, axis, fixed, a0, a1, b0, b1, mat, colname, flip=False):
    """axis 'x': at x=fixed spanning y a0..a1, z b0..b1 - default normal -X.
    axis 'y': at y=fixed spanning x a0..a1, z b0..b1 - default normal +Y.
    axis 'z': at z=fixed spanning x a0..a1, y b0..b1 - default normal -Z.
    flip=True reverses the winding, therefore the normal. Faces must point at the
    room interior or they get backface-culled in the three.js viewer."""
    if axis == "x":
        v = [(fixed,a0,b0),(fixed,a1,b0),(fixed,a1,b1),(fixed,a0,b1)]
    elif axis == "y":
        v = [(a0,fixed,b0),(a1,fixed,b0),(a1,fixed,b1),(a0,fixed,b1)]
    else:
        v = [(a0,b0,fixed),(a1,b0,fixed),(a1,b1,fixed),(a0,b1,fixed)]
    f = [(0,1,2,3)] if flip else [(3,2,1,0)]
    uvs = [(0,0),(1,0),(1,1),(0,1)]
    return mesh_obj(name, v, f, mat, colname, uvs)

def aim(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

# ---------- 2.2 SHELL ----------
IX0, IX1 = 0.0, 16.0            # interior X
IY0, IY1 = -2.1, 2.1            # interior Y
IZ0, IZ1 = 0.0, 4.0             # interior Z
T = 0.3                          # wall thickness

plane("FLOOR", "z", IZ0, IX0 - T, IX1 + T, IY0 - T, IY1 + T, MATS["STONE_FLOOR"], "SHELL", flip=True)
plane("CEILING", "z", IZ1, IX0 - T, IX1 + T, IY0 - T, IY1 + T, MATS["DARK_CEIL"], "SHELL")

# end wall (X = 16)
box("WALL_END", IX1, IX1 + T, IY0 - T, IY1 + T, IZ0, IZ1, MATS["INK_WALL"], "SHELL")
# scroll wall (Y = +2.1) and opposite wall (Y = -2.1)
box("WALL_SCROLL", IX0 - T, IX1 + T, IY1, IY1 + T, IZ0, IZ1, MATS["INK_WALL"], "SHELL")
box("WALL_OPPOSITE", IX0 - T, IX1 + T, IY0 - T, IY0, IZ0, IZ1, MATS["INK_WALL"], "SHELL")

# entrance wall (X = 0) with a 1.6 x 2.4 door, centred on Y
DOOR_HW, DOOR_H = 0.8, 2.4
box("WALL_ENTRY_L", IX0 - T, IX0, IY0 - T, -DOOR_HW, IZ0, IZ1, MATS["INK_WALL"], "SHELL")
box("WALL_ENTRY_R", IX0 - T, IX0, DOOR_HW, IY1 + T, IZ0, IZ1, MATS["INK_WALL"], "SHELL")
box("WALL_ENTRY_TOP", IX0 - T, IX0, -DOOR_HW, DOOR_HW, DOOR_H, IZ1, MATS["INK_WALL"], "SHELL")

# stone portal trim (0.25 wide), protruding 0.05 into the room
PT, PW = 0.05, 0.25
box("TRIM_JAMB_L", IX0, IX0 + PT, -DOOR_HW - PW, -DOOR_HW, IZ0, DOOR_H + PW, MATS["STONE_TRIM"], "SHELL")
box("TRIM_JAMB_R", IX0, IX0 + PT, DOOR_HW, DOOR_HW + PW, IZ0, DOOR_H + PW, MATS["STONE_TRIM"], "SHELL")
box("TRIM_LINTEL", IX0, IX0 + PT, -DOOR_HW - PW, DOOR_HW + PW, DOOR_H, DOOR_H + PW, MATS["STONE_TRIM"], "SHELL")

# ceiling grid: 9 cross beams (along Y) + 2 edge beams (along X)
BEAM_W, BEAM_H, BEAM_Z0 = 0.16, 0.20, 3.8
beam_x = [round(2.8 + i * 1.6, 4) for i in range(9)]
for i, x in enumerate(beam_x, start=1):
    box("BEAM_CROSS_%02d" % i, x - BEAM_W / 2, x + BEAM_W / 2, IY0, IY1, BEAM_Z0, BEAM_Z0 + BEAM_H,
        MATS["DARK_WALNUT"], "SHELL")
for sgn, tag in ((1, "P"), (-1, "N")):
    y = 1.9 * sgn
    box("BEAM_EDGE_" + tag, IX0, IX1, y - BEAM_W / 2, y + BEAM_W / 2, BEAM_Z0, BEAM_Z0 + BEAM_H,
        MATS["DARK_WALNUT"], "SHELL")

# ---------- 2.3 shadow / title wall ----------
box("SHADOW_WALL", 2.0, 2.4, -0.75, 1.85, 0.0, 2.6, MATS["CHARCOAL_PANEL"], "PROPS")
plane("TITLE_PLATE_OBJ", "x", 2.0 - 0.006, 0.55 - 0.6, 0.55 + 0.6, 1.5 - 0.4, 1.5 + 0.4,
      MATS["TITLE_PLATE"], "PROPS")

# ---------- 2.4 scroll wall ----------
BX0, BX1 = 3.0, 15.0                     # hanging band
plane("SILK_MOUNT_OBJ", "y", 2.080, BX0, BX1, 1.0725, 1.8275, MATS["SILK_MOUNT"], "SCROLL", flip=True)
plane("GOLD_LINE_TOP", "y", 2.078, BX0, BX1, 1.8155, 1.8275, MATS["GOLD_LINE"], "SCROLL", flip=True)
plane("GOLD_LINE_BOTTOM", "y", 2.078, BX0, BX1, 1.0725, 1.0845, MATS["GOLD_LINE"], "SCROLL", flip=True)

SLICE_W, SLICE_H, SLICE_Y, SLICE_ZC = 1.192, 0.515, 2.075, 1.45
for i in range(1, 11):
    x0 = BX0 + (i - 1) * SLICE_W
    plane("scroll_slice_%02d" % i, "y", SLICE_Y, x0, x0 + SLICE_W,
          SLICE_ZC - SLICE_H / 2, SLICE_ZC + SLICE_H / 2,
          MATS["scroll_slice_%02d" % i], "SCROLL", flip=True)

# scroll rod at the head of the scroll (X = 2.95)
ROD_X, ROD_Y = 2.95, 2.05
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.045, depth=0.86, location=(ROD_X, ROD_Y, 1.45))
rod = bpy.context.object
rod.name = "SCROLL_ROD"
rod.data.name = "SCROLL_ROD"
rod.data.materials.append(MATS["DARK_WALNUT"])
for c in list(rod.users_collection):
    c.objects.unlink(rod)
coll("SCROLL").objects.link(rod)
for i, z in enumerate((1.88, 1.02), start=1):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.055, depth=0.03, location=(ROD_X, ROD_Y, z))
    cap = bpy.context.object
    cap.name = "SCROLL_ROD_CAP_%02d" % i
    cap.data.name = "SCROLL_ROD_CAP_%02d" % i
    cap.data.materials.append(MATS["DARK_WALNUT"])
    for c in list(cap.users_collection):
        c.objects.unlink(cap)
    coll("SCROLL").objects.link(cap)
plane("SILK_RIBBON_OBJ", "y", 2.05, ROD_X - 0.03, ROD_X + 0.03, 1.53, 1.88, MATS["SILK_RIBBON"], "SCROLL", flip=True)

# ---------- 2.5 colophon on the end wall ----------
plane("scroll_colophon_01", "x", 15.975, 0.3, 1.5, 1.45 - SLICE_H / 2, 1.45 + SLICE_H / 2,
      MATS["scroll_colophon_01"], "SCROLL")
plane("scroll_colophon_02", "x", 15.975, -0.9, 0.3, 1.45 - SLICE_H / 2, 1.45 + SLICE_H / 2,
      MATS["scroll_colophon_02"], "SCROLL")
plane("CREDIT_PLATE_OBJ", "x", 15.98, -1.4 - 0.7, -1.4 + 0.7, 1.3 - 0.45, 1.3 + 0.45,
      MATS["CREDIT_PLATE"], "PROPS")

# ---------- 2.6 furniture and props ----------
# glass rail along the scroll wall
RAIL_X0, RAIL_X1, RAIL_Y, RAIL_GLASS_H, RAIL_T = 2.9, 15.1, 0.90, 1.05, 0.012
box("RAIL_BRONZE_BASE", RAIL_X0, RAIL_X1, RAIL_Y - 0.03, RAIL_Y + 0.03, 0.0, 0.04,
    MATS["BRONZE_DARK"], "PROPS")
box("RAIL_GLASS", RAIL_X0, RAIL_X1, RAIL_Y - RAIL_T / 2, RAIL_Y + RAIL_T / 2, 0.04, 0.04 + RAIL_GLASS_H,
    MATS["MUSEUM_GLASS"], "PROPS")
# bench
bench = box("BENCH", 8.8 - 0.9, 8.8 + 0.9, -1.5 - 0.225, -1.5 + 0.225, 0.0, 0.45, MATS["LEATHER_DARK"], "PROPS")
# spec 2.6 wants a softly rounded leather bench; bevel, explicit segments (no subdivision modifier)
try:
    bpy.context.view_layer.objects.active = bench
    bench.select_set(True)
    bv = bench.modifiers.new("BEVEL", "BEVEL")
    bv.width = 0.045
    bv.segments = 3
    bv.limit_method = "ANGLE"
    bv.angle_limit = 0.7
    bpy.ops.object.modifier_apply(modifier="BEVEL")
    bench.select_set(False)
except Exception as exc:
    print("BENCH_BEVEL_SKIPPED", exc)
# two detail prints on the opposite wall
for i, x in enumerate((6.5, 10.5), start=1):
    box("detail_frame_%02d" % i, x - 0.55, x + 0.55, -2.1, -2.06, 1.5 - 0.375, 1.5 + 0.375,
        MATS["DARK_WALNUT"], "PROPS")
    plane("detail_print_%02d" % i, "y", -2.055, x - 0.475, x + 0.475, 1.5 - 0.31, 1.5 + 0.31,
          MATS["detail_print_%02d" % i], "PROPS")
# section plaques on the scroll wall
for i, x in enumerate((6.6, 9.0, 11.4, 13.8), start=1):
    box("PLAQUE_%02d" % i, x - 0.08, x + 0.08, 2.075, 2.081, 1.45 - 0.05, 1.45 + 0.05,
        MATS["BRONZE_PLAQUE"], "PROPS")

# ---------- 2.7 light markers ----------
def marker(name, loc, target):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_type = "PLAIN_AXES"
    ob.empty_display_size = 0.3
    ob.location = loc
    coll("LIGHT_MARKERS").objects.link(ob)
    aim(ob, target)
    return ob

scroll_x = [round(3.6 + i * 1.2, 4) for i in range(10)]
for i, x in enumerate(scroll_x, start=1):
    marker("LT_SCROLL_%02d" % i, (x, 1.45, 3.75), (x, 2.08, 1.45))
marker("LT_TITLE", (2.2, 0.55, 3.90), (2.2, 0.55, 0.0))
marker("LT_COLOPHON", (15.4, 0.3, 3.75), (15.98, 0.3, 1.45))
marker("LT_DETAIL_01", (6.5, -1.6, 3.75), (6.5, -2.08, 1.5))
marker("LT_DETAIL_02", (10.5, -1.6, 3.75), (10.5, -2.08, 1.5))

# ---------- stats + self-check ----------
bpy.context.view_layer.update()
tris = 0
meshes = [o for o in bpy.data.objects if o.type == "MESH"]
for o in meshes:
    o.data.calc_loop_triangles()
    tris += len(o.data.loop_triangles)

slices = [o for o in bpy.data.objects if o.name.startswith("scroll_slice_")]
slice_len = sum(SLICE_W for _ in slices)
empties = sorted(o.name for o in bpy.data.objects if o.type == "EMPTY")
want_empties = ["LT_COLOPHON", "LT_DETAIL_01", "LT_DETAIL_02", "LT_TITLE"] + ["LT_SCROLL_%02d" % i for i in range(1, 11)]

report = {
    "blender": bpy.app.version_string,
    "objects": len(bpy.data.objects),
    "meshes": len(meshes),
    "triangles": tris,
    "collections": sorted(c.name for c in bpy.data.collections),
    "materials": len(bpy.data.materials),
    "slices": len(slices),
    "slice_total_length": round(slice_len, 4),
    "interior_length": IX1 - IX0,
    "interior_width": IY1 - IY0,
    "interior_height": IZ1 - IZ0,
    "door_height": DOOR_H,
    "beam_x": beam_x,
    "empties": empties,
    "empties_ok": empties == sorted(want_empties),
    "slice_own_material": all(len(o.data.materials) == 1 and o.data.materials[0].name == o.name for o in slices),
    "slice_uv_ok": all(len(o.data.uv_layers) == 1 for o in slices),
}

os.makedirs(os.path.dirname(BLEND_OUT), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
bpy.ops.export_scene.gltf(
    filepath=GLB_OUT, export_format="GLB", export_apply=True,
    export_cameras=False, export_lights=False, export_extras=False,
)
report["blend_bytes"] = os.path.getsize(BLEND_OUT)
report["glb_bytes"] = os.path.getsize(GLB_OUT)
print("SCROLL_REPORT " + json.dumps(report, ensure_ascii=False))
