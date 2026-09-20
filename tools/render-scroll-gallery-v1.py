"""Render the four acceptance views for scroll-gallery-v1.

Opens the delivered blend, adds render-only lights and a camera, writes the JPEGs,
and exits without saving, so the delivered blend/glb keep LIGHT_MARKERS-only lighting.

Optional overrides after `--`:
    --out=DIR              output directory (default <root>/verify-shots)
    --only=name,name       render only the named shots (without the .jpg suffix)
"""
import bpy, os, sys, math
from mathutils import Vector

ROOT = r"\\192.168.31.246\Media\BaiduNetdiskWorkspace\myagent-work\zcode\vgallery"
BLEND = os.path.join(ROOT, "assets", "models", "blender", "scroll-gallery-v1.blend")
OUT = os.path.join(ROOT, "verify-shots")
only = None
if "--" in sys.argv:
    for a in sys.argv[sys.argv.index("--") + 1:]:
        if a.startswith("--out="):
            OUT = a.split("=", 1)[1]
        elif a.startswith("--only="):
            only = set(a.split("=", 1)[1].split(","))
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=BLEND)
scene = bpy.context.scene

for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
    try:
        scene.render.engine = eng
        break
    except TypeError:
        continue
print("ENGINE", scene.render.engine)
try:
    scene.eevee.use_raytracing = True
except Exception as e:
    print("raytracing flag skipped:", e)
try:
    scene.eevee.taa_render_samples = 64
except Exception:
    pass

scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 92
scene.render.film_transparent = False
scene.render.resolution_percentage = 100
# the room is deliberately a dark display case; lift the render-only exposure so the
# acceptance stills remain readable without touching the delivered model's materials
scene.view_settings.exposure = 0.62

world = bpy.data.worlds.new("render-world")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.035, 0.038, 0.037, 1.0)
bg.inputs[1].default_value = 1.0

# ---- render-only lights ----
n = 0
for ob in bpy.data.objects:
    if ob.type != "EMPTY" or not ob.name.startswith("LT_"):
        continue
    ld = bpy.data.lights.new("R_" + ob.name, type="SPOT")
    ld.color = (1.0, 0.851, 0.627)
    ld.energy = 600.0
    ld.spot_size = 0.5
    ld.spot_blend = 0.6
    ld.shadow_soft_size = 0.25
    lo = bpy.data.objects.new("R_" + ob.name, ld)
    scene.collection.objects.link(lo)
    lo.location = ob.location
    lo.rotation_euler = ob.rotation_euler
    n += 1
print("RENDER_LIGHTS", n)

def area(name, loc, target, energy, size, color):
    d = bpy.data.lights.new(name, type="AREA")
    d.energy = energy
    d.size = size
    d.color = color
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location = Vector(loc)
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return o

# weak cool fill so the shell is not pure black, plus hall light spilling through the door
area("R_FILL", (8.0, -1.30, 3.30), (8.0, -1.30, 0.0), 520.0, 4.0, (0.55, 0.62, 0.68))
area("R_ENTRY", (-2.40, -0.20, 2.40), (0.20, -0.25, 1.50), 95.0, 1.6, (1.0, 0.95, 0.88))

cam_data = bpy.data.cameras.new("R_CAM")
cam = bpy.data.objects.new("R_CAM", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

HIDE_ELEVATION = ({"WALL_OPPOSITE", "SHADOW_WALL", "TITLE_PLATE_OBJ", "BENCH",
                   "detail_frame_01", "detail_frame_02", "detail_print_01", "detail_print_02"}
                  | {"BEAM_CROSS_%02d" % i for i in range(1, 10)}
                  | {"BEAM_EDGE_P", "BEAM_EDGE_N"})
HIDE_TOP = {"CEILING"} | {"BEAM_CROSS_%02d" % i for i in range(1, 10)}

SHOTS = [
    # 1. entrance: from the hall, framed by the portal; charcoal screen wall, gallery revealed to the right
    dict(name="scroll-v1-entrance", loc=(-0.95, -0.30, 1.55), target=(9.00, 0.05, 1.30),
         lens=18.0, res=(1600, 1000), hide=set()),
    # 2. scroll wall seen at 45 degrees
    dict(name="scroll-v1-oblique", loc=(6.00, -1.80, 1.60), target=(10.60, 2.05, 1.45),
         lens=34.0, res=(1600, 1000), hide=set()),
    # 3. true orthographic elevation of the scroll wall (near wall, beams and foreground furniture hidden)
    dict(name="scroll-v1-elevation", loc=(8.00, -6.00, 2.00), target=(8.00, 2.10, 2.00),
         ortho=16.4, res=(1800, 560), hide=HIDE_ELEVATION),
    # 4. plan from above with the ceiling removed
    dict(name="scroll-v1-top", loc=(8.00, 0.00, 14.00), target=(8.00, 0.00, 0.00),
         ortho=17.2, res=(1800, 620), hide=HIDE_TOP),
]

for s in SHOTS:
    if only and s["name"] not in only:
        continue
    for ob in scene.objects:
        if ob.type == "MESH":
            ob.hide_render = ob.name in s["hide"]
    if s.get("ortho"):
        cam_data.type = "ORTHO"
        cam_data.ortho_scale = s["ortho"]
    else:
        cam_data.type = "PERSP"
        cam_data.lens = s.get("lens", 35.0)
    cam.location = Vector(s["loc"])
    cam.rotation_euler = (Vector(s["target"]) - Vector(s["loc"])).to_track_quat("-Z", "Y").to_euler()
    scene.render.resolution_x, scene.render.resolution_y = s["res"]
    path = os.path.join(OUT, s["name"] + ".jpg")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("WROTE", s["name"], os.path.getsize(path))
print("DONE")