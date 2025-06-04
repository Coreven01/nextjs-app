import { HandPhase } from '../../hooks/phases/useCardAnimationPhase';
import {
  HandStateEffect,
  HandStateActions,
  HandStatePhases,
  PlayHandHandlers
} from '../../definitions/game-state-definitions';

const getEffectForPlayHandState = (
  getHandPhase: () => HandPhase | undefined,
  addPhaseHandled: (phase: HandPhase, id: string) => void,
  addPhaseCompleted: (phase: HandPhase, id: string) => void,
  playHandHandler: PlayHandHandlers,
  handId: string,
  currentTrickId: string
) => {
  //#region Play Hand Handlers

  const handlePlayCard = async () => {
    addPhaseHandled({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.PLAY_CARD }, currentTrickId);
    await playHandHandler.onPlayCard();
    addPhaseCompleted(
      { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.PLAY_CARD },
      currentTrickId
    );
  };

  const handleAnimatePlayCard = async () => {
    addPhaseHandled(
      { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.ANIMATE_PLAY_CARD },
      currentTrickId
    );
    await playHandHandler.onAnimatePlayCard();
  };

  const handlePassDeal = async () => {
    addPhaseHandled({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.PASS_DEAL }, handId);
    await playHandHandler.onPassDeal();
  };

  const handleReOrderHand = async () => {
    addPhaseHandled({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.RE_ORDER_HAND }, handId);
    await playHandHandler.onReorderHand();
    addPhaseCompleted({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.RE_ORDER_HAND }, handId);
  };

  const handleAnimateReOrderHand = async () => {
    addPhaseHandled({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.ANIMATE_PLAY_CARD }, handId);
    await playHandHandler.onAnimateReorderHand();
  };

  const handePlayerSittingOut = async () => {
    addPhaseHandled({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.SITTING_OUT }, handId);
    await playHandHandler.onPlayerSittingOut();
  };

  const handleTrickFinished = async () => {
    addPhaseHandled(
      { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.TRICK_FINISHED },
      currentTrickId
    );
    await playHandHandler.onTrickFinished();
  };

  const handleBeginTurn = async () => {
    addPhaseHandled(
      { phase: HandStatePhases.GAME_PLAY, action: HandStateActions.BEGIN_TURN },
      currentTrickId
    );
    await playHandHandler.onBeginPlayerTurn();
  };

  const handleEndTurn = async () => {
    addPhaseHandled({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.END_TURN }, currentTrickId);
    await playHandHandler.onEndPlayerTurn();
  };

  const handleDiscard = async () => {
    addPhaseHandled({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.DISCARD }, handId);
    await playHandHandler.onDiscard();
    addPhaseCompleted({ phase: HandStatePhases.GAME_PLAY, action: HandStateActions.DISCARD }, handId);
  };

  const localPlayHandHandlers: PlayHandHandlers = {
    onPlayCard: handlePlayCard,
    onAnimatePlayCard: handleAnimatePlayCard,
    onPassDeal: handlePassDeal,
    onDiscard: handleDiscard,
    onReorderHand: handleReOrderHand,
    onAnimateReorderHand: handleAnimateReOrderHand,
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
      case HandStateActions.DISCARD:
        retval.stateAction = HandStateActions.DISCARD;
        retval.func = localPlayHandHandlers.onDiscard;
        break;
      case HandStateActions.RE_ORDER_HAND:
        retval.stateAction = HandStateActions.RE_ORDER_HAND;
        retval.func = localPlayHandHandlers.onReorderHand;
        break;
      case HandStateActions.ANIMATE_RE_ORDER_HAND:
        retval.stateAction = HandStateActions.ANIMATE_RE_ORDER_HAND;
        retval.func = localPlayHandHandlers.onAnimateReorderHand;
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
