Original prompt: 现在按照 problems.md 中的要求，对本游戏项目进行系统化的升级

## Scope
- Target platform: Douyin mini-game first.
- Layout target: 9:16 portrait.
- Product direction: upgrade, not small fixes.

## Completed before this turn
- Added endless mode and challenge mode.
- Added coins, purchases for extra reverse/reset, clear-3-block ability, auto-reset on deadlock, achievements modal, results modal, pause/settings modal.
- Reworked the app shell for portrait play and Douyin-safe layout.
- Added `window.render_game_to_text` and `window.advanceTime`.
- Updated challenge time limits to `60 / 120 / 180`.
- Tightened HUD and converted the bottom actions into a floating toolbar.
- Shifted the UI toward a cleaner retro-tech / cyber-neon direction.

## Third Pass (2026-03-28)
- Replaced the menu illustration with a slowly floating cube hero in `src/app/template.ts` and `src/styles/main.css`.
- Refreshed the menu text so the mode descriptions and challenge timing match the current design.
- Updated block visuals in `src/scene/GameScene.ts`:
  - warmer porcelain-like block color
  - darker edge lines
  - darker, higher-contrast arrow decals
- Rewrote arrow-face selection as explicit “all 4 faces parallel to the movement direction” logic.
- Increased level density in `src/core/LevelGenerator.ts` by biasing generation toward smaller block shapes, which raises block count without enlarging board dimensions.
- Rebuilt `src/audio/AudioManager.ts` to support external BGM files:
  - menu BGM: `/audio/menu-bgm.mp4`
  - gameplay BGM: `/audio/game-bgm.mp4`
  - start/end fade smoothing for softer loop transitions
  - synthesized BGM fallback if the files are missing
- Added `public/audio/PLACE_BGM_FILES_HERE.txt` so the drop-in path is explicit.

## Verification
- `npm run build` passed after the third pass.
- Ran a Playwright-driven Edge capture against the local dev server.
- Reviewed:
  - `output/menu-latest.png`
  - `output/game-latest.png`
  - `output/render-state.json`
  - `output/console.log`
- Observed results:
  - floating cube menu hero rendered correctly
  - updated block palette rendered correctly
  - arrows were visible on the side/top faces parallel to the movement direction
  - sampled level 1 run generated `18` blocks, confirming higher density than the previous version
- Console only showed a generic missing-resource `404`; no new gameplay script errors surfaced during capture.

## Notes
- The project now prefers external BGM files but does not hard-fail if they are absent.
- Playwright local package is present, but the session used system Edge via Playwright because bundled browser binaries were not installed.

## Fourth Pass (2026-03-28)
- Replaced bitmap arrow decals in `src/scene/GameScene.ts` with vector arrow geometry attached directly to block faces.
- Increased decal face offset slightly to reduce coplanar z-fighting.
- Reworked level occupancy generation in `src/core/LevelGenerator.ts`:
  - generate a compact allowed-cell volume first
  - enforce approximate center symmetry by mirroring occupied cells
  - keep the overall shape clustered instead of fully filling the rectangular bounding box
  - still prefer small blocks to keep the piece count high

## Fourth Pass Verification
- `npm run build` passed.
- Captured and reviewed `output/game-latest-2.png`.
- Captured and reviewed `output/render-state-2.json`.
- Sampled level 1 generated `16` blocks in a clustered non-rectangular shape, confirming the new occupancy mask is active.

## Fifth Pass (2026-03-28)
- Replaced the single dirty off-white block color in `src/scene/GameScene.ts` with a clean pastel gameplay palette:
  - light blue
  - mint
  - peach
  - lavender
  - blush
  - light lime
- Kept the arrows dark so contrast remains strong on every block color.
- Expanded the level system from 3 levels to 5 levels:
  - level 1: `2x4x4`
  - level 2: `3x4x4`
  - level 3: `4x4x4`
  - level 4: `4x6x4`
  - level 5: `4x8x4`
- Rebalanced challenge timers in `src/core/LevelConfig.ts` to:
  - `60 / 90 / 120 / 150 / 180` seconds
- Updated `LevelId` and persistent-history validation so records and unlock progress accept all 5 levels.
- Updated menu challenge copy in `src/app/template.ts` to reflect the 5-level timing ladder.

## Fifth Pass Verification
- `npm run build` passed.
- Captured and reviewed `output/game-latest-3.png`.
- Captured and reviewed `output/render-state-3.json`.
- Sampled level 1 remained playable with `16` blocks and `7` removable blocks at spawn.

