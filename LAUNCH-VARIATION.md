# Fresh-ball launch variation

Fresh balls released at the start of a world, at each Citadel formation, after a lost life, or after checkpoint restoration now launch at 8–18 degrees from vertical, choosing either left or right. Launch velocity stays normalized to the existing world speed.

Adventure and Practice use the run ID to vary the launch sequence between runs. Daily Challenge uses the daily seed so all players receive the same launch sequence for a given world and fresh-ball launch number. This uses a separate random generator and does not consume the brick power-up random stream.

The fresh-launch count persists in checkpoints; older saves default to zero. The count advances when a fresh ball is released. Sticky paddle catches retain their stored rebound velocity, including automatic release when a wide paddle shrinks, and do not advance the fresh-launch sequence.

Implementation reviewed in source. No automated tests were added or run. Deployment readback confirms the published runtime matches the released source.
