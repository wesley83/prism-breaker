# Interface and first power-up update

- Center cinematic bonus paragraphs by preserving automatic horizontal margins.
- Match Adventure and Daily Challenge action sizing, colors and subtitle hierarchy, including when a Continue checkpoint is present.
- Cosmic Reef already has a 15-second dedicated cinematic. Ignore repeated launch-key events when skipping scenes, allow a 750 ms keyboard input grace period, and replay pending completed-world scenes on checkpoint resume.
- Before enabling game controls, prepare two reusable objects for each of eight power-up types, asynchronously compile their materials, upload shared label and halo textures, and render the bloom pipeline twice while the canvas is hidden. Keep pooled objects across resets and bound idle pools to eight per type. Additional drops reuse uploaded symbol textures.
- Prepare a newly selected graphics mode while the settings dialog is open; suspend gameplay while preparation is underway. Low effects retains its bloom bypass.

Manually inspected desktop and 390-pixel phone start layouts, centered Cosmic Reef bonus captions and transition to Prism Citadel. No frame-rate guarantee across all hardware is implied; the first-drop initialization work has been moved out of active play. Automated suites were not run.

Shader precompilation reference: https://threejs.org/docs/pages/WebGLRenderer.html#compileAsync
