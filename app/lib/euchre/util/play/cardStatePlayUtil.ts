import { HandPhase } from '../../../../hooks/euchre/phases/useCardAnimationPhase';
import {
  HandStateEffect,
  HandStateActions,
  HandStatePhases,
  PlayHandHandlers,
  HandStateAction
} from '../../definitions/game-state-definitions';

const getEffectForPlayHandState = (
  getHandPhase: () => HandPhase | undefined,
  addPhaseExecuted: (phase: HandPhase) => void,
  addPhaseCompleted: (phase: HandPhase) => void,
  addTrickHandled: (action: HandStateAction, trickId: string) => void,
  playHandHandler: PlayHandHandlers,
  currentTrickId: string
) => {
  //#region Play Hand Handlers
  //   const handleResetHand = async () => {
  //     //await playHandHandler.onResetHandState();
  //     //resetForNewHand();
  //     // initAnimatePassDeal.current = false;
  //     //   initForCardsReorder.current = false;
  //     //   initForSittingOut.current = false;
  //     //   trickIdHandledEndPlayerTurn.current = [];
  //     //   trickIdOnTrickFinishHandled.current = [];
  //   };
  const handlePlayCard = async () => {
    addPhaseExecuted({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.PLAY_CARD });
    await playHandHandler.onPlayCard();
    addPhaseCompleted({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.PLAY_CARD });
  };

  const handleAnimatePlayCard = async () => {
    addPhaseExecuted({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.ANIMATE_PLAY_CARD });
    await playHandHandler.onAnimatePlayCard();
  };

  const handlePassDeal = async () => {
    addPhaseExecuted({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.PASS_DEAL });
    await playHandHandler.onPassDeal();
  };

  const handleReOrderHand = async () => {
    addPhaseExecuted({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.RE_ORDER_HAND });
    await playHandHandler.onReorderHand();
  };

  const handePlayerSittingOut = async () => {
    addPhaseExecuted({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.SITTING_OUT });
    await playHandHandler.onPlayerSittingOut();
  };

  const handleTrickFinished = async () => {
    addTrickHandled(HandStateActions.TRICK_FINISHED, currentTrickId);
    await playHandHandler.onTrickFinished();
  };

  const handleBeginTurn = async () => {
    addTrickHandled(HandStateActions.BEGIN_TURN, currentTrickId);
    await playHandHandler.onBeginPlayerTurn();
  };

  const handleEndTurn = async () => {
    addTrickHandled(HandStateActions.END_TURN, currentTrickId);
    await playHandHandler.onEndPlayerTurn();
  };

  const localPlayHandHandlers: PlayHandHandlers = {
    onPlayCard: handlePlayCard,
    onAnimatePlayCard: handleAnimatePlayCard,
    onPassDeal: handlePassDeal,
    onReorderHand: handleReOrderHand,
    onPlayerSittingOut: handePlayerSittingOut,
    onTrickFinished: handleTrickFinished,
    onBeginPlayerTurn: handleBeginTurn,
    onEndPlayerTurn: handleEndTurn
  };

  //#endregion

  const getEffectForHandPhase = (): HandStateEffect => {
    const phase = getHandPhase();
    const retval: HandStateEffect = { statePhase: HandStatePhases.GAME_PLAY };

    if (!phase || phase.phase !== HandStatePhases.GAME_PLAY) return retval;

    switch (phase.action) {
      case HandStateActions.PASS_DEAL:
        retval.stateAction = HandStateActions.PASS_DEAL;
        retval.func = localPlayHandHandlers.onPassDeal;
        break;
      case HandStateActions.RE_ORDER_HAND:
        retval.stateAction = HandStateActions.RE_ORDER_HAND;
        retval.func = localPlayHandHandlers.onReorderHand;
        break;
      case HandStateActions.SITTING_OUT:
        retval.stateAction = HandStateActions.SITTING_OUT;
        retval.func = localPlayHandHandlers.onPlayerSittingOut;
        break;
      case HandStateActions.TRICK_FINISHED:
        retval.stateAction = HandStateActions.TRICK_FINISHED;
        retval.func = localPlayHandHandlers.onTrickFinished;
        break;
      case HandStateActions.BEGIN_TURN:
        retval.stateAction = HandStateActions.BEGIN_TURN;
        retval.func = localPlayHandHandlers.onBeginPlayerTurn;
        break;
      case HandStateActions.END_TURN:
        retval.stateAction = HandStateActions.END_TURN;
        retval.func = localPlayHandHandlers.onEndPlayerTurn;
        break;
      case HandStateActions.PLAY_CARD:
        retval.stateAction = HandStateActions.PLAY_CARD;
        retval.func = localPlayHandHandlers.onPlayCard;
        break;
      case HandStateActions.ANIMATE_PLAY_CARD:
        retval.stateAction = HandStateActions.ANIMATE_PLAY_CARD;
        retval.func = localPlayHandHandlers.onAnimatePlayCard;
        break;
    }

    return retval;
  };

  return getEffectForHandPhase();
};

export default getEffectForPlayHandState;
