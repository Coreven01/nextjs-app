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
import { playerSittingOut } from '../../../lib/euchre/util/gameDataUtil';
import { playerEqual } from '../../../lib/euchre/util/playerDataUtil';

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

  /** Trick id where the the player's hand was re-grouped at the beginning of the player's turn. */
  const trickIdHandledBeginPlayerTurn = useRef<string[]>([]);

  /** Trick id where the the player's hand was re-grouped at the end of the player's turn. */
  const trickIdHandledEndPlayerTurn = useRef<string[]>([]);

  // trick ids where the event for trick finished was handled.
  const trickIdOnTrickFinishHandled = useRef<string[]>([]);

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
    shouldUpdateCardStateForTurnEnd:
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_PLAY_CARD &&
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
      euchrePauseState.pauseType === EuchrePauseType.NONE,
    shouldUpdateCardStateForTurn:
      euchreAnimationFlow.animationType === EuchreAnimateType.NONE &&
      euchrePauseState.pauseType === EuchrePauseType.USER_INPUT &&
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_PLAY_CARD,
    shouldPlayCard:
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
      euchrePauseState.pauseType === EuchrePauseType.ANIMATE &&
      euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_PLAY_CARD
  };

  const addTrickHandled = (action: HandStateAction, trickId: string) => {
    switch (action) {
      case HandStateActions.BEGIN_TURN:
        trickIdHandledBeginPlayerTurn.current.push(trickId);
        break;
      case HandStateActions.END_TURN:
        trickIdHandledEndPlayerTurn.current.push(trickId);
        break;
      case HandStateActions.TRICK_FINISHED:
        trickIdOnTrickFinishHandled.current.push(trickId);
        break;
      default:
        throw new Error('Action not handled');
    }
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

  const resetForNewHandInitValues = () => {
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
  };

  const resetForNewHandPlayValues = () => {
    removePhaseExecuted({
      phase: HandStatePhases.GAME_PLAY,
      action: HandStateActions.PASS_DEAL
    });

    removePhaseExecuted({
      phase: HandStatePhases.GAME_PLAY,
      action: HandStateActions.RE_ORDER_HAND
    });

    removePhaseExecuted({
      phase: HandStatePhases.GAME_PLAY,
      action: HandStateActions.SITTING_OUT
    });

    trickIdHandledBeginPlayerTurn.current = [];
    trickIdHandledEndPlayerTurn.current = [];
    trickIdOnTrickFinishHandled.current = [];
  };

  const resetForNewHand = () => {
    resetForNewHandInitValues();
    resetForNewHandPlayValues();
  };

  /** */
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

  /**  */
  const getPhaseForGamePlay = (): HandPhase | undefined => {
    if (!handState) return undefined;

    if (!handState.player)
      throw new Error('Player not found for hand state while getting phase for game play.');
    const currentTrick = euchreGame.currentTrick;
    const playerIsCurrentPlayer = playerEqual(handState.player, euchreGame.currentPlayer);

    const hasPassedDeal = hasPhaseExecuted({
      phase: HandStatePhases.GAME_PLAY,
      action: HandStateActions.PASS_DEAL
    });

    const cardReOrdered = hasPhaseExecuted({
      phase: HandStatePhases.GAME_PLAY,
      action: HandStateActions.RE_ORDER_HAND
    });

    const playerSittingOutAnimated = hasPhaseCompleted({
      phase: HandStatePhases.GAME_PLAY,
      action: HandStateActions.SITTING_OUT
    });

    const cardPlayed = hasPhaseExecuted({
      phase: HandStatePhases.GAME_PLAY,
      action: HandStateActions.PLAY_CARD
    });

    const cardPlayedComplete = hasPhaseCompleted({
      phase: HandStatePhases.GAME_PLAY,
      action: HandStateActions.PLAY_CARD
    });

    const cardPlayedAnimated = hasPhaseExecuted({
      phase: HandStatePhases.GAME_PLAY,
      action: HandStateActions.ANIMATE_PLAY_CARD
    });

    const sittingOutPlayer = playerSittingOut(euchreGame);
    const playerIsSittingOut = sittingOutPlayer && playerEqual(handState.player, sittingOutPlayer);

    const shouldPlayCard = playerIsCurrentPlayer && gameState.shouldPlayCard && !cardPlayed;
    const shouldAnimatePlayCard =
      playerIsCurrentPlayer && gameState.shouldPlayCard && cardPlayedComplete && !cardPlayedAnimated;

    const shouldPassDeal = !hasPassedDeal && gameState.shouldAnimateBeginPassDeal;
    const shouldReOrderHand = handState.shouldShowCardValue && !cardReOrdered && gameState.shouldReorderHand;
    const shouldPlayerSittingOut = playerIsSittingOut && !playerSittingOutAnimated;
    const shouldTrickFinished =
      gameState.shouldAnimateTrickFinished &&
      !trickIdOnTrickFinishHandled.current.includes(currentTrick.trickId);
    const showBeginPlayerTurn =
      handState.player.human &&
      gameState.shouldUpdateCardStateForTurn &&
      !trickIdHandledBeginPlayerTurn.current.includes(euchreGame.currentTrick.trickId) &&
      playerIsCurrentPlayer;
    const showEndPlayerTurn =
      handState.player.human &&
      gameState.shouldUpdateCardStateForTurnEnd &&
      !trickIdHandledEndPlayerTurn.current.includes(euchreGame.currentTrick.trickId) &&
      playerIsCurrentPlayer;

    if (shouldPlayCard) return { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.PLAY_CARD };

    if (shouldAnimatePlayCard)
      return { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.ANIMATE_PLAY_CARD };

    if (shouldPassDeal) return { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.PASS_DEAL };

    if (shouldReOrderHand)
      return { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.RE_ORDER_HAND };

    if (shouldPlayerSittingOut)
      return { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.SITTING_OUT };

    if (shouldTrickFinished)
      return { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.TRICK_FINISHED };

    if (showBeginPlayerTurn) return { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.BEGIN_TURN };

    if (showEndPlayerTurn) return { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.END_TURN };

    return undefined;
  };

  const getHandPhase = (): HandPhase | undefined => {
    return getPhaseForInit() ?? getPhaseForGamePlay();
  };

  return {
    getHandPhase,
    resetForNewHand,
    addPhaseExecuted,
    removePhaseExecuted,
    addPhaseCompleted,
    removePhaseCompleted,
    addTrickHandled
  };
};
export default useCardAnimationPhase;
