import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorHandlers, EuchreGameValues } from '../../../lib/euchre/definitions/game-state-definitions';
import useAnimationDeckState from '../phases/useAnimationDeckState';

/** Effects to run animations during specific points in the game flow/phases. This handles dealing cards for
 * initial deal and for regular play.
 */
const useDeckInitDealEffect = (
  state: EuchreGameValues,
  errorHandlers: ErrorHandlers,
  isDealStateInitialized: boolean,
  initialDealIsComplete: boolean,
  onBeginAnimationBeginDealForDealer: () => Promise<void>,
  onEndAnimationBeginDealForDealer: () => void,
  onBeginAnimationEndDealForDealer: () => void
) => {
  const { euchreSettings } = state;
  const { shouldBeginDealForDealer, shouldEndDealForDealer } = useAnimationDeckState(state);
  const initBeginDealForDealerEffect = useRef(false);
  const endBeginDealForDealerEffect = useRef(false);
  const initEndDealForDealerEffect = useRef(false);
  const [refsReady, setRefsReady] = useState(false);

  const dealAnimationEnabled = euchreSettings.shouldAnimateDeal;

  /** */
  const handleBeginAnimationBeginDealForDealer = useCallback(async () => {
    if (!dealAnimationEnabled) return;

    const runEffect =
      shouldBeginDealForDealer &&
      !initBeginDealForDealerEffect.current &&
      isDealStateInitialized &&
      refsReady;

    if (runEffect) {
      initBeginDealForDealerEffect.current = true;
      await onBeginAnimationBeginDealForDealer();
    }
  }, [
    dealAnimationEnabled,
    isDealStateInitialized,
    onBeginAnimationBeginDealForDealer,
    refsReady,
    shouldBeginDealForDealer
  ]);

  /** */
  const handleEndAnimationBeginDealForDealer = useCallback(() => {
    if (!dealAnimationEnabled) return;

    const runEffect = initialDealIsComplete && !endBeginDealForDealerEffect.current;

    if (runEffect) {
      endBeginDealForDealerEffect.current = true;

      onEndAnimationBeginDealForDealer();
    }
  }, [dealAnimationEnabled, initialDealIsComplete, onEndAnimationBeginDealForDealer]);

  /** */
  const handleBeginAnimationEndDealForDealer = useCallback(() => {
    if (!dealAnimationEnabled) return;

    const shouldAnimate = !initEndDealForDealerEffect.current && shouldEndDealForDealer;

    if (shouldAnimate) {
      initEndDealForDealerEffect.current = true;

      onBeginAnimationEndDealForDealer();
    }
  }, [dealAnimationEnabled, onBeginAnimationEndDealForDealer, shouldEndDealForDealer]);

  /** Effect to run at the initial entry point for dealing for dealer. Sets the cards into view before animation of the deal.
   */
  useEffect(() => {
    errorHandlers.catchAsync(
      handleBeginAnimationBeginDealForDealer,
      errorHandlers.onError,
      'beginAnimationForBeginDealForDealer'
    );
  }, [errorHandlers, handleBeginAnimationBeginDealForDealer]);

  /** Effect to run after the initial setup. This should run the animation for cards being dealt to players. */
  useEffect(() => {
    handleEndAnimationBeginDealForDealer();
  }, [handleEndAnimationBeginDealForDealer]);

  /** Effect to run after the deal the players is complete. Animates moving the cards to the new dealer. */
  useEffect(() => {
    handleBeginAnimationEndDealForDealer();
  }, [handleBeginAnimationEndDealForDealer]);

  return { setRefsReady };
};

export default useDeckInitDealEffect;
