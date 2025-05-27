// import {
//   DeckStateActions,
//   DeckStatePhases,
//   InitDealHandlers,
//   StateEffectInfo
// } from '../../../../lib/euchre/definitions/game-state-definitions';
// import { DeckPhase } from '../../phases/useDeckAnimationPhase';

// const useDeckInitializeEffect = (
//   getDeckPhase: () => DeckPhase | undefined,
//   resetForNewDeal: () => void,
//   addPhaseExecuted: (phase: DeckPhase) => void,
//   initDealHandler: InitDealHandlers
// ) => {
//   //#region Initialize Deck State Handlers
//   const handleDealerChanged = async () => {
//     await initDealHandler.onDealerChanged();
//     resetForNewDeal();

//     // setMoveCardsIntoPositionComplete(false);
//     // setBeginRegularDealComplete(false);
//     // isDealStateInitializedRef.current = false;
//     // initBeginDealForRegularDealEffect.current = false;
//     // endBeginDealForRegularDealEffect.current = false;
//   };

//   const handleStateCreating = async () => {
//     await initDealHandler.onStateCreating();
//     addPhaseExecuted({ phase: DeckStatePhases.INIT, action: DeckStateActions.CREATE });
//     // isDealStateInitializedRef.current = true;
//     // initMoveCardsIntoPosition.current = false;
//   };

//   // const handleCreateState = async () => {
//   //   // initBeginDealForRegularDealEffect.current = false;
//   //   // endBeginDealForRegularDealEffect.current = false;
//   //   await initDealHandler.onCreateState();
//   // };

//   const localInitDealHandlers: InitDealHandlers = {
//     //onReinitializeState: handleReinitializeState,
//     onDealerChanged: handleDealerChanged,
//     onStateCreating: handleStateCreating
//   };

//   //#endregion

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

//   /** Get the function that should be executed for the effect for the current deck state. */
//   const getEffectForInitDeckState = (): StateEffectInfo => {
//     const intiEffectResult = getEffectForInit();

//     if (intiEffectResult.func) return intiEffectResult;

//     return {};
//   };

//   return { getEffectForInitDeckState };
// };

// export default useDeckInitializeEffect;
