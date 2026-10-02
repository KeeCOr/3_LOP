# LOP Layout Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved A+C redesign: a board-first play layout with a persistent tile detail panel, a phase-aware action bar, and a clearer start/onboarding flow.

**Architecture:** Keep the reducer as the source of truth. Add small presentational components for the tile panel and action bar, with phase copy derived from state in a pure helper. Keep complex decisions in existing modals.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Electron packaging.

---

## Files

- Create `lop/src/lib/turnActionInfo.ts`: pure phase-to-guidance mapping used by the action bar.
- Create `lop/src/components/TurnActionBar.tsx`: bottom phase guide and compact forced-sell guidance.
- Create `lop/src/components/TileDetailPanel.tsx`: persistent selected tile details.
- Modify `lop/src/components/Board.tsx`: A+C shell layout, selected tile state, panel/action bar placement.
- Modify `lop/src/components/HUD.tsx`: compact scan-first player summaries.
- Modify `lop/src/components/BoardTile.tsx`: reduce popup pressure and make board tiles more stable in the new grid.
- Modify `lop/src/components/StartScreen.tsx`: goal, setup, random character reveal flow.
- Update `docs/LOP_기획서.md` and `docs/LOP_기획서.html`: summarize the layout/onboarding change.

## Tasks

### Task 1: Phase Guidance Helper

- [ ] Create `lop/src/lib/turnActionInfo.ts` with `getTurnActionInfo(state, isAnimating)` returning title, description, step label, and tone for every `TurnPhase`.
- [ ] Import the helper only from UI components; do not dispatch from the helper.
- [ ] Run `npm run build` from `lop` after wiring the helper to catch type errors.

### Task 2: Persistent Right Panel

- [ ] Create `TileDetailPanel.tsx`.
- [ ] Show selected tile name, owner, toll/price, troops, garrison composition, building summary, lap production, and short action hint.
- [ ] Use existing helpers `getToll`, `getLapIncome`, and `getLapTroops`.
- [ ] On small screens, render the panel below the board via responsive Tailwind classes.

### Task 3: Bottom Action Bar

- [ ] Create `TurnActionBar.tsx`.
- [ ] Use `getTurnActionInfo` for phase copy.
- [ ] Show current player, turn phase, dice result if present, and immediate helper text.
- [ ] Keep actual action controls in existing modals and `DiceRoller`; the bar guides rather than duplicating complex choices.

### Task 4: Board Shell

- [ ] Modify `Board.tsx` to use the three-zone layout: compact HUD, board plus panel, bottom action bar.
- [ ] Add selected tile state initialized from active tile, deploy tile, selected piece position, or start tile.
- [ ] Keep existing modal behavior intact.
- [ ] Ensure animation gating still prevents modal flashes.

### Task 5: HUD And Tile Readability

- [ ] Compact `HUD.tsx` into scan-friendly rows with current-turn emphasis.
- [ ] Adjust `BoardTile.tsx` spacing so the board remains readable with the side panel.
- [ ] Keep piece click behavior and selected tile info behavior unchanged except for routing details into `TileDetailPanel`.

### Task 6: Start Flow

- [ ] Modify `StartScreen.tsx` into goal, setup, and reveal states.
- [ ] Keep the random character selection behavior.
- [ ] Add a first-turn strategy hint based on the selected character.
- [ ] Avoid preserving mojibake in visible new copy.

### Task 7: Docs, Build, Package

- [ ] Update `docs/LOP_기획서.md` and `docs/LOP_기획서.html`.
- [ ] Run `npm run build` in `lop`.
- [ ] Run the required root build command if present; if absent, report the mismatch.
- [ ] Run `npm run dist` in `electron`.
- [ ] Copy the produced portable exe to the repository root and remove older root portable exe files.
