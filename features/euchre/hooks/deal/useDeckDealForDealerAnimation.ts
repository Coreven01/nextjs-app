import { useCallback } from 'react';
import { DealForDealerHandlers, EuchrePlayer } from '../../definitions/game-state-definitions';
import { DealForDealerAnimationState } from '../../definitions/transform-definitions';
import { runCardAnimations } from '../../util/game/cardStateUtil';
import { addAnimateForBeginDealForDealerEvent } from '../../util/deck/deckStateEventsUtil';
import {
  getStatesAnimateDealForDealer,
  getStatesMoveAllCardsToPlayer
} from '../../util/deck/deckTransformUtil';
import { notificationDelay } from '../../util/game/gameDataUtil';

const ERR_ID: string = '[DECK ANIMATION]';

const useDeckDealForDealerAnimation = (deckAnimationState: DealForDealerAnimationState) => {
  const {
    gameContext,
    stateContext,
    deckAnimationControls,
    cardRefs,
    playerDeckRefs,
    initDealer,
    centerHorizontalElement,
    centerVerticalElement,
    outerTableRefs,
    getMoveCardsIntoPositionState,
    updateCardBaseAndAnimationSprings
  } = deckAnimationState;

  const { cardStates, animationStates, animationControls } = stateContext;
  const { state, animationHandlers, eventHandlers } = gameContext;
  const { euchreGame, euchreSettings } = gameContext.state;
  const dealAnimationEnabled = euchreSettings.shouldAnimateDeal;

  //#region Deck State Deal For Dealer Effect Hook

  /**
   * Create the animation values for the cards being dealt for initial deal.
   * */
  const setCardStatesForAnimateDealForDealer = useCallback(() => {
    if (!centerHorizontalElement)
      throw new Error(`${ERR_ID} - Invalid direct center ref for initializing deal.`);
    if (!centerVerticalElement)
      throw new Error(`${ERR_ID} - Invalid direct center ref for initializing deal.`);
    if (!initDealer) throw new Error(`${ERR_ID} - Invalid deal result for dealing cards.`);

    const newStates = getStatesAnimateDealForDealer(
      cardStates,
      animationStates,
      euchreGame,
      euchreSettings.gameSpeed,
      centerHorizontalElement,
      centerVerticalElement,
      outerTableRefs,
      cardRefs,
      initDealer
    );

    updateCardBaseAndAnimationSprings(
      {
        cardStates: newStates.newState,
        animationStates: animationStates,
        animationControls: animationControls
      },
      newStates.springsForDeal.cardSprings,
      newStates.springsForDeal.flipSprings
    );
  }, [
    animationControls,
    animationStates,
    cardRefs,
    cardStates,
    centerHorizontalElement,
    centerVerticalElement,
    euchreGame,
    euchreSettings.gameSpeed,
    initDealer,
    outerTableRefs,
    updateCardBaseAndAnimationSprings
  ]);

  /** Handler to move cards into position for initial deal, and set card states to animate cards being dealt for initial dealer. */
  const handleMoveCardsIntoPositionDealForDealer = useCallback(async () => {
    addAnimateForBeginDealForDealerEvent(true, !dealAnimationEnabled, state, eventHandlers);

    const initialMoves = getMoveCardsIntoPositionState();

    // move from the deck's absolute position to the dealer position.
    await deckAnimationControls.start(initialMoves.initMoveToDealer);

    // slide the deck into view from just off-screen from the dealer's player area.
    await deckAnimationControls.start(initialMoves.moveIntoView);

    // set the card states for animation for the next state phase. This is set here so the next phase will have the latest
    // animations values already saved.
    setCardStatesForAnimateDealForDealer();
  }, [
    dealAnimationEnabled,
    deckAnimationControls,
    eventHandlers,
    getMoveCardsIntoPositionState,
    setCardStatesForAnimateDealForDealer,
    state
  ]);

  /** Set card states to animate cards going to a player side of the game board after cards have been dealt.
   */
  const setCardStateMoveCardsToPlayer = useCallback(
    (destinationPlayer: EuchrePlayer) => {
      const destinationElement = playerDeckRefs.get(destinationPlayer.location)?.current;
      if (!destinationElement)
        throw new Error(`${ERR_ID} - Invalid destination element to move cards to dealer`);

      const newStates = getStatesMoveAllCardsToPlayer(
        stateContext,
        destinationPlayer.location,
        destinationElement,
        cardRefs,
        euchreSettings.gameSpeed,
        'med'
      );

      updateCardBaseAndAnimationSprings(
        {
          cardStates: newStates.newCardStates,
          animationStates: animationStates,
          animationControls: animationControls
        },
        newStates.springsToMove,
        newStates.flipSpringsForMove
      );
    },
    [
      animationControls,
      animationStates,
      cardRefs,
      euchreSettings.gameSpeed,
      playerDeckRefs,
      stateContext,
      updateCardBaseAndAnimationSprings
    ]
  );

  /** Animate cards being dealt for initial dealer. */
  const handleBeginAnimationBeginDealForDealer = useCallback(async () => {
    if (!initDealer?.newDealer)
      throw new Error(`${ERR_ID} - Invalid deal result for animation deal for dealer.`);

    await runCardAnimations(animationControls);
    setCardStateMoveCardsToPlayer(initDealer.newDealer);

    // update game state that card animation for deal for dealer is complete.
    animationHandlers.onBeginDealForDealerComplete();
  }, [animationControls, animationHandlers, initDealer?.newDealer, setCardStateMoveCardsToPlayer]);

  /** Updates state that the animation for cards being dealt is complete. This event is separated
   * because the number of cards to be dealt during intial deal is dynamic.
   */
  const handleEndAnimationBeginDealForDealer = useCallback(async () => {
    addAnimateForBeginDealForDealerEvent(false, !dealAnimationEnabled, state, eventHandlers);

    // delay for an on-screen indicator of who the next dealer will be.
    await notificationDelay(euchreSettings);
    await runCardAnimations(animationControls);
    animationHandlers.onEndDealForDealerComplete();
  }, [animationControls, animationHandlers, dealAnimationEnabled, euchreSettings, eventHandlers, state]);

  /** */
  const dealForDealerHandlers: DealForDealerHandlers = {
    onMoveCardsIntoPosition: handleMoveCardsIntoPositionDealForDealer,
    onStartDealCards: handleBeginAnimationBeginDealForDealer,
    onEndDealCards: handleEndAnimationBeginDealForDealer,
    onMoveCardsToPlayer: () => new Promise<void>((resolve) => setTimeout(resolve, 25))
  };
  //#endregion

  return { dealForDealerHandlers };
};

export default useDeckDealForDealerAnimation;
