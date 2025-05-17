// import { useRef, useState } from 'react';
// import {
//   DealForDealerHandlers,
//   DeckStateActions,
//   DeckStatePhases,
//   EuchreGameState,
//   InitDealHandlers,
//   StateEffectInfo
// } from '../../../../lib/euchre/definitions/game-state-definitions';
// import { GameDeckState } from '../../state/useDeckAnimation';
// import useDeckAnimationPhase, { DeckPhase } from '../../phases/useDeckAnimationPhase';

// const useDeckDealForDealerEffect = (
//   getDeckPhase: () => DeckPhase | undefined,
//   resetForNewDeal: () => void,
//   addPhaseExecuted: (phase: DeckPhase) => void,
//   removePhaseExecuted: (phase: DeckPhase) => void,
//   addPhaseCompleted: (phase: DeckPhase) => void,
//   removePhaseCompleted: (phase: DeckPhase) => void,
//   dealCardsHandlers: DealForDealerHandlers
// ) => {
//   //#region  Handlers for Deck State Conditions

//   //#region Initialize Deck State
//   // const handleStartAnimateBeginDealForDealer = async () => {
//   //   initBeginDealForDealerEffect.current = true;
//   //   await dealForDealerHandlers.onStartAnimateBegin();
//   //   setBeginDealForDealerComplete(true);
//   // };

//   // const handleEndAnimateBeginDealForDealer = async () => {
//   //   endBeginDealForDealerEffect.current = true;
//   //   await dealForDealerHandlers.onEndAnimateBegin();
//   // };

//   // const handleStartAnimateEndDealForDealer = async () => {
//   //   initEndDealForDealerEffect.current = true;
//   //   await dealForDealerHandlers.onStartAnimateEnd();
//   // };

//   // const handleStartMoveCardsIntoPositionDealForDealer = async () => {
//   //   initMoveCardsIntoPosition.current = true;
//   //   await dealForDealerHandlers.onMoveCardsIntoPosition();
//   //   setMoveCardsIntoPositionComplete(true);
//   // };

//   // const localDealForDealerHandlers: DealForDealerHandlers = {
//   //   onMoveCardsIntoPosition: handleStartMoveCardsIntoPositionDealForDealer,
//   //   onStartAnimateBegin: handleStartAnimateBeginDealForDealer,
//   //   onEndAnimateBegin: handleEndAnimateBeginDealForDealer,
//   //   onStartAnimateEnd: handleStartAnimateEndDealForDealer
//   // };

//   const getEffectForInit = (): StateEffectInfo => {
//     const phase = getDeckPhase();
//     const retval: StateEffectInfo = { statePhase: DeckStatePhases.INIT };

//     if (!phase) return retval;

//     switch (phase.action) {
//       case DeckStateActions.CREATE:
//         retval.stateAction = DeckStateActions.CREATE;
//         retval.func = localInitDealHandlers.onStateCreating;
//     }

//     // if (deckResetConditions.shouldSetDeckState) {
//     //   retval.func = localResetHandlers.onDeckReset;
//     //   retval.stateConditionName = 'shouldSetDeckState';
//     //   retval.stateHandlerName = 'onDeckReset';
//     // } else if (deckResetConditions.shouldReinitializeDeckState) {
//     //   retval.func = localResetHandlers.onReinitializeState;
//     //   retval.stateConditionName = 'shouldReinitializeDeckState';
//     //   retval.stateHandlerName = 'onReinitializeState';
//     // } else if (deckResetConditions.shouldResetForNewDeal) {
//     //   retval.func = localResetHandlers.onNewDeal;
//     //   retval.stateConditionName = 'shouldResetForNewDeal';
//     //   retval.stateHandlerName = 'onNewDeal';
//     // }

//     return retval;
//   };

//   //#endregion

//   //#endregion

//   /** Get the function that should be executed for the effect for the current deck state. */
//   const getEffectForInitDeckState = (): StateEffectInfo => {
//     const intiEffectResult = getEffectForInit();

//     if (intiEffectResult.func) return intiEffectResult;

//     return {};
//   };

//   return { getEffectForInitDeckState };
// };

// export default useDeckDealForDealerEffect;
