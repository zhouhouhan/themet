# Blender gallery rebuild · 2026-09-14

The current user request supersedes the earlier procedural Three.js / generated mesh construction plan. Rebuild the European Paintings room in Blender using `reference/gallery-target.png` as the visual reference. It is an artistic interpretation, not a measured reconstruction of a specific Met gallery.

## Deliverables

- `tools/build-gallery-v4.py`: repeatable Blender scene construction.
- `assets/models/blender/gallery-v4.blend`: editable scene with packed original paintings.
- `assets/models/blender/gallery-v4-front.png`: reference camera render.
- `assets/models/gallery-v4.glb`: web asset with textures capped at 2048 pixels.
- `assets/models/blender/crown-user.glb`: supplied crown, retained unchanged as source. Its identity and provenance are not asserted to be the Crown of the Andes.
- `assets/paintings/met-originals/manifest.json`: official Met API metadata and image URLs. All ten included records returned `isPublicDomain: true`, a nonempty `primaryImage`, and `department: European Paintings`.

## Design

12 × 24 m room, Venetian red plaster, cream marble door surrounds, a curved glazed barrel skylight, jointed herringbone walnut floor, layered gilt frames with beading, leather benches, and a bronze / portoro / glass central vitrine. Dimensions are design choices inferred from the image, not museum measurements.

The old v1–v3 assets remain for comparison; the previous webpage is saved at `reference/index-v3.html`. The new entry point loads v4 and starts from the image's central perspective. WASD / arrows move; R resets; drag and wheel retain orbit / zoom controls.

## Validation boundaries

Blender Cycles is the visual reference. The browser uses a smaller light rig, so reflections and global illumination differ. The first task is the gallery environment; audio, living paintings, deep zoom, and full mobile navigation remain future work. No remote deployment is included in this change.

## Rebuild and review

Run Blender in background with these scripts in sequence: `tools/build-gallery-v4.py`, `tools/refine-gallery-v4.py`, `tools/polish-gallery-v4.py`, then `tools/optimize-gallery-v4.py`. The last script reloads the saved master, merges architecture by material and exports only the web GLB, without modifying the editable master. The polish script is intended to run once after a fresh build/refine, as it adjusts bench placement.

Validation: the GLB loads in the local Three.js page and `window.__galleryLoaded` is true. Geometry merging reduced the measured browser draw calls from 3,474 to 102. This is a draw-call comparison, not a frame-rate benchmark. Image previews were visually reviewed and adjusted for camera composition, crown-light artifacts, wall color and bench placement.

The small decorative busts are original simplified sculptural studies, not replicas of identified Met sculpture. The ten paintings are actual Met collection images. Their aspect ratios are preserved; sizes on the walls are curated display sizes rather than the original works' measured sizes.

Final lighting pass: run tools/final-light-gallery-v4.py after polish and before optimize. Keyboard single-step verification moved the camera 0.22 m at dt=0.1 and R restored [0, 2.45, 10.7].

Final verification: optimized GLB 37,644,112 bytes; editable blend 63,164,759 bytes. Final browser render loaded successfully with 14 textures and 78 draw calls from the adjusted starting camera. Front and oblique PNGs were visually reviewed. No remote deployment performed.
