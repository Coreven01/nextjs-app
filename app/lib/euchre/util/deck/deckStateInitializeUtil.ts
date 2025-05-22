import { DeckPhase } from '../../../../hooks/euchre/phases/useDeckAnimationPhase';
import {
  DeckStateActions,
  DeckStatePhases,
  InitDealHandlers,
  DealStateEffect
} from '../../definitions/game-state-definitions';

const getEffectForInitDeckState = (
  getDeckPhase: () => DeckPhase | undefined,
  resetForNewDeal: () => void,
  addPhaseExecuted: (phase: DeckPhase) => void,
  setCurrentInitializedId: (id: string) => void,
  initDealHandler: InitDealHandlers,
  handId: string
) => {
  //#region Initialize Deck State Handlers
  const handleDealerChanged = async () => {
    await initDealHandler.onDealerChanged();
    resetForNewDeal();

    // setMoveCardsIntoPositionComplete(false);
    // setBeginRegularDealComplete(false);
    // isDealStateInitializedRef.current = false;
    // initBeginDealForRegularDealEffect.current = false;
    // endBeginDealForRegularDealEffect.current = false;
  };

  const handleStateCreating = async () => {
    addPhaseExecuted({ phase: DeckStatePhases.INIT, action: DeckStateActions.CREATE });
    setCurrentInitializedId(handId);
    await initDealHandler.onStateCreating();

    // isDealStateInitializedRef.current = true;
    // initMoveCardsIntoPosition.current = false;
  };

  // const handleCreateState = async () => {
  //   // initBeginDealForRegularDealEffect.current = false;
  //   // endBeginDealForRegularDealEffect.current = false;
  //   await initDealHandler.onCreateState();
  // };

  const localInitDealHandlers: InitDealHandlers = {
    //onReinitializeState: handleReinitializeState,
    onDealerChanged: handleDealerChanged,
    onStateCreating: handleStateCreating
  };

  //#endregion

  const getEffectForDeckPhase = (): DealStateEffect => {
    const phase = getDeckPhase();
    const retval: DealStateEffect = { statePhase: DeckStatePhases.INIT };

    if (!phase || phase.phase !== DeckStatePhases.INIT) return retval;

    switch (phase.action) {
      case DeckStateActions.CREATE:
        retval.stateAction = DeckStateActions.CREATE;
        retval.func = localInitDealHandlers.onStateCreating;
        break;
      case DeckStateActions.RESET:
        retval.stateAction = DeckStateActions.RESET;
        retval.func = undefined;
        break;
      case DeckStateActions.REINITIALIZE:
        retval.stateAction = DeckStateActions.REINITIALIZE;
        retval.func = localInitDealHandlers.onDealerChanged;
        break;
    }

    // if (deckResetConditions.shouldSetDeckState) {
    //   retval.func = localResetHandlers.onDeckReset;
    //   retval.stateConditionName = 'shouldSetDeckState';
    //   retval.stateHandlerName = 'onDeckReset';
    // } else if (deckResetConditions.shouldReinitializeDeckState) {
    //   retval.func = localResetHandlers.onReinitializeState;
    //   retval.stateConditionName = 'shouldReinitializeDeckState';
    //   retval.stateHandlerName = 'onReinitializeState';
    // } else if (deckResetConditions.shouldResetForNewDeal) {
    //   retval.func = localResetHandlers.onNewDeal;
    //   retval.stateConditionName = 'shouldResetForNewDeal';
    //   retval.stateHandlerName = 'onNewDeal';
    // }

    return retval;
  };

  return getEffectForDeckPhase();
};
export default getEffectForInitDeckState;
