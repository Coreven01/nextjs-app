import { useCallback, useEffect, useState } from 'react';
import { EuchreGameState, ErrorHandlers, DeckState } from '../definitions/game-state-definitions';

/** Effect to handle reseting the deck state after the game deck changed for a new deal. */
const useDeckResetEffect = (
  state: EuchreGameState,
  errorHandlers: ErrorHandlers,
  gameDeckState: DeckState | undefined,
  onDeckReset: () => void
) => {
  const { euchreGame, euchreSettings, euchreGameFlow } = state;
  const [isDealStateInitialized, setDealStateInitialized] = useState(false);
  const dealAnimationEnabled = euchreSettings.shouldAnimateDeal;

  /** Function that's called from an effect to initialize the game deck state for a new deal.
   */
  const handleDeckReset = useCallback(() => {
    if (!dealAnimationEnabled) return;

    const validDeck = euchreGame.deck.length === 24 && !euchreGame.deck.find((c) => c.value === 'P');

    if (!isDealStateInitialized && validDeck && euchreGameFlow.hasGameStarted) {
      onDeckReset();
      setDealStateInitialized(true);
    }
  }, [
    dealAnimationEnabled,
    euchreGame.deck,
    euchreGameFlow.hasGameStarted,
    isDealStateInitialized,
    onDeckReset
  ]);

  /** Re-initialize deck state handler when the deck state hand ID changes. */
  const handleResetForExistingDeck = useCallback(() => {
    if (!dealAnimationEnabled) return;

    if (gameDeckState !== undefined && gameDeckState.handId !== euchreGame.handId && isDealStateInitialized) {
      setDealStateInitialized(false);
    }
  }, [dealAnimationEnabled, euchreGame.handId, gameDeckState, isDealStateInitialized]);

  /** Initial game deck state for dealer */
  useEffect(() => {
    try {
      handleDeckReset();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'handleDeckReset');
    }
  }, [errorHandlers, handleDeckReset]);

  useEffect(() => {
    try {
      handleResetForExistingDeck();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'handleResetForExistingDeck');
    }
  }, [errorHandlers, handleResetForExistingDeck]);

  return { isDealStateInitialized };
};

export default useDeckResetEffect;
