import { HandPhase } from '../../../../hooks/euchre/phases/useCardAnimationPhase';
import {
  DeckStatePhases,
  InitHandHandlers,
  HandStateEffect,
  HandStateActions,
  HandStatePhases
} from '../../definitions/game-state-definitions';

const getEffectForInitHandState = (
  getHandPhase: () => HandPhase | undefined,
  resetForNewHand: () => void,
  addPhaseExecuted: (phase: HandPhase) => void,
  addPhaseCompleted: (phase: HandPhase) => void,
  initHandHandler: InitHandHandlers
) => {
  //#region Initialize Hand State Handlers
  const handleResetHand = async () => {
    await initHandHandler.onResetHandState();
    resetForNewHand();
  };

  const handleCreateHandState = async () => {
    addPhaseExecuted({ phase: DeckStatePhases.INIT, action: HandStateActions.CREATE_HAND });
    await initHandHandler.onCreateHandState();
  };

  const handleCreateCardState = async () => {
    addPhaseExecuted({ phase: DeckStatePhases.INIT, action: HandStateActions.CREATE_CARD });
    await initHandHandler.onCreateCardState();
    addPhaseCompleted({ phase: DeckStatePhases.INIT, action: HandStateActions.CREATE_CARD });
  };

  const handleRegroupCards = async () => {
    addPhaseExecuted({ phase: DeckStatePhases.INIT, action: HandStateActions.REGROUP });
    await initHandHandler.onRegroupCards();
  };

  const handleAnimateRegroup = async () => {
    addPhaseExecuted({ phase: DeckStatePhases.INIT, action: HandStateActions.ANIMATE_REGROUP });
    await initHandHandler.onAnimateRegroupCards();
  };

  const localInitHandHandlers: InitHandHandlers = {
    onResetHandState: handleResetHand,
    onCreateHandState: handleCreateHandState,
    onCreateCardState: handleCreateCardState,
    onRegroupCards: handleRegroupCards,
    onAnimateRegroupCards: handleAnimateRegroup
  };

  //#endregion

  const getEffectForHandPhase = (): HandStateEffect => {
    const phase = getHandPhase();
    const retval: HandStateEffect = { statePhase: HandStatePhases.INIT };

    if (!phase || phase.phase !== HandStatePhases.INIT) return retval;

    switch (phase.action) {
      case HandStateActions.RESET:
        retval.stateAction = HandStateActions.RESET;
        retval.func = localInitHandHandlers.onResetHandState;
        break;
      case HandStateActions.CREATE_HAND:
        retval.stateAction = HandStateActions.CREATE_HAND;
        retval.func = localInitHandHandlers.onCreateHandState;
        break;
      case HandStateActions.CREATE_CARD:
        retval.stateAction = HandStateActions.CREATE_CARD;
        retval.func = localInitHandHandlers.onCreateCardState;
        break;
      case HandStateActions.REGROUP:
        retval.stateAction = HandStateActions.REGROUP;
        retval.func = localInitHandHandlers.onRegroupCards;
        break;
      case HandStateActions.ANIMATE_REGROUP:
        retval.stateAction = HandStateActions.ANIMATE_REGROUP;
        retval.func = localInitHandHandlers.onAnimateRegroupCards;
        break;
    }

    return retval;
  };

  return getEffectForHandPhase();
};

export default getEffectForInitHandState;
