import { useCallback, useEffect, useRef } from 'react';
import { ErrorHandlers, EuchreGameState } from '../../../lib/euchre/definitions/game-state-definitions';
import useAnimationDeckState from '../effects/deal/useDeckStateEffect';
import useDeckAnimationPhase from '../phases/useDeckAnimationPhase';

/** Effect to handle reseting the deck state after the game deck changed for a new deal. */
const useDeckRegularDealEffect = (
  state: EuchreGameState,
  errorHandlers: ErrorHandlers,
  regularDealComplete: boolean,
  onBeginAnimationForRegularPlay: () => Promise<void>,
  onEndAnimationForRegularPlay: () => Promise<void>
) => {
  const { euchreSettings } = state;
  //const { shouldBeginDealCards, shouldResetDealState } = useDeckAnimationPhase(state);
  const dealAnimationEnabled = euchreSettings.shouldAnimateDeal;
  const initBeginDealForRegularPlayEffect = useRef(false);
  const endBeginDealForRegularPlayEffect = useRef(false);

  /** */
  const handleBeginAnimationForRegularPlay = useCallback(async () => {
    if (!dealAnimationEnabled) return;
    // const runEffect = !initBeginDealForRegularPlayEffect.current && shouldBeginDealCards;

    // if (runEffect) {
    //   initBeginDealForRegularPlayEffect.current = true;
    //   await onBeginAnimationForRegularPlay();
    // }
  }, [dealAnimationEnabled, onBeginAnimationForRegularPlay]);

  /** */
  const handleEndAnimationForRegularPlay = useCallback(async () => {
    if (!dealAnimationEnabled) return;

    // const runEffect =
    //   regularDealComplete && !endBeginDealForRegularPlayEffect.current && shouldBeginDealCards;

    // if (runEffect) {
    //   endBeginDealForRegularPlayEffect.current = true;
    //   await onEndAnimationForRegularPlay();
    // }
  }, [dealAnimationEnabled, onEndAnimationForRegularPlay, regularDealComplete]);

  /** Animate dealing cards for regular play. This should be run at the beginning of each hand during regular play. */
  useEffect(() => {
    errorHandlers.catchAsync(
      handleBeginAnimationForRegularPlay,
      errorHandlers.onError,
      'handleBeginAnimationForRegularPlay'
    );
  }, [errorHandlers, handleBeginAnimationForRegularPlay]);

  /** After cards have been dealt for regular play, animate moving cards to player's hand area. After animation is complete,
   * move to the next state to show player's cards. This is the last state to be run in this hook.
   * Player card animation is handled is useCardState.ts
   */
  useEffect(() => {
    errorHandlers.catchAsync(
      handleEndAnimationForRegularPlay,
      errorHandlers.onError,
      'handleEndAnimationForRegularPlay'
    );
  }, [errorHandlers, handleEndAnimationForRegularPlay]);

  useEffect(() => {
    // if (
    //   shouldResetDealState &&
    //   (initBeginDealForRegularPlayEffect.current || endBeginDealForRegularPlayEffect.current)
    // ) {
    //   initBeginDealForRegularPlayEffect.current = false;
    //   endBeginDealForRegularPlayEffect.current = false;
    // }
  });
  return {};
};

export default useDeckRegularDealEffect;
