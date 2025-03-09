import { BidResult, EuchreGameInstance } from './definitions';

const ENABLE_LOGGING = true;

export function logBidResult(game: EuchreGameInstance, result: BidResult) {
  if (!ENABLE_LOGGING) return;

  const logValue = {
    dealer: game.dealer?.name,
    currentPlayer: game.currentPlayer?.name,
    playerHand: game.currentPlayer?.hand.map((c) => `${c.value} - ${c.suit}`),
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
