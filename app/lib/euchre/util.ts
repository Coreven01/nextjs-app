import { GameEvent, GameEventType } from '@/app/hooks/euchre/useEventLog';
import { BidResult, EuchreGameInstance, EuchrePlayer, EuchreSettings } from './definitions';

const ENABLE_LOGGING = true;

export function logBidResult(game: EuchreGameInstance, result: BidResult) {
  if (!ENABLE_LOGGING) return;

  const logValue = {
    dealer: game.dealer?.name,
    currentPlayer: game.currentPlayer?.name,
    playerHand: game.currentPlayer?.availableCards.map((c) => `${c.value} - ${c.suit}`),
    flipCard: `${game.trump?.value} - ${game.trump?.suit}`,
    bidResult: result
  };

  console.table(logValue);
}

export function logDebugEvent(
  message: object | string | null | undefined,
  ...params: (object | string | null | undefined)[]
) {
  if (!ENABLE_LOGGING) return;
  console.log(message, params);
}

export function createEvent(
  type: GameEventType,
  settings?: EuchreSettings,
  player?: EuchrePlayer,
  message?: string,
  ...params: (object | string | null | undefined)[]
): GameEvent {
  const retval: GameEvent = {
    id: 0,
    time: new Date().toLocaleTimeString(),
    type: type,
    message: message,
    player: player?.name,
    team: player?.team,
    teamColor: player && settings ? player?.getTeamColor(settings) : undefined
  };

  return retval;
}

/** Create range of numbers between the given start and end. Includes both start and end value. */
export function createRange(start: number, end: number): number[] {
  const result = [];

  for (let i = start; i <= end; i++) {
    result.push(i);
  }

  return result;
}
