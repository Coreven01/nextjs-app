import { HandPhase } from '../../hooks/phases/useCardAnimationPhase';
import {
  InitHandHandlers,
  HandStateEffect,
  HandStateActions,
  HandStatePhases
} from '../../definitions/game-state-definitions';

const getEffectForInitHandState = (
  getHandPhase: () => HandPhase | undefined,
  resetForNewHand: () => void,
  addPhaseHandled: (phase: HandPhase, id: string) => void,
  addPhaseCompleted: (phase: HandPhase, id: string) => void,
  initHandHandler: InitHandHandlers,
  handId: string
) => {
  //#region Initialize Hand State Handlers
  const handleResetHand = async () => {
    await initHandHandler.onResetHandState();
    resetForNewHand();
  };

  const handleCreateHandState = async () => {
    addPhaseHandled(
      { phase: HandStatePhases.INIT, action: HandStateActions.CREATE_HAND },
      HandStateActions.CREATE_HAND
    );
    await initHandHandler.onCreateHandState();
  };

  const handleCreateCardState = async () => {
    addPhaseHandled({ phase: HandStatePhases.INIT, action: HandStateActions.CREATE_CARD }, handId);
    await initHandHandler.onCreateCardState();
    addPhaseCompleted({ phase: HandStatePhases.INIT, action: HandStateActions.CREATE_CARD }, handId);
  };

  const handleRegroupCards = async () => {
    addPhaseHandled({ phase: HandStatePhases.INIT, action: HandStateActions.REGROUP }, handId);
    await initHandHandler.onRegroupCards();
  };

  const handleAnimateRegroup = async () => {
    addPhaseHandled({ phase: HandStatePhases.INIT, action: HandStateActions.ANIMATE_REGROUP }, handId);
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
