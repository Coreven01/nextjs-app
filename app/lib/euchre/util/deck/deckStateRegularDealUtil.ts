// import { DeckPhase } from '../../../../app/hooks/euchre/phases/useDeckAnimationPhase';
// import {
//   DeckStateActions,
//   DeckStatePhases,
//   RegularDealHandlers,
//   DealStateEffect
// } from '../../definitions/game-state-definitions';

// const getEffectForRegularDeal = (
//   getDeckPhase: () => DeckPhase | undefined,
//   addPhaseExecuted: (phase: DeckPhase) => void,
//   addPhaseCompleted: (phase: DeckPhase) => void,
//   dealCardsHandlers: RegularDealHandlers
// ) => {
//   //   //#region  Handlers

//   const handleMoveIntoPosition = async () => {
//     addPhaseExecuted({ phase: DeckStatePhases.REGULAR_DEAL, action: DeckStateActions.MOVE });
//     //initMoveCardsIntoPosition.current = true;
//     await dealCardsHandlers.onMoveCardsIntoPosition();
//     addPhaseCompleted({ phase: DeckStatePhases.REGULAR_DEAL, action: DeckStateActions.MOVE });
//     //setMoveCardsIntoPositionComplete(true);
//   };

//   const handleStartDealCards = async () => {
//     addPhaseExecuted({
//       phase: DeckStatePhases.REGULAR_DEAL,
//       action: DeckStateActions.START_ANIMATE_BEGIN
//     });
//     // initBeginDealForRegularDealEffect.current = true;
//     await dealCardsHandlers.onStartDealCards();
//     //setBeginRegularDealComplete(true);
//     addPhaseCompleted({
//       phase: DeckStatePhases.REGULAR_DEAL,
//       action: DeckStateActions.START_ANIMATE_BEGIN
//     });
//   };

//   const handleEndDealCards = async () => {
//     addPhaseExecuted({ phase: DeckStatePhases.REGULAR_DEAL, action: DeckStateActions.END_ANIMATE_BEGIN });
//     //endBeginDealForRegularDealEffect.current = true;
//     await dealCardsHandlers.onEndDealCards();
//   };

//   const localRegularDealHandlers: RegularDealHandlers = {
//     onMoveCardsIntoPosition: handleMoveIntoPosition,
//     onStartDealCards: handleStartDealCards,
//     onEndDealCards: handleEndDealCards
//   };

//   const getEffectForDeckPhase = (): DealStateEffect => {
//     const phase = getDeckPhase();
//     const retval: DealStateEffect = { statePhase: DeckStatePhases.REGULAR_DEAL };

//     if (!phase || phase.phase !== DeckStatePhases.REGULAR_DEAL) return retval;

//     switch (phase.action) {
//       case DeckStateActions.MOVE:
//         retval.stateAction = DeckStateActions.MOVE;
//         retval.func = localRegularDealHandlers.onMoveCardsIntoPosition;
//         break;
//       case DeckStateActions.START_ANIMATE_BEGIN:
//         retval.stateAction = DeckStateActions.START_ANIMATE_BEGIN;
//         retval.func = localRegularDealHandlers.onStartDealCards;
//         break;
//       case DeckStateActions.END_ANIMATE_BEGIN:
//         retval.stateAction = DeckStateActions.END_ANIMATE_BEGIN;
//         retval.func = localRegularDealHandlers.onEndDealCards;
//         break;
//     }

//     return retval;
//   };

//   return getEffectForDeckPhase();
// };

// export default getEffectForRegularDeal;
