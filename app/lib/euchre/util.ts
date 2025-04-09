import { GameEvent, GameEventType } from '@/app/hooks/euchre/useEventLog';
import { BidResult, EuchreGameInstance, EuchrePlayer, EuchreSettings } from './definitions';

const ENABLE_LOGGING = true;

function logBidResult(game: EuchreGameInstance, result: BidResult) {
  if (!ENABLE_LOGGING) return;

  // const logValue = {
  //   dealer: game.dealer?.name,
  //   currentPlayer: game.currentPlayer?.name,
  //   playerHand: game.currentPlayer?.availableCards.map((c) => `${c.value} - ${c.suit}`),
  //   flipCard: `${game.trump?.value} - ${game.trump?.suit}`,
  //   bidResult: result
  // };

  // console.table(logValue);
}

/** Log error to console. */
function logDebugError(
  message: object | string | null | undefined,
  ...params: (object | string | null | undefined)[]
) {
  if (!ENABLE_LOGGING) return;

  const temp = message as GameEvent;

  if (temp && temp.type === 'e') {
    console.error(message, params);
  }
}

function createEvent(
  type: GameEventType,
  settings?: EuchreSettings,
  player?: EuchrePlayer,
  message?: string,
  ...params: (object | string | null | undefined)[]
): GameEvent {
  return {
    id: 0,
    time: new Date().toLocaleTimeString(),
    type: type,
    message: message,
    player: player?.name,
    team: player?.team,
    teamColor: 'orange' // player && settings ? player?.getTeamColor(settings) : undefined
  };
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

  return (
    elementRect.top >= containerRect.top &&
    elementRect.left >= containerRect.left &&
    elementRect.bottom <= containerRect.bottom &&
    elementRect.right <= containerRect.right
  );
}

function scrollElementIntoViewIfNeeded(element: HTMLElement, container: HTMLElement) {
  if (!isElementFullyVisible(element, container)) {
    element.scrollIntoView({
      behavior: 'smooth',
      inline: 'center'
    });
  }
}

export {
  scrollElementIntoViewIfNeeded,
  isElementFullyVisible,
  createEvent,
  createRange,
  logDebugError,
  logBidResult
};
