import { DeckPhase } from '../../../../app/hooks/euchre/phases/useDeckAnimationPhase';
import {
  DealForDealerHandlers,
  DeckStateActions,
  DeckStatePhases,
  DealStateEffect
} from '../../definitions/game-state-definitions';

const getEffectForDealForDealer = (
  getDeckPhase: () => DeckPhase | undefined,
  addPhaseExecuted: (phase: DeckPhase) => void,
  addPhaseCompleted: (phase: DeckPhase) => void,
  dealCardsHandlers: DealForDealerHandlers
) => {
  //   //#region  Handlers

  const handleMoveIntoPosition = async () => {
    addPhaseExecuted({ phase: DeckStatePhases.DEAL_FOR_DEALER, action: DeckStateActions.MOVE });
    //initMoveCardsIntoPosition.current = true;
    await dealCardsHandlers.onMoveCardsIntoPosition();
    addPhaseCompleted({ phase: DeckStatePhases.DEAL_FOR_DEALER, action: DeckStateActions.MOVE });
    //setMoveCardsIntoPositionComplete(true);
  };

  const handleStartDealCards = async () => {
    addPhaseExecuted({
      phase: DeckStatePhases.DEAL_FOR_DEALER,
      action: DeckStateActions.START_ANIMATE_BEGIN
    });
    //initBeginDealForDealerEffect.current = true;
    await dealCardsHandlers.onStartDealCards();
    //setBeginDealForDealerComplete(true);
    addPhaseCompleted({
      phase: DeckStatePhases.DEAL_FOR_DEALER,
      action: DeckStateActions.START_ANIMATE_BEGIN
    });
  };

  const handleEndDealCards = async () => {
    addPhaseExecuted({ phase: DeckStatePhases.DEAL_FOR_DEALER, action: DeckStateActions.END_ANIMATE_BEGIN });
    //endBeginDealForDealerEffect.current = true;
    await dealCardsHandlers.onEndDealCards();
  };

  const handleMoveCardsToPlayer = async () => {
    addPhaseExecuted({ phase: DeckStatePhases.DEAL_FOR_DEALER, action: DeckStateActions.START_ANIMATE_END });
    //initEndDealForDealerEffect.current = true;
    await dealCardsHandlers.onMoveCardsToPlayer();
  };

  const localDealForDealerHandlers: DealForDealerHandlers = {
    onMoveCardsIntoPosition: handleMoveIntoPosition,
    onStartDealCards: handleStartDealCards,
    onEndDealCards: handleEndDealCards,
    onMoveCardsToPlayer: handleMoveCardsToPlayer
  };

  const getEffectForDeckPhase = (): DealStateEffect => {
    const phase = getDeckPhase();
    const retval: DealStateEffect = { statePhase: DeckStatePhases.DEAL_FOR_DEALER };

    if (!phase || phase.phase !== DeckStatePhases.DEAL_FOR_DEALER) return retval;

    switch (phase.action) {
      case DeckStateActions.MOVE:
        retval.stateAction = DeckStateActions.MOVE;
        retval.func = localDealForDealerHandlers.onMoveCardsIntoPosition;
        break;
      case DeckStateActions.START_ANIMATE_BEGIN:
        retval.stateAction = DeckStateActions.START_ANIMATE_BEGIN;
        retval.func = localDealForDealerHandlers.onStartDealCards;
        break;
      case DeckStateActions.END_ANIMATE_BEGIN:
        retval.stateAction = DeckStateActions.END_ANIMATE_BEGIN;
        retval.func = localDealForDealerHandlers.onEndDealCards;
        break;
      case DeckStateActions.START_ANIMATE_END:
        retval.stateAction = DeckStateActions.START_ANIMATE_END;
        retval.func = localDealForDealerHandlers.onMoveCardsToPlayer;
        break;
    }

    return retval;
  };

  return getEffectForDeckPhase();
};

export default getEffectForDealForDealer;
