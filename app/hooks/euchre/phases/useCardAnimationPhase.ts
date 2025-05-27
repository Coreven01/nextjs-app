import { EuchreGameFlow } from '../../../../features/euchre/state/reducers/gameFlowReducer';
import { EuchreAnimateType } from '../../../../features/euchre/state/reducers/gameAnimationFlowReducer';
import { EuchrePauseType } from '../../../../features/euchre/state/reducers/gamePauseReducer';
import { playerSittingOut } from '../../../../features/euchre/util/game/gameDataUtil';
import { playerEqual } from '../../../../features/euchre/util/game/playerDataUtil';
import useCardAnimationPhaseState from '../state/useCardAnimationPhaseState';
import {
  EuchreGameState,
  HandState,
  HandStateAction,
  HandStateActions,
  HandStatePhase,
  HandStatePhases
} from '../../../../features/euchre/definitions/game-state-definitions';

export interface HandPhase {
  phase: HandStatePhase;
  action: HandStateAction;
}

const useCardAnimationPhase = (
  state: EuchreGameState,
  handState: HandState | undefined,
  cardRefsReady: boolean
) => {
  const {
    addPhaseHandled,
    addPhaseCompleted,
    clearStateValues,
    hasIdBeenHandledForPhase,
    hasPhaseCompleted
  } = useCardAnimationPhaseState();

  const { euchreGame, euchreGameFlow, euchreAnimationFlow, euchrePauseState } = state;
  const handId: string = handState?.handId ?? '';
  const trickId: string = euchreGame.currentTrick.trickId;

  /** ************************************************************************************************************************************* */

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
      euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
      euchrePauseState.pauseType === EuchrePauseType.ANIMATE,
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

  /** ************************************************************************************************************************************* */

  // const resetForNewHandInitValues = () => {
  //   removePhaseExecuted({
  //     phase: HandStatePhases.INIT,
  //     action: HandStateActions.CREATE_HAND
  //   });
  //   removePhaseExecuted({
  //     phase: HandStatePhases.INIT,
  //     action: HandStateActions.CREATE_CARD
  //   });
  //   removePhaseCompleted({
  //     phase: HandStatePhases.INIT,
  //     action: HandStateActions.CREATE_CARD
  //   });
  //   removePhaseExecuted({
  //     phase: HandStatePhases.INIT,
  //     action: HandStateActions.REGROUP
  //   });
  //   removePhaseExecuted({
  //     phase: HandStatePhases.INIT,
  //     action: HandStateActions.ANIMATE_REGROUP
  //   });
  // };

  // const resetForNewHandPlayValues = () => {
  //   removePhaseExecuted({
  //     phase: HandStatePhases.GAME_PLAY,
  //     action: HandStateActions.PASS_DEAL
  //   });

  //   removePhaseExecuted({
  //     phase: HandStatePhases.GAME_PLAY,
  //     action: HandStateActions.RE_ORDER_HAND
  //   });

  //   removePhaseExecuted({
  //     phase: HandStatePhases.GAME_PLAY,
  //     action: HandStateActions.SITTING_OUT
  //   });
  // };

  const resetForNewHand = () => {
    clearStateValues();
  };

  /** */
  const getPhaseForInit = (): HandPhase | undefined => {
    const handStateCreated = hasIdBeenHandledForPhase(
      {
        phase: HandStatePhases.INIT,
        action: HandStateActions.CREATE_HAND
      },
      HandStateActions.CREATE_HAND
    );

    const cardStateCreated = hasIdBeenHandledForPhase(
      {
        phase: HandStatePhases.INIT,
        action: HandStateActions.CREATE_CARD
      },
      handId
    );

    const cardStateCreateCompleted = hasPhaseCompleted(
      {
        phase: HandStatePhases.INIT,
        action: HandStateActions.CREATE_CARD
      },
      handId
    );

    const cardsRegrouped = hasIdBeenHandledForPhase(
      {
        phase: HandStatePhases.INIT,
        action: HandStateActions.REGROUP
      },
      handId
    );

    const cardsRegroupAnimated = hasIdBeenHandledForPhase(
      {
        phase: HandStatePhases.INIT,
        action: HandStateActions.ANIMATE_REGROUP
      },
      handId
    );

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

  const getChecksForGamePlayPhases = () => {
    if (!handState?.player)
      throw new Error('Player not found for hand state while getting phase for game play.');

    const playerIsCurrentPlayer = playerEqual(handState.player, euchreGame.currentPlayer);
    const phase = HandStatePhases.GAME_PLAY;

    const hasPassedDeal = hasIdBeenHandledForPhase({ phase, action: HandStateActions.PASS_DEAL }, handId);

    const beginDiscard = hasIdBeenHandledForPhase({ phase, action: HandStateActions.DISCARD }, handId);

    const discardComplete = hasPhaseCompleted({ phase, action: HandStateActions.DISCARD }, handId);

    const cardReOrderedComplete = hasPhaseCompleted(
      { phase, action: HandStateActions.RE_ORDER_HAND },
      handId
    );

    const cardReOrdered = hasIdBeenHandledForPhase({ phase, action: HandStateActions.RE_ORDER_HAND }, handId);

    const cardReOrderAnimated = hasIdBeenHandledForPhase(
      { phase, action: HandStateActions.ANIMATE_RE_ORDER_HAND },
      handId
    );

    const sittingOutAnimated = hasIdBeenHandledForPhase(
      { phase, action: HandStateActions.SITTING_OUT },
      handId
    );

    const cardPlayedComplete = hasPhaseCompleted({ phase, action: HandStateActions.PLAY_CARD }, trickId);

    const hasBeginPlayCard = hasIdBeenHandledForPhase({ phase, action: HandStateActions.PLAY_CARD }, trickId);

    const hasAnimatePlayCard = hasIdBeenHandledForPhase(
      { phase, action: HandStateActions.ANIMATE_PLAY_CARD },
      trickId
    );

    const hasTrickFinished = hasIdBeenHandledForPhase(
      { phase, action: HandStateActions.ANIMATE_PLAY_CARD },
      trickId
    );

    const hasTurnStarted = hasIdBeenHandledForPhase({ phase, action: HandStateActions.BEGIN_TURN }, trickId);
    const hasTurnEnded = hasIdBeenHandledForPhase({ phase, action: HandStateActions.END_TURN }, trickId);

    const sittingOutPlayer = playerSittingOut(euchreGame);
    const playerIsSittingOut = sittingOutPlayer && playerEqual(handState.player, sittingOutPlayer);

    const checks = {
      shouldPlayCard: playerIsCurrentPlayer && gameState.shouldPlayCard && !hasBeginPlayCard,
      shouldAnimatePlayCard:
        playerIsCurrentPlayer && gameState.shouldPlayCard && cardPlayedComplete && !hasAnimatePlayCard,

      shouldPassDeal: !hasPassedDeal && gameState.shouldAnimateBeginPassDeal,
      shouldDiscard: !beginDiscard && gameState.shouldReorderHand,
      shouldReOrderHand: !cardReOrdered && gameState.shouldReorderHand && discardComplete,
      shouldAnimateReOrderHand: !cardReOrderAnimated && gameState.shouldReorderHand && cardReOrderedComplete,
      shouldPlayerSittingOut: playerIsSittingOut && !sittingOutAnimated,
      isTrickFinished: gameState.shouldAnimateTrickFinished && hasTrickFinished,

      showBeginPlayerTurn:
        handState.player.human &&
        !playerIsSittingOut &&
        gameState.shouldUpdateCardStateForTurn &&
        !hasTurnStarted &&
        playerIsCurrentPlayer,

      showEndPlayerTurn:
        handState.player.human &&
        !playerIsSittingOut &&
        gameState.shouldUpdateCardStateForTurnEnd &&
        !hasTurnEnded &&
        playerIsCurrentPlayer
    };

    return checks;
  };

  /**  */
  const getPhaseForGamePlay = (): HandPhase | undefined => {
    if (!handState) return undefined;

    const basePhase: HandPhase = { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.NO_ACTION };
    const gameChecks = getChecksForGamePlayPhases();

    if (gameChecks.shouldPlayCard) basePhase.action = HandStateActions.PLAY_CARD;
    else if (gameChecks.shouldAnimatePlayCard) basePhase.action = HandStateActions.ANIMATE_PLAY_CARD;
    else if (gameChecks.shouldPassDeal) basePhase.action = HandStateActions.PASS_DEAL;
    else if (gameChecks.shouldDiscard) basePhase.action = HandStateActions.DISCARD;
    else if (gameChecks.shouldReOrderHand) basePhase.action = HandStateActions.RE_ORDER_HAND;
    else if (gameChecks.shouldAnimateReOrderHand) basePhase.action = HandStateActions.ANIMATE_RE_ORDER_HAND;
    else if (gameChecks.shouldPlayerSittingOut) basePhase.action = HandStateActions.SITTING_OUT;
    else if (gameChecks.isTrickFinished) basePhase.action = HandStateActions.TRICK_FINISHED;
    else if (gameChecks.showBeginPlayerTurn) basePhase.action = HandStateActions.BEGIN_TURN;
    else if (gameChecks.showEndPlayerTurn) basePhase.action = HandStateActions.END_TURN;

    if (basePhase.action === HandStateActions.NO_ACTION) {
      return undefined;
    } else {
      return basePhase;
    }
  };

  const getHandPhase = (): HandPhase | undefined => {
    return getPhaseForInit() ?? getPhaseForGamePlay();
  };

  return {
    getHandPhase,
    resetForNewHand,
    addPhaseCompleted,
    addPhaseHandled
  };
};
export default useCardAnimationPhase;
