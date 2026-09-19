# V5 refinement

The user approved v4 and asked to continue refining against the reference image. V4 is retained unchanged. V5 opens the existing saved v4 master and adds finer detail.

Changes: photographed parquet and marble surfaces, scanned marble busts, tactile plaster and leather, cornice dentils, gilt corner scrollwork, crown pedestal fillets, warm wall bounce and a showcase floor light pool. Artwork images and supplied crown remain the same.

Resources downloaded from Poly Haven, CC0:
- https://polyhaven.com/a/marble_bust_01
- https://polyhaven.com/a/marble_01
- https://polyhaven.com/a/diagonal_parquet
The downloaded file manifests are retained under assets/materials/polyhaven. These are decorative material/sculpture assets, not asserted to be Met collection objects. Powered by Poly Haven.

Reproduce: run tools/refine-gallery-v5.py in Blender, followed by tools/optimize-gallery-v5.py. The first reads v4 and saves v5; the second reads the saved v5 master and exports the GLB without changing the master. Curve mouldings and font labels are converted for the web export only.

After refine-gallery-v5.py, run tone-gallery-v5.py once to apply the final walnut tone and photographed portoro veining, then run optimize-gallery-v5.py. The previous entry page is retained as reference/index-v4.html. Original Met painting images and records are unchanged.

Final validation: front/oblique Cycles renders reviewed, v5 GLB loaded and rendered in browser (20 textures, 50 draw calls from the initial camera). GLB reduced from 53,149,384 to 48,330,960 bytes by compact-glb-images.py; the 78,922,228-byte Blender master retains original resources. Runtime parquet color and roughness reproduce the Blender grading that glTF cannot serialize from the procedural node chain. Both v4 and v5 remain available. No remote deployment. For fast final rendering, render-gallery-v5.py explicitly selects RTX 3070 OptiX.
