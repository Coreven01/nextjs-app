import { useRef, useState } from 'react';
import {
  EuchreGameState,
  HandState,
  HandStateAction,
  HandStateActions,
  HandStatePhase,
  HandStatePhases
} from '../../../lib/euchre/definitions/game-state-definitions';
import { EuchreGameFlow } from '../reducers/gameFlowReducer';
import { EuchreAnimateType } from '../reducers/gameAnimationFlowReducer';
import { EuchrePauseType } from '../reducers/gamePauseReducer';

const getPhaseKey = (phase: HandPhase) => `${phase.phase}__${phase.action}` as const;

export interface HandPhase {
  phase: HandStatePhase;
  action: HandStateAction;
}

const useCardAnimationPhase = (
  state: EuchreGameState,
  handState: HandState | undefined,
  cardRefsReady: boolean
) => {
  const executedActions = useRef(new Set<string>());
  const [completedActions, setCompletedActions] = useState(new Set<string>());

  const { euchreGame, euchreGameFlow, euchreAnimationFlow, euchrePauseState } = state;

  const gameState = {
    shouldCreateHandState:
      euchreGameFlow.gameFlow === EuchreGameFlow.END_DEAL_CARDS &&
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE,
    shouldCreateCardState:
      euchreGameFlow.gameFlow === EuchreGameFlow.END_DEAL_CARDS &&
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
      euchrePauseState.pauseType === EuchrePauseType.ANIMATE,
    shouldAnimateBeginPassDeal:
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_PASS_DEAL &&
      euchreAnimationFlow.animationType === EuchreAnimateType.NONE &&
      euchrePauseState.pauseType === EuchrePauseType.ANIMATE,
    shouldReorderHand:
      euchreGameFlow.gameFlow === EuchreGameFlow.END_ORDER_TRUMP &&
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE,
    shouldAnimateTrickFinished:
      euchreGameFlow.gameFlow === EuchreGameFlow.TRICK_FINISHED &&
      euchreAnimationFlow.animationType === EuchreAnimateType.NONE &&
      euchrePauseState.pauseType === EuchrePauseType.ANIMATE,
    shoudUpdateCardStateForTurnEnd:
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_PLAY_CARD &&
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
      euchrePauseState.pauseType === EuchrePauseType.NONE,
    shoudUpdateCardStateForTurn:
      euchreAnimationFlow.animationType === EuchreAnimateType.NONE &&
      euchrePauseState.pauseType === EuchrePauseType.USER_INPUT &&
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_PLAY_CARD
  };

  const addPhaseExecuted = (phase: HandPhase) => {
    executedActions.current.add(getPhaseKey(phase));
  };

  const removePhaseExecuted = (phase: HandPhase) => {
    executedActions.current.delete(getPhaseKey(phase));
  };

  const hasPhaseExecuted = (phase: HandPhase) => {
    return executedActions.current.has(getPhaseKey(phase));
  };

  const addPhaseCompleted = (phase: HandPhase) => {
    setCompletedActions((prev) => {
      prev.add(getPhaseKey(phase));
      return new Set<string>(prev);
    });
  };

  const removePhaseCompleted = (phase: HandPhase) => {
    setCompletedActions((prev) => {
      prev.delete(getPhaseKey(phase));
      return new Set<string>(prev);
    });
  };

  const hasPhaseCompleted = (phase: HandPhase) => {
    return completedActions.has(getPhaseKey(phase));
  };

  const resetForNewHand = () => {
    removePhaseExecuted({
      phase: HandStatePhases.INIT,
      action: HandStateActions.CREATE_HAND
    });
    removePhaseExecuted({
      phase: HandStatePhases.INIT,
      action: HandStateActions.CREATE_CARD
    });
    removePhaseCompleted({
      phase: HandStatePhases.INIT,
      action: HandStateActions.CREATE_CARD
    });
    removePhaseExecuted({
      phase: HandStatePhases.INIT,
      action: HandStateActions.REGROUP
    });
    removePhaseExecuted({
      phase: HandStatePhases.INIT,
      action: HandStateActions.ANIMATE_REGROUP
    });

    //   initForNewHandEffect.current = false;
    //   setInitCardStateCreated(false);
    //   setInitForCardsRegroup(false);
    //   await initHandler.onResetHandState();
  };

  const getPhaseForInit = (): HandPhase | undefined => {
    const handStateCreated = hasPhaseExecuted({
      phase: HandStatePhases.INIT,
      action: HandStateActions.CREATE_HAND
    });
    const cardStateCreated = hasPhaseExecuted({
      phase: HandStatePhases.INIT,
      action: HandStateActions.CREATE_CARD
    });
    const cardStateCreateCompleted = hasPhaseCompleted({
      phase: HandStatePhases.INIT,
      action: HandStateActions.CREATE_CARD
    });
    const cardsRegrouped = hasPhaseExecuted({
      phase: HandStatePhases.INIT,
      action: HandStateActions.REGROUP
    });
    const cardsRegroupAnimated = hasPhaseExecuted({
      phase: HandStatePhases.INIT,
      action: HandStateActions.ANIMATE_REGROUP
    });

    const resetHandState =
      handState !== undefined && handState.handId !== euchreGame.handId && handStateCreated;
    const createHandState = gameState.shouldCreateHandState && !handStateCreated;
    const createCardState = gameState.shouldCreateCardState && handState !== undefined && !cardStateCreated;
    const regroup = cardStateCreateCompleted && !cardsRegrouped;
    const animateRegroup = cardRefsReady && cardsRegrouped && !cardsRegroupAnimated;

    if (resetHandState) return { phase: HandStatePhases.INIT, action: HandStateActions.RESET };
    if (createHandState) return { phase: HandStatePhases.INIT, action: HandStateActions.CREATE_HAND };
    if (createCardState) return { phase: HandStatePhases.INIT, action: HandStateActions.CREATE_CARD };
    if (regroup) return { phase: HandStatePhases.INIT, action: HandStateActions.REGROUP };
    if (animateRegroup) return { phase: HandStatePhases.INIT, action: HandStateActions.ANIMATE_REGROUP };

    return undefined;
  };

  const getHandPhase = (): HandPhase | undefined => {
    return getPhaseForInit();
  };

  return {
    getHandPhase,
    resetForNewHand,
    addPhaseExecuted,
    removePhaseExecuted,
    addPhaseCompleted,
    removePhaseCompleted
  };
};
export default useCardAnimationPhase;
