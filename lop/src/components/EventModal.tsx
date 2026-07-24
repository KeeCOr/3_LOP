import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { EventCard, GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

const eventCardBackdrop: CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(245, 158, 11, 0.24), rgba(15, 23, 42, 0.92) 42%, rgba(22, 78, 99, 0.34)), radial-gradient(circle at 28% 18%, rgba(253, 224, 71, 0.28), transparent 26%), radial-gradient(circle at 76% 78%, rgba(14, 165, 233, 0.2), transparent 30%)',
};

const cardSceneFrame: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(254, 243, 199, 0.18), rgba(120, 53, 15, 0.08)), repeating-linear-gradient(45deg, rgba(251, 191, 36, 0.18) 0 2px, transparent 2px 9px)',
};

function getEventResultExplanation(card: EventCard): string {
  const effect = card.effect;

  switch (effect.kind) {
    case 'gold':
      return `Result: gain ${effect.amount} gold now. Next decision: spend it on troops, buildings, or toll safety.`;
    case 'troops':
      return `Result: add ${effect.amount} troops to your active piece. Next decision: press into combat or protect income land.`;
    case 'troop_boost':
      return effect.costPerTroop === 0
        ? `Result: reinforce for free up to ${effect.maxAmount} troops. Next decision: convert the bonus into a safer attack route.`
        : `Result: buy up to ${effect.maxAmount} emergency troops. Next decision: balance gold loss against battle tempo.`;
    case 'dice_bonus':
      return `Result: next roll gains +${effect.amount}. Next decision: choose which piece can turn that reach into the best tile event.`;
    case 'attack_boost':
      return `Result: next battle attack is x${effect.multiplier}. Next decision: look for a high-value enemy tile before the boost expires.`;
    case 'defense_boost':
      return `Result: next defense is x${effect.multiplier}. Next decision: hold a risky border or bait an enemy attack.`;
    case 'toll_exempt':
      return 'Result: the next toll can be ignored. Next decision: cross enemy territory without losing tempo.';
    case 'toll_double':
      return `Result: owned tolls double for ${effect.laps} lap(s). Next decision: route enemies through your strongest land.`;
    case 'build_discount':
      return `Result: the next build is discounted for ${effect.laps} lap(s). Next decision: upgrade the land that changes income or defense most.`;
    case 'garrison_reinforce':
      return `Result: owned land receives ${effect.amount} extra defenders. Next decision: use the safer board to expand or collect.`;
    case 'free_build':
      return 'Result: your next building is free. Next decision: pick the land where one upgrade changes the board most.';
    case 'dragon_summon':
      return 'Result: a dragon threat is queued on the board. Next decision: prepare troops before it blocks your route.';
    case 'move_to_tile':
      return 'Result: unlock a tile move choice. Next decision: choose where to reposition for the strongest follow-up event.';
    case 'move_to_shop':
      return 'Result: unlock the shop scene. Next decision: buy the resource that fixes your current weakest stat.';
    case 'reset_land':
      return 'Result: a land state resets. Next decision: re-evaluate ownership before committing your next move.';
    case 'tax_exempt':
      return 'Result: tax pressure is removed for now. Next decision: preserve gold for a stronger build or troop buy.';
    case 'defense_reinforce':
      return `Result: defense gains ${effect.amount} reinforcement. Next decision: choose whether to turtle or counterattack.`;
    default:
      return 'Result: the card changes your board state. Next decision: compare the new stats before moving again.';
  }
}

export default function EventModal({ state, dispatch }: Props) {
  const card = state.activeEvent!;
  const needsAction = card.effect.kind === 'move_to_tile' || card.effect.kind === 'move_to_shop';
  const resultExplanation = getEventResultExplanation(card);

  useEffect(() => {
    if (needsAction) return;
    const timer = setTimeout(() => dispatch({ type: 'APPLY_EVENT_CARD' }), 2000);
    return () => clearTimeout(timer);
  }, [needsAction, dispatch]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div
        className="relative w-full max-w-[380px] overflow-hidden rounded-2xl border border-amber-300/55 p-5 text-white text-center shadow-2xl shadow-black/40"
        style={eventCardBackdrop}
        data-event-card-visual="chance-card"
      >
        <div className="pointer-events-none absolute inset-3 rounded-xl border border-amber-100/20" />
        <div className="relative mb-4 rounded-xl border border-amber-200/35 px-4 py-5 shadow-inner shadow-black/30" style={cardSceneFrame}>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-amber-200/45 bg-black/30 text-4xl shadow-lg shadow-amber-900/30">
            ?
          </div>
          <h2 className="text-xl font-bold text-amber-200 drop-shadow">Chance Card</h2>
        </div>
        <p className="relative mb-3 text-lg leading-snug text-amber-50">{card.text}</p>
        <p
          className="relative mb-6 rounded-lg border border-amber-100/20 bg-black/25 px-3 py-2 text-left text-sm leading-5 text-amber-100"
          data-event-result-explanation="true"
        >
          {resultExplanation}
        </p>
        {state.currentTurn === 'player' && (
          <button
            onClick={() => dispatch({ type: 'APPLY_EVENT_CARD' })}
            className="relative min-h-11 rounded-lg bg-amber-500 px-8 py-3 font-bold text-slate-950 shadow-lg shadow-amber-950/30 hover:bg-amber-400"
          >
            Confirm
          </button>
        )}
      </div>
    </div>
  );
}