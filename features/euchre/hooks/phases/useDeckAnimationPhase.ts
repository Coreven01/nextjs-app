import { useRef, useState } from 'react';

import { EuchreAnimateType } from '../../state/reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../../state/reducers/gameFlowReducer';
import { EuchrePauseType } from '../../state/reducers/gamePauseReducer';
import {
  DeckStatePhase,
  DeckStateAction,
  EuchreGameState,
  DeckState,
  DeckStatePhases,
  DeckStateActions
} from '../../definitions/game-state-definitions';

const getPhaseKey = (phase: DeckPhase) => `${phase.phase}__${phase.action}` as const;

export interface DeckPhase {
  phase: DeckStatePhase;
  action: DeckStateAction;
}

/** Controls which effect phase should be run based on the game state.  */
const useDeckAnimationPhase = (
  state: EuchreGameState,
  deckState: DeckState | undefined,
  cardRefsReady: boolean
) => {
  const executedActions = useRef(new Set<string>());
  const [completedActions, setCompletedActions] = useState(new Set<string>());
  const idForReinitializeState = useRef('');

  const { euchreGame, euchreGameFlow, euchreAnimationFlow, euchrePauseState } = state;

  const isAnimatePhase =
    euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
    euchrePauseState.pauseType === EuchrePauseType.ANIMATE;

  const gameState = {
    shouldBeginDealForDealer:
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_FOR_DEALER && isAnimatePhase,
    shouldEndDealForDealer: euchreGameFlow.gameFlow === EuchreGameFlow.END_DEAL_FOR_DEALER && isAnimatePhase,
    shouldBeginDealCards: euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_CARDS && isAnimatePhase,
    shouldResetDealState: euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_BID_FOR_TRUMP
  };

  const setCurrentInitializedId = (id: string) => {
    idForReinitializeState.current = id;
  };

  const addPhaseExecuted = (phase: DeckPhase) => {
    executedActions.current.add(getPhaseKey(phase));
  };

  const removePhaseExecuted = (phase: DeckPhase) => {
    executedActions.current.delete(getPhaseKey(phase));
  };

  const hasPhaseExecuted = (phase: DeckPhase) => {
    return executedActions.current.has(getPhaseKey(phase));
  };

  const addPhaseCompleted = (phase: DeckPhase) => {
    setCompletedActions((prev) => {
      prev.add(getPhaseKey(phase));
      return new Set<string>(prev);
    });
  };

  const removePhaseCompleted = (phase: DeckPhase) => {
    setCompletedActions((prev) => {
      prev.delete(getPhaseKey(phase));
      return new Set<string>(prev);
    });
  };

  const hasPhaseCompleted = (phase: DeckPhase) => {
    return completedActions.has(getPhaseKey(phase));
  };

  const resetForNewDeal = () => {
    removePhaseExecuted({ phase: DeckStatePhases.INIT, action: DeckStateActions.CREATE });
    removePhaseExecuted({ phase: DeckStatePhases.REGULAR_DEAL, action: DeckStateActions.MOVE });
    removePhaseExecuted({
      phase: DeckStatePhases.REGULAR_DEAL,
      action: DeckStateActions.START_ANIMATE_BEGIN
    });
    removePhaseExecuted({ phase: DeckStatePhases.REGULAR_DEAL, action: DeckStateActions.END_ANIMATE_BEGIN });
    removePhaseCompleted({ phase: DeckStatePhases.REGULAR_DEAL, action: DeckStateActions.MOVE });
    removePhaseCompleted({
      phase: DeckStatePhases.REGULAR_DEAL,
      action: DeckStateActions.START_ANIMATE_BEGIN
    });
  };

  const getPhaseForInit = (): DeckPhase | undefined => {
    const validDeck = euchreGame.deck.length === 24 && !euchreGame.deck.find((c) => c.value === 'P');
    const deckStateCreated = hasPhaseExecuted({
      phase: DeckStatePhases.INIT,
      action: DeckStateActions.CREATE
    });

    const regularDealExecuted =
      hasPhaseExecuted({
        phase: DeckStatePhases.REGULAR_DEAL,
        action: DeckStateActions.START_ANIMATE_BEGIN
      }) ||
      hasPhaseExecuted({ phase: DeckStatePhases.REGULAR_DEAL, action: DeckStateActions.END_ANIMATE_BEGIN });

    const reinitializeDeckState =
      deckState !== undefined && idForReinitializeState.current !== euchreGame.handId && deckStateCreated;
    const createDeckState = !deckStateCreated && validDeck && euchreGameFlow.hasGameStarted;
    const reset = gameState.shouldResetDealState && regularDealExecuted;

    if (reinitializeDeckState) return { phase: DeckStatePhases.INIT, action: DeckStateActions.REINITIALIZE };
    if (createDeckState) return { phase: DeckStatePhases.INIT, action: DeckStateActions.CREATE };
    if (reset) return { phase: DeckStatePhases.INIT, action: DeckStateActions.RESET };

    return undefined;
  };

  const getPhaseForDealForDealer = (): DeckPhase | undefined => {
    const deckStateCreated = hasPhaseExecuted({
      phase: DeckStatePhases.INIT,
      action: DeckStateActions.CREATE
    });
    const positionMoved = hasPhaseExecuted({
      phase: DeckStatePhases.DEAL_FOR_DEALER,
      action: DeckStateActions.MOVE
    });
    const positionMovedComplete = hasPhaseCompleted({
      phase: DeckStatePhases.DEAL_FOR_DEALER,
      action: DeckStateActions.MOVE
    });
    const hasStartAnimateBegin = hasPhaseExecuted({
      phase: DeckStatePhases.DEAL_FOR_DEALER,
      action: DeckStateActions.START_ANIMATE_BEGIN
    });
    const hasStartAnimateBeginCompleted = hasPhaseCompleted({
      phase: DeckStatePhases.DEAL_FOR_DEALER,
      action: DeckStateActions.START_ANIMATE_BEGIN
    });
    const hasEndAnimateBegin = hasPhaseExecuted({
      phase: DeckStatePhases.DEAL_FOR_DEALER,
      action: DeckStateActions.END_ANIMATE_BEGIN
    });
    const hasStartAnimateEnd = hasPhaseExecuted({
      phase: DeckStatePhases.DEAL_FOR_DEALER,
      action: DeckStateActions.START_ANIMATE_END
    });

    const moveIntoPosition =
      gameState.shouldBeginDealForDealer && !positionMoved && deckStateCreated && cardRefsReady;
    const startAnimateBegin =
      gameState.shouldBeginDealForDealer && positionMovedComplete && !hasStartAnimateBegin;
    const endAnimateBegin = hasStartAnimateBeginCompleted && !hasEndAnimateBegin;
    const startAnimateEnd = false && !hasStartAnimateEnd && gameState.shouldEndDealForDealer;

    if (moveIntoPosition) return { phase: DeckStatePhases.DEAL_FOR_DEALER, action: DeckStateActions.MOVE };
    if (startAnimateBegin)
      return { phase: DeckStatePhases.DEAL_FOR_DEALER, action: DeckStateActions.START_ANIMATE_BEGIN };
    if (endAnimateBegin)
      return { phase: DeckStatePhases.DEAL_FOR_DEALER, action: DeckStateActions.END_ANIMATE_BEGIN };
    if (startAnimateEnd)
      return { phase: DeckStatePhases.DEAL_FOR_DEALER, action: DeckStateActions.START_ANIMATE_END };

    return undefined;
  };

  const getPhaseForRegularDeal = (): DeckPhase | undefined => {
    const deckStateCreated = hasPhaseExecuted({
      phase: DeckStatePhases.INIT,
      action: DeckStateActions.CREATE
    });
    const positionMoved = hasPhaseExecuted({
      phase: DeckStatePhases.REGULAR_DEAL,
      action: DeckStateActions.MOVE
    });
    const positionMovedComplete = hasPhaseCompleted({
      phase: DeckStatePhases.REGULAR_DEAL,
      action: DeckStateActions.MOVE
    });
    const hasStartAnimateBegin = hasPhaseExecuted({
      phase: DeckStatePhases.REGULAR_DEAL,
      action: DeckStateActions.START_ANIMATE_BEGIN
    });
    const hasStartAnimateBeginCompleted = hasPhaseCompleted({
      phase: DeckStatePhases.REGULAR_DEAL,
      action: DeckStateActions.START_ANIMATE_BEGIN
    });
    const hasEndAnimateBegin = hasPhaseExecuted({
      phase: DeckStatePhases.REGULAR_DEAL,
      action: DeckStateActions.END_ANIMATE_BEGIN
    });

    const moveIntoPosition =
      gameState.shouldBeginDealCards && !positionMoved && deckStateCreated && cardRefsReady;
    const startAnimateBegin =
      gameState.shouldBeginDealCards && positionMovedComplete && !hasStartAnimateBegin;
    const endAnimateBegin = hasStartAnimateBeginCompleted && !hasEndAnimateBegin;

    if (moveIntoPosition) return { phase: DeckStatePhases.REGULAR_DEAL, action: DeckStateActions.MOVE };
    if (startAnimateBegin)
      return { phase: DeckStatePhases.REGULAR_DEAL, action: DeckStateActions.START_ANIMATE_BEGIN };
    if (endAnimateBegin)
      return { phase: DeckStatePhases.REGULAR_DEAL, action: DeckStateActions.END_ANIMATE_BEGIN };

    return undefined;
  };

  const getDeckPhase = (): DeckPhase | undefined => {
    return getPhaseForInit() ?? getPhaseForDealForDealer() ?? getPhaseForRegularDeal();
  };

  return {
    getDeckPhase,
    resetForNewDeal,
    addPhaseExecuted,
    removePhaseExecuted,
    addPhaseCompleted,
    removePhaseCompleted,
    setCurrentInitializedId
  };
};

export default useDeckAnimationPhase;
