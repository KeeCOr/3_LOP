# LOP Layout And Onboarding Redesign

Date: 2026-05-13
Status: Approved direction; implementation plan is the next step

## Goal

Improve the LOP play experience by combining an A+C layout direction:

- A: keep the board as the main visual and decision surface.
- C: show only the current required action in a clear step bar.

The redesign covers the main play screen and the start/onboarding flow. It does not change core rules, balancing, AI behavior, or save data contracts unless implementation reveals a small UI-facing need.

## Current Problems

- The board, HUD, transient overlays, and modals compete for attention.
- Tile details are available, but they appear as small popups and are easy to lose.
- The player can be unsure what the next required action is during roll, piece selection, tile action, deploy, build, battle, and forced-sell phases.
- The start flow explains the rules, but it does not progressively guide the player from goal to settings to first strategic decision.
- Korean text and existing documents show encoding drift in some files, so UI copy must be handled carefully during edits.

## Play Screen Design

The play screen becomes a three-zone layout:

1. Top HUD: compact player summaries.
2. Main area: large board plus a persistent right-side detail panel.
3. Bottom action bar: the current step, primary action, secondary actions, and short reason text.

The board remains the largest element. Clicking or focusing a tile updates the right-side detail panel instead of relying primarily on floating tile popups. The panel shows tile name, owner, toll or price, garrison, buildings, lap production, and available actions. It also shows why an action is disabled when relevant, such as insufficient gold or no eligible troops.

The bottom action bar is phase-aware. It maps reducer phases to a readable next step:

- `roll`: roll dice.
- `select_piece`: choose a movable piece.
- `choose_move_tile`: choose a destination.
- `tile_event`: resolve the current tile.
- `deploy`: deploy troops.
- `build`: choose construction or upgrade.
- `battle`: resolve battle.
- `shop` or `mercenary`: complete market choice.
- `forced_sell`: pay or sell land.
- `end_turn`: waiting for next turn.

Modals remain for complex choices, but simple confirmations and guidance move into the action bar or the right panel where possible.

## Start And Onboarding Design

The start flow becomes three steps:

1. Goal: a concise explanation of winning, losing, turns, and board ownership.
2. Setup: player count and difficulty, with short descriptions for each option.
3. Character reveal: random character selection with ability summary and a first-turn strategy hint.

The first play turn should include lightweight contextual hints in the action bar. These hints should disappear naturally after the player completes the relevant action, without creating a separate tutorial mode.

## Components

Likely component changes:

- `Board`: owns the new shell layout, selected tile state, phase-to-action-bar mapping, and panel placement.
- `HUD`: becomes compact and scan-first, with less per-player detail.
- `BoardTile`: focuses on board readability and tile state, with reduced popup responsibility.
- New `TileDetailPanel`: persistent right-side tile and action context.
- New `TurnActionBar`: phase-aware next-step guidance and primary action placement.
- `StartScreen`: reorganized into goal, setup, and character reveal steps.

No new global state library is planned. Existing reducer state should remain the source of truth.

## Data Flow

`Board` receives `GameState` and `dispatch`, derives the currently selected tile, and passes state slices to the new panel and action bar.

`TurnActionBar` should not own game logic. It should translate existing phase and state into labels, helper text, and dispatch callbacks.

`TileDetailPanel` should read computed values through existing helpers such as `getToll`, `getLapIncome`, and `getLapTroops`.

## Error Handling And Edge Cases

- If no tile is selected, the panel shows the current active tile or a compact board guide.
- During animations, the action bar should indicate movement is in progress and avoid showing premature modal actions.
- On narrow screens, the right panel collapses below the board or becomes a tabbed panel to avoid crushing the board.
- Text must fit in buttons and panels without overlap on desktop and mobile.
- Existing Korean copy should be reviewed while editing to avoid preserving mojibake where clean copy is needed.

## Testing

Verification should include:

- `npm run build` inside `lop`.
- Manual browser check of the start flow.
- Manual browser check of the play screen through at least roll, select piece, move, tile action, and one modal.
- Responsive checks for desktop and narrow viewport.
- Required final packaging commands from `AGENTS.md` after implementation:
  - frontend build from the correct app directory.
  - Electron dist from `electron`.
  - portable executable copied to repository root.

## Out Of Scope

- Rule rebalance.
- New maps or tiles.
- New AI logic.
- Multiplayer.
- Large art direction replacement.
