import {
  EuchreGameState,
  HandState,
  InitHandHandlers,
  HandStateEffect
} from '../../../../lib/euchre/definitions/game-state-definitions';
import useCardAnimationPhase from '../../phases/useCardAnimationPhase';
import getEffectForInitHandState from '../../../../lib/euchre/util/play/cardStateInitializeUtil';

const useCardStateEffect = (
  state: EuchreGameState,
  handState: HandState | undefined,
  cardRefsReady: boolean,
  initHandler: InitHandHandlers
) => {
  const { getHandPhase, resetForNewHand, addPhaseExecuted, addPhaseCompleted } = useCardAnimationPhase(
    state,
    handState,
    cardRefsReady
  );

  // const { shouldCreateHandState, shouldCreateCardState } = useAnimationCardState(state);
  // const { euchreGame } = state;

  // const initForNewHandEffect = useRef(false);
  // const [initCardStateCreated, setInitCardStateCreated] = useState(false);
  // const [initForCardsRegroup, setInitForCardsRegroup] = useState(false);
  // const initAnimateCardsRegroup = useRef(false);

  // //#region  Deck State Conditions for Effects
  // const getInitCardsConditions = (): InitCardsConditions => {
  //   return {
  //     shouldResetHandState: handState !== undefined && handState.handId !== euchreGame.handId,
  //     shouldCreateHandState: shouldCreateHandState && !initForNewHandEffect.current,
  //     shouldCreateCardState: shouldCreateCardState && handState !== undefined && !initCardStateCreated,
  //     shouldRegroupCards: initCardStateCreated && !initForCardsRegroup,
  //     shouldAnimateRegroupCards: cardRefsReady && initForCardsRegroup && !initAnimateCardsRegroup.current
  //   };
  // };
  // //#endregion

  // //#region  Handlers for Card State Conditions

  // //#region Initialize Card State Handlers

  // const handleResetHandState = async () => {
  //   initForNewHandEffect.current = false;
  //   setInitCardStateCreated(false);
  //   setInitForCardsRegroup(false);
  //   await initHandler.onResetHandState();
  // };

  // const handleCreateHandState = async () => {
  //   initForNewHandEffect.current = true;
  //   await initHandler.onCreateHandState();
  // };

  // const handleCreateCardState = async () => {
  //   await initHandler.onCreateCardState();
  //   setInitCardStateCreated(true);
  // };

  // const handleRegroupCards = async () => {
  //   setInitForCardsRegroup(true);
  //   await initHandler.onRegroupCards();
  // };

  // const handleAnimateRegroupCards = async () => {
  //   initAnimateCardsRegroup.current = true;
  //   await initHandler.onAnimateRegroupCards();
  // };

  // const localInitCardsHandlers: InitHandHandlers = {
  //   onResetHandState: handleResetHandState,
  //   onCreateHandState: handleCreateHandState,
  //   onCreateCardState: handleCreateCardState,
  //   onRegroupCards: handleRegroupCards,
  //   onAnimateRegroupCards: handleAnimateRegroupCards
  // };

  // const getEffectForInit = (): DealStateEffect => {
  //   //const intCardConditions = getInitCardsConditions();
  //   //const retval: StateEffectInfo = { statePhase: 'InitDeck' };
  //   // if (intCardConditions.shouldResetHandState) {
  //   //   retval.func = localInitCardsHandlers.onResetHandState;
  //   //   retval.stateConditionName = 'shouldResetHandState';
  //   //   retval.stateHandlerName = 'onResetHandState';
  //   // } else if (intCardConditions.shouldCreateHandState) {
  //   //   retval.func = localInitCardsHandlers.onCreateHandState;
  //   //   retval.stateConditionName = 'shouldCreateHandState';
  //   //   retval.stateHandlerName = 'onCreateHandState';
  //   // } else if (intCardConditions.shouldCreateCardState) {
  //   //   retval.func = localInitCardsHandlers.onCreateCardState;
  //   //   retval.stateConditionName = 'shouldCreateCardState';
  //   //   retval.stateHandlerName = 'onCreateCardState';
  //   // } else if (intCardConditions.shouldRegroupCards) {
  //   //   retval.func = localInitCardsHandlers.onRegroupCards;
  //   //   retval.stateConditionName = 'shouldRegroupCards';
  //   //   retval.stateHandlerName = 'onRegroupCards';
  //   // } else if (intCardConditions.shouldAnimateRegroupCards) {
  //   //   retval.func = localInitCardsHandlers.onAnimateRegroupCards;
  //   //   retval.stateConditionName = 'shouldAnimateRegroupCards';
  //   //   retval.stateHandlerName = 'onAnimateRegroupCards';
  //   // }
  //   //return retval;
  // };
  // //#endregion

  // //#endregion

  // /** Get the function that should be executed for the effect for the current deck state. */
  // const getEffectForCardState = (): DealStateEffect => {
  //   const intiEffectResult = getEffectForInit();

  //   if (intiEffectResult.func) return intiEffectResult;

  //   // const dealForDealerResult = getEffectDealForDealer();

  //   // if (dealForDealerResult.func) return dealForDealerResult;

  //   // const regularDealResult = getEffectRegularDeal();

  //   // if (regularDealResult.func) return regularDealResult;

  //   return {};
  // };

  // return { initCardStateCreated, getEffectForCardState };

  /** Get the function that should be executed for the effect for the current deck state. */
  const getEffectForHandState = (): HandStateEffect => {
    const initEffect = getEffectForInitHandState(
      getHandPhase,
      resetForNewHand,
      addPhaseExecuted,
      addPhaseCompleted,
      initHandler
    );

    if (initEffect.func) return initEffect;

    // const dealForDealerEffect = getEffectForDealForDealer(
    //   getDeckPhase,
    //   addPhaseExecuted,
    //   addPhaseCompleted,
    //   dealForDealerHandlers
    // );

    // if (dealForDealerEffect.func) return dealForDealerEffect;

    // const regularDealEffect = getEffectForRegularDeal(
    //   getDeckPhase,
    //   addPhaseExecuted,
    //   addPhaseCompleted,
    //   regularDealHandlers
    // );

    // if (regularDealEffect.func) return regularDealEffect;

    return {};
  };

  return { getEffectForHandState };
};

export default useCardStateEffect;