## Sixth Pass (2026-03-28)
- Fixed the up/down arrow direction bug in `src/scene/GameScene.ts` by removing the extra Y-axis reversal in the render-layer mapping.
- Simplified the menu in `src/app/template.ts`:
  - removed the subtitle under the game title
  - removed the small explanatory lines inside the two mode buttons
  - removed the small Douyin-reserve helper text in the menu footer
- Moved the compact gameplay/mode explanations into the settings panel.
- Added matching settings-note styles in `src/styles/main.css`.

## Sixth Pass Verification
- `npm run build` passed.
- Captured and reviewed `output/menu-latest-4.png`.
- Captured and reviewed `output/game-latest-4.png`.
- Captured and reviewed `output/render-state-4.json`.
- Sampled level 1 remained playable with `14` blocks and `7` removable blocks at spawn.

## Seventh Pass (2026-03-28)
- Unified block visuals in `src/scene/GameScene.ts` to a single clean white surface with dark arrows.
- Expanded the level system from 5 to 6 levels in `src/core/LevelConfig.ts`.
- Reworked generation again in `src/core/LevelGenerator.ts` so each level now has:
  - a target block count
  - a target occupied-cell count
  - an explicit silhouette family (`cube`, `sphere`, `heart`, `diamond`)
- Updated the generator to:
  - select occupied cells by shape score with center symmetry
  - partition the occupied volume into an exact or near-exact target number of axis-aligned sliders
- Updated `LevelId` and history/progress validation to accept level 6.
- Moved the 6-level timing/shape explanation into the settings panel.

## Seventh Pass Verification
- `npm run build` passed.
- Verified generated block counts through a temporary compiled check:
  - level 1: `16`
  - level 2: `24`
  - level 3: `36`
  - level 4: `54`
  - level 5: `81`
  - level 6: `122`
- Captured and reviewed:
  - `output/menu-latest-5.png`
  - `output/settings-latest-5.png`
  - `output/game-latest-5.png`

## Eighth Pass (2026-03-28)
- Added explicit per-level solve personalities in `src/core/LevelConfig.ts` and `src/core/LevelGenerator.ts`:
  - `balanced`
  - `radial`
  - `vertical`
  - `layered`
- Updated occupied-cell partitioning so merge-axis preference changes by level personality, making later levels feel different instead of only larger.
- Optimized `src/core/MoveValidator.ts`:
  - build one `Grid3D` per query batch
  - reuse that grid while checking all blocks
  - avoid rebuilding the same occupancy grid once per block
- Optimized `src/scene/GameScene.ts`:
  - switched OrbitControls to non-damped updates
  - added dirty-render invalidation so the scene skips redraws while fully idle
  - keep rendering active only during camera motion, block animation, bursts, resize, or state sync
- Optimized `src/app/App.ts`:
  - throttled `GameController.tick()` to `100ms`
  - reset the tick clock cleanly on level start, restart, return-to-menu, and debug time jumps

## Eighth Pass Verification
- `npm run build` passed.
- Remaining upper bound: very large late levels still carry a high object count because each block still owns body, picker, edges, and 4 arrow meshes.
- If more optimization is needed after this pass, the next meaningful step is batching or instancing arrow/body visuals rather than further CSS/UI trimming.

## Ninth Pass (2026-03-28)
- Reworked the menu structure in `src/app/template.ts` and `src/styles/main.css`:
  - achievements and settings now share the same top-row button style
  - endless/challenge buttons are pushed lower in the composition
  - the empty hero area is replaced by a multi-block collision-style motion scene with slow rotation
- Added a dedicated level-select modal in `src/app/template.ts` and `src/app/App.ts`.
- Changed the mode-entry flow in `src/app/App.ts` so tapping endless/challenge opens level selection first, then starts the chosen unlocked level.
- Cleaned and localized the app-side UI strings in `src/app/App.ts`.

## Ninth Pass Verification
- `npm run build` passed.

## Tenth Pass (2026-03-28)
- Reworked the pause/settings experience in `src/app/App.ts`, `src/app/template.ts`, and `src/styles/main.css`:
  - modal-open state now hides the gameplay toolbelt and hint behind the overlay
  - settings card is now scrollable and uses grid-based action layout to avoid button overlap
  - settings notes no longer mention the reverse / clear / reset tools
- Changed the clear ability in `src/app/App.ts`:
  - no manual selection flow
  - consuming the clear charge now immediately picks up to 3 active blocks at random
  - each selected block still plays the shatter animation before removal is finalized

## Tenth Pass Verification
- `npm run build` passed.
