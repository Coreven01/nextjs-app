import { useCallback } from 'react';
import { RegularDealHandlers } from '../../definitions/game-state-definitions';
import { RegularDealAnimationState } from '../../definitions/transform-definitions';
import { runCardAnimations } from '../../util/game/cardStateUtil';
import { addAnimateForDealForRegularPlayEvent } from '../../util/deck/deckStateEventsUtil';
import { getCardsStatesRegularDeal, getCardStatesMoveToPlayer } from '../../util/deck/deckTransformUtil';

const ERR_ID: string = '[DECK ANIMATION]';

const useDeckRegularDealAnimation = (deckAnimationState: RegularDealAnimationState) => {
  const {
    deckState,
    gameContext,
    stateContext,
    deckAnimationControls,
    cardRefs,
    playerDeckRefs,
    centerHorizontalElement,
    centerVerticalElement,
    outerTableRefs,
    getMoveCardsIntoPositionState,
    updateCardBaseAndAnimationSprings
  } = deckAnimationState;

  const { animationStates, animationControls } = stateContext;
  const { state, animationHandlers, eventHandlers } = gameContext;
  const { euchreGame, euchreSettings } = gameContext.state;
  const dealAnimationEnabled = euchreSettings.shouldAnimateDeal;

  //#region Deck State Deal For Regular Play Effect Hook

  /** Create the animation values for the cards being dealt for regular play.
   */
  const setCardStateForDealCardsForRegularPlay = useCallback(() => {
    if (!centerHorizontalElement)
      throw new Error(`${ERR_ID} - Invalid direct center element for dealing cards for regular play.`);
    if (!centerVerticalElement)
      throw new Error(`${ERR_ID} - Invalid direct center element for dealing cards for regular play.`);

    const newStates = getCardsStatesRegularDeal(
      stateContext,
      euchreGame,
      euchreSettings.gameSpeed,
      centerHorizontalElement,
      centerVerticalElement,
      outerTableRefs,
      cardRefs
    );

    updateCardBaseAndAnimationSprings(
      {
        cardStates: newStates.newStates,
        animationStates: animationStates,
        animationControls: animationControls
      },
      newStates.springsForDeal,
      []
    );
  }, [
    animationControls,
    animationStates,
    cardRefs,
    centerHorizontalElement,
    centerVerticalElement,
    euchreGame,
    euchreSettings.gameSpeed,
    outerTableRefs,
    stateContext,
    updateCardBaseAndAnimationSprings
  ]);

  /** After cards have been dealt to the player's table area, move cards to outside the bound of the game area, as if the
   * player picked them up.
   */
  const setCardStateMoveCardsForPickup = useCallback(() => {
    const newStates = getCardStatesMoveToPlayer(
      stateContext,
      playerDeckRefs,
      cardRefs,
      euchreSettings.gameSpeed,
      true,
      'med'
    );

    updateCardBaseAndAnimationSprings(
      {
        cardStates: newStates.newCardStates,
        animationStates: animationStates,
        animationControls: animationControls
      },
      newStates.springsToMove,
      []
    );
  }, [
    animationControls,
    animationStates,
    cardRefs,
    euchreSettings.gameSpeed,
    playerDeckRefs,
    stateContext,
    updateCardBaseAndAnimationSprings
  ]);

  /** Handler to move cards into position for initial deal and set state to animate cards being dealt for initial dealer. */
  const handleMoveCardsIntoPositionRegularDeal = useCallback(async () => {
    addAnimateForDealForRegularPlayEvent(true, !dealAnimationEnabled, state, eventHandlers);

    const initialMoves = getMoveCardsIntoPositionState();

    // move from the deck's absolute position to the dealer position.
    await deckAnimationControls.start(initialMoves.initMoveToDealer);

    // slide the deck into view from just off-screen from the dealer's player area.
    await deckAnimationControls.start(initialMoves.moveIntoView);

    setCardStateForDealCardsForRegularPlay();
  }, [
    dealAnimationEnabled,
    deckAnimationControls,
    eventHandlers,
    getMoveCardsIntoPositionState,
    setCardStateForDealCardsForRegularPlay,
    state
  ]);

  /** Animate cards being dealt for regular play. Typical deal pattern is cards are dealt in sets, usually 2 or 3 cards, instead
   * of dealing one card to a player at a time.
   */
  const handleBeginAnimationForRegularPlay = useCallback(async () => {
    if (!deckState) throw new Error(`${ERR_ID} - Invalid deck state for dealing cards for regular play.`);

    await runCardAnimations(animationControls);
    setCardStateMoveCardsForPickup();
  }, [animationControls, deckState, setCardStateMoveCardsForPickup]);

  /** After dealing cards to players for regular play, move cards to the player's area as if they were picked up. */
  const handleEndAnimationForRegularPlay = useCallback(async () => {
    addAnimateForDealForRegularPlayEvent(false, !dealAnimationEnabled, state, eventHandlers);

    await runCardAnimations(animationControls);
    animationHandlers.onBeginRegularDealComplete();
  }, [animationHandlers, dealAnimationEnabled, animationControls, eventHandlers, state]);

  /** */
  const regularDealHandlers: RegularDealHandlers = {
    onMoveCardsIntoPosition: handleMoveCardsIntoPositionRegularDeal,
    onStartDealCards: handleBeginAnimationForRegularPlay,
    onEndDealCards: handleEndAnimationForRegularPlay
  };

  return { regularDealHandlers };

  //#endregion
};

export default useDeckRegularDealAnimation;
