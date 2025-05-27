import useDeckAnimationPhase from '../../../../app/hooks/euchre/phases/useDeckAnimationPhase';
import getEffectForInitDeckState from '../../util/deck/deckStateInitializeUtil';
import getEffectForDealForDealer from '../../util/deck/deckStateDealForDealerUtil';
import getEffectForRegularDeal from '../../util/deck/deckStateRegularDealUtil';
import {
  DealForDealerHandlers,
  DealStateEffect,
  DeckState,
  EuchreGameState,
  InitDealHandlers,
  RegularDealHandlers
} from '../../definitions/game-state-definitions';

/** Used to return a handler that should be run from an effect for different phases of the game. */
const useDeckStateEffect = (
  state: EuchreGameState,
  gameDeckState: DeckState | undefined,
  cardRefsReady: boolean,
  initDealHandler: InitDealHandlers,
  dealForDealerHandlers: DealForDealerHandlers,
  regularDealHandlers: RegularDealHandlers
) => {
  const { getDeckPhase, resetForNewDeal, addPhaseExecuted, addPhaseCompleted, setCurrentInitializedId } =
    useDeckAnimationPhase(state, gameDeckState, cardRefsReady);

  /** Get the function that should be executed for the effect for the current deck state. */
  const getEffectForDeckState = (): DealStateEffect => {
    const initEffect = getEffectForInitDeckState(
      getDeckPhase,
      resetForNewDeal,
      addPhaseExecuted,
      setCurrentInitializedId,
      initDealHandler,
      state.euchreGame.handId
    );

    if (initEffect.func) return initEffect;

    const dealForDealerEffect = getEffectForDealForDealer(
      getDeckPhase,
      addPhaseExecuted,
      addPhaseCompleted,
      dealForDealerHandlers
    );

    if (dealForDealerEffect.func) return dealForDealerEffect;

    const regularDealEffect = getEffectForRegularDeal(
      getDeckPhase,
      addPhaseExecuted,
      addPhaseCompleted,
      regularDealHandlers
    );

    if (regularDealEffect.func) return regularDealEffect;

    return {};
  };

  return { getEffectForDeckState };
};

export default useDeckStateEffect;
