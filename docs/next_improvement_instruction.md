# LOP Next Improvement Instruction

Date: 2026-06-24

## Goal
Turn the current biggest project issue into a small, executable improvement batch. This file is intentionally scoped so the next worker can start without rereading the whole workspace audit.

## Instructions
1. Build the first-session choice chain around one clear loop: choose event, receive character/stat consequence, unlock the next scene.
2. Add result explanations so each short choice says what changed and why the next decision matters.
3. Verify desktop wrapper/build path and document the authoritative build command before the next release package.

## Completion Rules
- Do not include discarded projects in this batch.
- If gameplay, UI, systems, content, controls, build behavior, or project scope changes, update the project planning document and update log before build/release.
- If runtime source changes, run the nearest available validation and then perform the required build/package step from the project instructions.
- If a folder or asset looks ambiguous, document the decision instead of deleting it.

## 2026-06-30 Completion Note
- First-session chain verified: the start flow already moves goal -> setup -> character reveal -> board loop.
- Narrow supplement added: chance-card results now explain the immediate consequence and why the next decision matters.
- Desktop wrapper path documented: run `npm run build` in `C:/Development/3_LOP/lop`, then `npm run dist` in `C:/Development/3_LOP/electron`.