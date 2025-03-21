import { GameEvent, GameEventType } from '@/app/hooks/euchre/useEventLog';
import { BidResult, EuchreGameInstance, EuchrePlayer, EuchreSettings } from './definitions';

const ENABLE_LOGGING = true;

function logBidResult(game: EuchreGameInstance, result: BidResult) {
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

function logDebugEvent(
  message: object | string | null | undefined,
  ...params: (object | string | null | undefined)[]
) {
  if (!ENABLE_LOGGING) return;
  console.log(message, params);
}

function createEvent(
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
function createRange(start: number, end: number): number[] {
  const result = [];

  for (let i = start; i <= end; i++) {
    result.push(i);
  }

  return result;
}

function isElementFullyVisible(element: HTMLElement, container: HTMLElement) {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const isFullyVisible =
    elementRect.top >= containerRect.top &&
    elementRect.left >= containerRect.left &&
    elementRect.bottom <= containerRect.bottom &&
    elementRect.right <= containerRect.right;

  return isFullyVisible;
}

function scrollElementIntoViewIfNeeded(element: HTMLElement, container: HTMLElement) {
  if (!isElementFullyVisible(element, container)) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
  }
}

export {
  scrollElementIntoViewIfNeeded,
  isElementFullyVisible,
  createEvent,
  createRange,
  logDebugEvent,
  logBidResult
};
