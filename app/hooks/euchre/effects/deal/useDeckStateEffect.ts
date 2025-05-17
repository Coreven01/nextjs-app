import {
  DealForDealerHandlers,
  DeckState,
  EuchreGameState,
  InitDealHandlers,
  RegularDealHandlers,
  StateEffectInfo
} from '../../../../lib/euchre/definitions/game-state-definitions';
import useDeckAnimationPhase from '../../phases/useDeckAnimationPhase';
import getEffectForInitDeckState from '../../../../lib/euchre/util/deck/deckStateInitializeUtil';
import getEffectForDealForDealer from '../../../../lib/euchre/util/deck/deckStateDealForDealerUtil';
import getEffectForRegularDeal from '../../../../lib/euchre/util/deck/deckStateRegularDealUtil';

const useDeckStateEffect = (
  state: EuchreGameState,
  gameDeckState: DeckState | undefined,
  cardRefsReady: boolean,
  initDealHandler: InitDealHandlers,
  dealForDealerHandlers: DealForDealerHandlers,
  regularDealHandlers: RegularDealHandlers
) => {
  const { getDeckPhase, resetForNewDeal, addPhaseExecuted, addPhaseCompleted } = useDeckAnimationPhase(
    state,
    gameDeckState,
    cardRefsReady
  );

  // const isDealStateInitializedRef = useRef(false);

  // /** The following values are used to prevent the deal for dealer effects from running more than once. */
  // const initMoveCardsIntoPosition = useRef(false);
  // const [moveCardsIntoPositionComplete, setMoveCardsIntoPositionComplete] = useState(false);
  // const initBeginDealForDealerEffect = useRef(false);
  // const [beginDealForDealerComplete, setBeginDealForDealerComplete] = useState(false);
  // const endBeginDealForDealerEffect = useRef(false);
  // const initEndDealForDealerEffect = useRef(false);

  // /** The following values are used to prevent the regular deal effects from running more than once. */
  // const initBeginDealForRegularDealEffect = useRef(false);
  // const [beginRegularDealComplete, setBeginRegularDealComplete] = useState(false);
  // const endBeginDealForRegularDealEffect = useRef(false);

  //#region  Deck State Conditions for Effects
  // const getInitDeckConditions = (): InitDeckConditions => {
  //   const validDeck = euchreGame.deck.length === 24 && !euchreGame.deck.find((c) => c.value === 'P');

  //   return {
  //     shouldReinitializeDeckState:
  //       gameDeckState !== undefined &&
  //       gameDeckState.handId !== euchreGame.handId &&
  //       isDealStateInitializedRef.current,
  //     shouldSetDeckState: !isDealStateInitializedRef.current && validDeck && euchreGameFlow.hasGameStarted,
  //     shouldResetForNewDeal:
  //       shouldResetDealState &&
  //       (initBeginDealForRegularDealEffect.current || endBeginDealForRegularDealEffect.current)
  //   };
  // };

  // const getDealForDealerConditions = (): DealForDealerConditions => {
  //   return {
  //     shouldStartMoveCardsIntoPosition:
  //       shouldBeginDealForDealer &&
  //       !initMoveCardsIntoPosition.current &&
  //       isDealStateInitializedRef.current &&
  //       cardRefsReady,
  //     shouldStartAnimateBegin:
  //       shouldBeginDealForDealer && moveCardsIntoPositionComplete && !initBeginDealForDealerEffect.current,
  //     shouldEndAnimateBegin:
  //       beginDealForDealerComplete &&
  //       initBeginDealForDealerEffect.current &&
  //       !endBeginDealForDealerEffect.current,
  //     shouldStartAnimateEnd: false && !initEndDealForDealerEffect.current && shouldEndDealForDealer
  //   };
  // };

  // const getRegularDealConditions = (): RegularDealConditions => {
  //   return {
  //     shouldStartMoveCardsIntoPosition:
  //       shouldBeginDealCards &&
  //       !initMoveCardsIntoPosition.current &&
  //       isDealStateInitializedRef.current &&
  //       cardRefsReady,
  //     shouldStartAnimateBegin:
  //       !initBeginDealForRegularDealEffect.current && shouldBeginDealCards && moveCardsIntoPositionComplete,
  //     shouldEndAnimateBegin:
  //       beginRegularDealComplete && !endBeginDealForRegularDealEffect.current && shouldBeginDealCards
  //   };
  // };

  //#endregion

  //#region  Handlers for Deck State Conditions

  //#region Initialize Deck State
  // const handleReinitializeState = async () => {
  //   await initDealHandler.onReinitializeState();
  //   setMoveCardsIntoPositionComplete(false);
  //   setBeginRegularDealComplete(false);
  //   isDealStateInitializedRef.current = false;
  //   initBeginDealForRegularDealEffect.current = false;
  //   endBeginDealForRegularDealEffect.current = false;
  // };

  // const handleResetDeckState = async () => {
  //   await initDealHandler.onDeckReset();
  //   isDealStateInitializedRef.current = true;
  //   initMoveCardsIntoPosition.current = false;
  // };

  // const handleNewDeal = async () => {
  //   initBeginDealForRegularDealEffect.current = false;
  //   endBeginDealForRegularDealEffect.current = false;
  //   await initDealHandler.onNewDeal();
  // };

  // const localResetHandlers: InitDealHandlers = {
  //   onReinitializeState: handleReinitializeState,
  //   onDeckReset: handleResetDeckState,
  //   onNewDeal: handleNewDeal
  // };

  // const getEffectForInit = (): StateEffectInfo => {
  //   const deckResetConditions = getInitDeckConditions();
  //   const retval: StateEffectInfo = { statePhase: 'InitDeck' };

  //   if (deckResetConditions.shouldSetDeckState) {
  //     retval.func = localResetHandlers.onDeckReset;
  //     retval.stateConditionName = 'shouldSetDeckState';
  //     retval.stateHandlerName = 'onDeckReset';
  //   } else if (deckResetConditions.shouldReinitializeDeckState) {
  //     retval.func = localResetHandlers.onReinitializeState;
  //     retval.stateConditionName = 'shouldReinitializeDeckState';
  //     retval.stateHandlerName = 'onReinitializeState';
  //   } else if (deckResetConditions.shouldResetForNewDeal) {
  //     retval.func = localResetHandlers.onNewDeal;
  //     retval.stateConditionName = 'shouldResetForNewDeal';
  //     retval.stateHandlerName = 'onNewDeal';
  //   }

  //   return retval;
  // };

  // //#endregion

  // //#region Deal For Dealer Deck State Handlers

  // const handleStartAnimateBeginDealForDealer = async () => {
  //   initBeginDealForDealerEffect.current = true;
  //   await dealForDealerHandlers.onStartAnimateBegin();
  //   setBeginDealForDealerComplete(true);
  // };

  // const handleEndAnimateBeginDealForDealer = async () => {
  //   endBeginDealForDealerEffect.current = true;
  //   await dealForDealerHandlers.onEndAnimateBegin();
  // };

  // const handleStartAnimateEndDealForDealer = async () => {
  //   initEndDealForDealerEffect.current = true;
  //   await dealForDealerHandlers.onStartAnimateEnd();
  // };

  // const handleStartMoveCardsIntoPositionDealForDealer = async () => {
  //   initMoveCardsIntoPosition.current = true;
  //   await dealForDealerHandlers.onMoveCardsIntoPosition();
  //   setMoveCardsIntoPositionComplete(true);
  // };

  // const localDealForDealerHandlers: DealForDealerHandlers = {
  //   onMoveCardsIntoPosition: handleStartMoveCardsIntoPositionDealForDealer,
  //   onStartAnimateBegin: handleStartAnimateBeginDealForDealer,
  //   onEndAnimateBegin: handleEndAnimateBeginDealForDealer,
  //   onStartAnimateEnd: handleStartAnimateEndDealForDealer
  // };

  // const getEffectDealForDealer = (): StateEffectInfo => {
  //   const dealForDealerConditions = getDealForDealerConditions();
  //   const retval: StateEffectInfo = { statePhase: 'DealForDealer' };

  //   if (dealForDealerConditions.shouldStartMoveCardsIntoPosition) {
  //     retval.func = localDealForDealerHandlers.onMoveCardsIntoPosition;
  //     retval.stateConditionName = 'shouldStartMoveCardsIntoPosition';
  //     retval.stateHandlerName = 'onMoveCardsIntoPosition';
  //   } else if (dealForDealerConditions.shouldStartAnimateBegin) {
  //     retval.func = localDealForDealerHandlers.onStartAnimateBegin;
  //     retval.stateConditionName = 'shouldStartAnimateBegin';
  //     retval.stateHandlerName = 'onStartAnimateBegin';
  //   } else if (dealForDealerConditions.shouldEndAnimateBegin) {
  //     retval.func = localDealForDealerHandlers.onEndAnimateBegin;
  //     retval.stateConditionName = 'shouldEndAnimateBegin';
  //     retval.stateHandlerName = 'onEndAnimateBegin';
  //   } else if (dealForDealerConditions.shouldStartAnimateEnd) {
  //     retval.func = localDealForDealerHandlers.onStartAnimateEnd;
  //     retval.stateConditionName = 'shouldStartAnimateEnd';
  //     retval.stateHandlerName = 'onStartAnimateEnd';
  //   }

  //   return retval;
  // };

  // //#endregion

  // //#region Regular Deal State Handlers
  // const handleStartMoveCardsIntoPositionRegularDeal = async () => {
  //   initMoveCardsIntoPosition.current = true;
  //   await regularDealHandlers.onMoveCardsIntoPosition();
  //   setMoveCardsIntoPositionComplete(true);
  // };

  // const handleStartAnimateBeginRegularDeal = async () => {
  //   initBeginDealForRegularDealEffect.current = true;
  //   await regularDealHandlers.onStartAnimateBegin();
  //   setBeginRegularDealComplete(true);
  // };

  // const handleEndAnimateBeginRegularDeal = async () => {
  //   endBeginDealForRegularDealEffect.current = true;
  //   await regularDealHandlers.onEndAnimateBegin();
  // };

  // const localRegularDealHandlers: RegularDealHandlers = {
  //   onMoveCardsIntoPosition: handleStartMoveCardsIntoPositionRegularDeal,
  //   onStartAnimateBegin: handleStartAnimateBeginRegularDeal,
  //   onEndAnimateBegin: handleEndAnimateBeginRegularDeal
  // };

  // const getEffectRegularDeal = (): StateEffectInfo => {
  //   const regularDealConditions = getRegularDealConditions();
  //   const retval: StateEffectInfo = { statePhase: 'RegularDeal' };

  //   if (regularDealConditions.shouldStartMoveCardsIntoPosition) {
  //     retval.func = localRegularDealHandlers.onMoveCardsIntoPosition;
  //     retval.stateConditionName = 'shouldStartMoveCardsIntoPosition';
  //     retval.stateHandlerName = 'onMoveCardsIntoPosition';
  //   } else if (regularDealConditions.shouldStartAnimateBegin) {
  //     retval.func = localRegularDealHandlers.onStartAnimateBegin;
  //     retval.stateConditionName = 'shouldStartAnimateBegin';
  //     retval.stateHandlerName = 'onStartAnimateBegin';
  //   } else if (regularDealConditions.shouldEndAnimateBegin) {
  //     retval.func = localRegularDealHandlers.onEndAnimateBegin;
  //     retval.stateConditionName = 'shouldEndAnimateBegin';
  //     retval.stateHandlerName = 'onEndAnimateBegin';
  //   }

  //   return retval;
  // };

  //#endregion

  //#endregion

  /** Get the function that should be executed for the effect for the current deck state. */
  const getEffectForDeckState = (): StateEffectInfo => {
    const initEffect = getEffectForInitDeckState(
      getDeckPhase,
      resetForNewDeal,
      addPhaseExecuted,
      initDealHandler
    );

    if (initEffect.func) return initEffect;

    const dealForDealerEffect = getEffectForDealForDealer(
      getDeckPhase,
      addPhaseExecuted,
      addPhaseCompleted,
      dealForDealerHandlers
    );

    if (dealForDealerEffect.func) return dealForDealerEffect;

    const regularDealEffect = getEffectForRegularDeal(
      getDeckPhase,
      addPhaseExecuted,
      addPhaseCompleted,
      regularDealHandlers
    );

    if (regularDealEffect.func) return regularDealEffect;

    return {};
  };

  return { getEffectForDeckState };
};

export default useDeckStateEffect;
