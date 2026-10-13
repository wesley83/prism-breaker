# Brick labels and the How to play legend

Armored bricks now display the number of hits remaining. Ordinary armor starts at 2; armor in Prism Citadel's final formation starts at 3. The label changes immediately after damage and disappears with the destroyed brick. An armored brick with one hit left displays 1.

Explosive bricks display a filled five-point star. Destroying one applies one hit to nearby bricks and can trigger an explosion chain; armored neighbors may survive. Switch bricks display an outlined diamond and open Electric City's glowing gates when destroyed. Regular one-hit bricks have no marker.

`public/brick-labels.js` provides the shared marker definitions and artwork used by the renderer and the How to play legend. White symbols and numbers sit on a dark badge; markers retain their contrast independently of world fog and tone mapping. Number textures and the star/diamond textures are cached and uploaded before play. Each brick has its own material so damaging one label cannot change another label that originally used the same texture.

The How to play section includes labeled previews of Regular, Armored, Explosive and Switch bricks, including the 3 → 2 → 1 countdown and the Citadel's three-hit armor. The legend uses one column on phones and two on larger screens.

Validation recorded October 13, 2026:

- Four new regressions and twelve engine checks passed. Coverage includes all eight generated worlds and every Citadel formation, actual three-hit damage and marker removal, independent per-brick materials, texture reuse, and shared legend artwork.
- Browser preview at phone width confirmed the countdown, destruction, outlined switch diamond and distinct explosive star. The How to play legend fit all four explanations without horizontal overflow; browser logs showed no rendering errors.
- Preview fixtures are local and do not submit community scores. Physical phone performance was not measured.

Rebuild the complete offline release before deployment. Normal publishing preserves the live score resource.

## Crystal artwork update

The header uses a custom vector interpretation of the stacked geometric lime lettering in the OG artwork. Its artwork dimensions are reserved in the page and it stays sharp at phone and desktop sizes. The light theme supplies a dark backing for contrast.

`public/crystal-bricks.js` builds shared gemstone geometry: a broad front face, eight cut corners/bevels and a body with real alpha transparency. A polished Three.js physical material uses small, locally drawn cube-map reflections. This avoids a screen-sized transmission/refraction pass while letting the arena show through the colored crystal. Collision sizes remain those of the original game.

Every surviving hit adds cracks according to `maxHp - hp`. The second fracture stage retains the first fissures and extends their branches. Three cached patterns give adjacent armored bricks different scars. Restored checkpoints use their stored hit counts to restore the right fracture stage. The final hit removes the brick and uses the existing shard effect.

Shared geometry, reflection sources and nine small crack textures are created once per Stage. Shader variants and crack textures are warmed during arena preparation. A hit swaps the crack texture and hit-count label; it does not create geometry, draw a texture or run a new full-screen effect. Both graphics settings use the same crystal/crack art.
