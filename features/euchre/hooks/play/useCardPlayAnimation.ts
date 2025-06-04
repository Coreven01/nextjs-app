import { useCallback, useRef } from 'react';
import { logConsole } from '../../util/util';
import { CardBaseState, PlayHandHandlers } from '../../definitions/game-state-definitions';
import { Card } from '../../definitions/definitions';
import { availableCardsToPlay, playerEqual } from '../../util/game/playerDataUtil';
import {
  getCardsAvailableToPlay,
  isHandFinished,
  notificationDelay,
  playerSittingOut
} from '../../util/game/gameDataUtil';
import {
  CardAnimationControls,
  CardPlayAnimationState,
  CardSpringProps,
  DEFAULT_SPRING_VAL,
  INIT_Z_INDEX,
  SpringContext
} from '../../definitions/transform-definitions';
import {
  getDestinationOffset,
  getDurationSeconds,
  getFaceDownSpringForLocation,
  getSpringMoveElement,
  getSpringsForCardPlayed,
  getSpringsGroupHand,
  getSpringToMoveToPlayer
} from '../../util/play/cardTransformUtil';
import { getCardFullName } from '../../util/game/cardSvgDataUtil';
import { runCardAnimations } from '../../util/game/cardStateUtil';
import { v4 as uuidv4 } from 'uuid';
import { cardEqual } from '../../util/game/cardDataUtil';

const ERR_ID: string = '[CARD PLAY ANIMATION]';

/** Handlers for animating cards during regular game play.  */
const useCardPlayAnimation = (cardPlayState: CardPlayAnimationState) => {
  /** Map of trick id to card played for that trick. Used when rendering cards to be displayed. */
  const cardPlayedForTrickRef = useRef<Map<string, Card>>(new Map<string, Card>());
  const playedCardIndex = useRef(-1);

  const {
    handState,
    gameContext,
    stateContext,
    player,
    dispatchAnimationState,
    playerTableCenterElement,
    cardRefs,
    playerDeckRefs,
    initializeSortOrder,
    getRelativeCenter,
    getWidth,
    getAvailableCardsAndState,
    onTrickComplete,
    onTrumpOrderedComplete,
    onDealPassed
  } = cardPlayState;

  const { setCardStates, setCardAnimationControls } = dispatchAnimationState;
  const { cardStates, animationControls, animationStates } = stateContext;
  const { state, animationHandlers } = gameContext;
  const { euchreGame, euchreSettings } = state;
  const currentTrick = euchreGame.currentTrick;

  //#region Card Play Functions/Handlers Hook

  /** Returns the cards should be displayed on the game table. Ensures the played cards stays center table until the trick is finished.
   */
  const getCardsToDisplay = () => {
    const playerCurrentHand: Card[] = availableCardsToPlay(player);

    // get the last trick played, then get the last card that was played from that trick.
    const lastCardPlayed = cardPlayedForTrickRef.current.get(euchreGame.currentTrick.trickId);
    if (
      lastCardPlayed &&
      euchreGame.currentTrick.cardsPlayed.find((c) => cardEqual(c.card, lastCardPlayed))
    ) {
      playerCurrentHand.push(lastCardPlayed); // make sure the card is still visible until trick finished.
    } else if (lastCardPlayed && isHandFinished(euchreGame)) {
      playerCurrentHand.push(lastCardPlayed);
    }
    return playerCurrentHand;
  };

  /** Create card states to move cards from the center of the table to the player that won the trick. */
  const animateTakeTrick = useCallback(async () => {
    const lastCardPlayed: Card | undefined = cardPlayedForTrickRef.current.get(currentTrick.trickId);

    logConsole('[CARD STATE] [animateTrickFinished]', ' player: ', player.name);

    if (lastCardPlayed && handState && currentTrick.playerRenege) {
      // if player reneged, then don't animate taking the trick, and just call the event handler as if the animation was complete.
      onTrickComplete(lastCardPlayed);
    } else if (lastCardPlayed && handState && !currentTrick.playerRenege) {
      // animate trick being taken by the winner.
      const newAnimationControls = [...animationControls];
      const trickWonLocation = currentTrick.taker?.location;
      const cardElement = cardRefs.entries().find((r) => r[0] === lastCardPlayed.index)?.[1]?.current;
      const destinationDeckElement = playerDeckRefs
        .entries()
        .find((r) => r[0] === trickWonLocation)?.[1]?.current;

      if (!cardElement) throw new Error(`${ERR_ID} - Card element not found for animate trick.`);
      if (!destinationDeckElement)
        throw new Error(`${ERR_ID} - Destination element not found for animate trick.`);

      const animationState = animationStates.find((s) => s.cardIndex === lastCardPlayed.index);
      const animationControl = newAnimationControls.find((s) => s.cardIndex === lastCardPlayed.index);

      if (!animationState) throw new Error(`${ERR_ID} - Animation state not found for animate trick.`);
      if (!animationControl) throw new Error(`${ERR_ID} - Animation control not found for animate trick.`);

      const springContext: SpringContext = {
        sourceElement: cardElement,
        destinationElement: destinationDeckElement,
        currentSpring: animationControl.animateSprings.at(-1),
        gameSpeed: euchreSettings.gameSpeed
      };

      if (cardElement && destinationDeckElement && trickWonLocation) {
        const moveSpring = getSpringToMoveToPlayer(
          springContext,
          lastCardPlayed.index,
          animationState,
          animationControl,
          true,
          'low'
        );

        animationControl.animateSprings = moveSpring.animateSprings;
        await runCardAnimations([animationControl]);
      }

      setCardAnimationControls(newAnimationControls);
      onTrickComplete(lastCardPlayed);
    }
  }, [
    animationControls,
    animationStates,
    cardRefs,
    currentTrick.playerRenege,
    currentTrick.taker?.location,
    currentTrick.trickId,
    euchreSettings.gameSpeed,
    handState,
    onTrickComplete,
    player.name,
    playerDeckRefs,
    setCardAnimationControls
  ]);

  /** Animate cards to move cards off-screen for a player sitting out for the current hand. Also used when passing deal if
   * settings disable animation for dealing cards.
   */
  const animateMoveCardsBackToPlayer = useCallback(async () => {
    const newAnimationControls: CardAnimationControls[] = [];
    const duration = getDurationSeconds(euchreSettings.gameSpeed);
    const sourceElement = cardRefs.get(player.playerNumber)?.current;
    const destinationElement = playerDeckRefs.get(player.location)?.current;
    const relativeElement = getRelativeCenter(player.location);

    if (!sourceElement) throw new Error(`${ERR_ID} - Soure element not found for player sitting out.`);
    if (!destinationElement)
      throw new Error(`${ERR_ID} - Destination element not found for player sitting out.`);
    if (!relativeElement) throw new Error(`${ERR_ID} - Relative element not found for player sitting out.`);

    for (const card of player.hand) {
      const animationControl = animationControls.find((c) => c.cardIndex === card.index);

      if (!animationControl)
        throw new Error(`${ERR_ID} - Animation control not found for player sitting out.`);

      const groupCard = {
        ...DEFAULT_SPRING_VAL,
        zIndex: INIT_Z_INDEX + card.index,
        transition: { duration: duration }
      };

      const moveOffScreen = getSpringMoveElement(
        { sourceElement, destinationElement, relativeElement },
        true,
        'out'
      );

      moveOffScreen.opacity = 0;
      moveOffScreen.transition = { delay: duration / 2, duration };

      newAnimationControls.push({
        cardIndex: card.index,
        controls: animationControl.controls,
        animateSprings: [groupCard, moveOffScreen]
      });
    }

    await runCardAnimations(newAnimationControls);
  }, [
    animationControls,
    cardRefs,
    euchreSettings.gameSpeed,
    getRelativeCenter,
    player.hand,
    player.location,
    player.playerNumber,
    playerDeckRefs
  ]);

  /** Animate cards being passed to the new dealer for the next hand after all players passed. */
  const animatePassDeal = useCallback(async () => {
    logConsole('[CARD STATE] [animatePassDeal]', ' player: ', player.name);

    const cardAnimations: CardAnimationControls[] = [];
    const newAnimationControls = [...animationControls];
    const newDealerLocation = euchreGame.dealer.location;
    const offsets = getDestinationOffset(newDealerLocation);
    const destinationDeckElement = playerDeckRefs
      .entries()
      .find((r) => r[0] === newDealerLocation)?.[1]?.current;
    if (!destinationDeckElement) throw new Error(`${ERR_ID} - Destination element not found for pass deal.`);

    for (const card of player.hand) {
      const cardElement = cardRefs.entries().find((r) => r[0] === card.index)?.[1]?.current;
      if (!cardElement) throw new Error(`${ERR_ID} - Card element not found for pass deal.`);
      const animationState = animationStates.find((s) => s.cardIndex === card.index);
      const animationControl = newAnimationControls.find((s) => s.cardIndex === card.index);

      if (!animationState) throw new Error(`${ERR_ID} - Animation state not found for pass deal.`);
      if (!animationControl) throw new Error(`${ERR_ID} - Animation control not found for pass deal.`);

      const springContext: SpringContext = {
        sourceElement: cardElement,
        destinationElement: destinationDeckElement,
        currentSpring: animationControl.animateSprings.at(-1),
        gameSpeed: euchreSettings.gameSpeed
      };

      if (cardElement && destinationDeckElement && newDealerLocation) {
        const moveSpring = getSpringToMoveToPlayer(
          springContext,
          card.index,
          animationState,
          animationControl,
          true,
          'low'
        );

        moveSpring.animateSprings.forEach((s) => {
          s.x += offsets.x;
          s.y += offsets.y;
        });

        animationControl.animateSprings = moveSpring.animateSprings;
        cardAnimations.push(animationControl);
      }
    }

    await runCardAnimations(cardAnimations);
  }, [
    animationControls,
    animationStates,
    cardRefs,
    euchreGame.dealer.location,
    euchreSettings.gameSpeed,
    player.hand,
    player.name,
    playerDeckRefs
  ]);

  /** Animate a player picking up the trump card and discarding a different card. */
  const animateDiscard = async () => {
    const discard = euchreGame.discard;
    if (!discard) return;

    const newAnimationControls = [...animationControls];
    const dealerLocation = player.location;
    const cardElement = cardRefs.entries().find((r) => r[0] === discard.index)?.[1]?.current;
    const destinationElement = playerDeckRefs.entries().find((r) => r[0] === dealerLocation)?.[1]?.current;

    if (!cardElement) throw new Error(`${ERR_ID} - Card element not found for animate discard.`);
    if (!destinationElement)
      throw new Error(`${ERR_ID} - Destination element not found for animate discard.`);

    const animationState = animationStates.find((s) => s.cardIndex === discard.index);
    const animationControl = newAnimationControls.find((s) => s.cardIndex === discard.index);
    let lastAnimationSpring = animationControl?.animateSprings.at(-1);

    if (!lastAnimationSpring) throw new Error(`${ERR_ID} - Animation spring not found for animate discard.`);
    if (!animationState) throw new Error(`${ERR_ID} - Animation state not found for animate discard.`);
    if (!animationControl) throw new Error(`${ERR_ID} - Animation control not found for animate discard.`);

    lastAnimationSpring = { ...lastAnimationSpring };
    const offsets = getDestinationOffset(dealerLocation);
    const springContext: SpringContext = {
      sourceElement: cardElement,
      destinationElement: destinationElement,
      currentSpring: lastAnimationSpring,
      gameSpeed: euchreSettings.gameSpeed
    };

    if (cardElement && destinationElement) {
      const transitionDurationSec = getDurationSeconds(euchreSettings.gameSpeed) / 2;
      const moveSpring = getSpringToMoveToPlayer(
        springContext,
        discard.index,
        animationState,
        animationControl,
        false
      );

      moveSpring.animateSprings.forEach((s) => {
        s.x += offsets.x;
        s.y += offsets.y;
      });

      if (handState?.shouldShowCardValue) {
        const flipDownSpring = getFaceDownSpringForLocation(dealerLocation);

        flipDownSpring.transition = { duration: transitionDurationSec };
        moveSpring.animateSprings[0].transition = {
          delay: transitionDurationSec,
          duration: transitionDurationSec
        };
        lastAnimationSpring.transition = {
          delay: transitionDurationSec * 2,
          duration: transitionDurationSec
        };

        animationControl.animateFlipSprings = [flipDownSpring];
      } else {
        moveSpring.animateSprings[0].transition = {
          delay: transitionDurationSec,
          duration: transitionDurationSec
        };
        lastAnimationSpring.transition = {
          delay: transitionDurationSec * 2,
          duration: transitionDurationSec
        };
      }

      animationControl.animateSprings = moveSpring.animateSprings;
      animationControl.animateSprings?.push(lastAnimationSpring);
    }

    await runCardAnimations([animationControl]);
    setCardAnimationControls(newAnimationControls);
  };

  /** */
  const animateReorderHand = useCallback(() => {
    initializeSortOrder();
    const currentProps = getAvailableCardsAndState(true);
    const location = player.location;
    const cardElement = cardRefs.get(0)?.current;
    const newAnimationControls = [...animationControls];
    const duration = getDurationSeconds(euchreSettings.gameSpeed);

    if (!cardElement) throw new Error(`${ERR_ID} - Card element not found for reorder hand.`);

    const calculatedWidth = getWidth(cardElement, false);
    const regroupSprings: CardSpringProps[] = getSpringsGroupHand(location, calculatedWidth, currentProps);
    const showPlayerCards = handState?.shouldShowCardValue;

    for (const newSpring of regroupSprings) {
      const control = newAnimationControls.find((c) => c.cardIndex === newSpring.cardIndex);

      if (!control) throw new Error(`${ERR_ID} - Animation control not found for reorder hand.`);

      control.animateSprings = newSpring.animateSprings;
      control.animateSprings[0].transition = { duration: duration };

      if (showPlayerCards && control.animateFlipSprings?.length) {
        const flipSpring = control.animateFlipSprings[0];
        if (flipSpring.rotateX === 180 || flipSpring.rotateY === 180) {
          control.animateFlipSprings = [
            { rotateX: 0, rotateY: 0, transition: { delay: duration, duration } }
          ];
        }
      }
    }

    setCardAnimationControls(newAnimationControls);
  }, [
    animationControls,
    cardRefs,
    euchreSettings.gameSpeed,
    getAvailableCardsAndState,
    getWidth,
    handState?.shouldShowCardValue,
    initializeSortOrder,
    player.location,
    setCardAnimationControls
  ]);

  /** Gets the cards that are available to be played for the current trick. If enforce follow suit setting is enabled, then only
   * return those cards. If not enabled, then return all cards currently in the player's hand.
   */
  const getCardsAvailableIfFollowSuit = useCallback(() => {
    const playerCurrentHand: Card[] = availableCardsToPlay(player);
    const cardsAvailableForFollowSuit: Card[] = [];

    if (euchreSettings.enforceFollowSuit) {
      // only enable cards that are available for follow suit, if enabled by settings.
      const leadCard = euchreGame.currentTrick.cardsPlayed.at(0)?.card ?? null;
      cardsAvailableForFollowSuit.push(
        ...getCardsAvailableToPlay(euchreGame.trump, leadCard, playerCurrentHand).map((c) => c.card)
      );
    } else {
      // enable all cards to be played that have yet to be played for the current hand.
      cardsAvailableForFollowSuit.push(...playerCurrentHand);
    }

    return cardsAvailableForFollowSuit;
  }, [euchreGame.currentTrick.cardsPlayed, euchreGame.trump, euchreSettings.enforceFollowSuit, player]);

  /**
   * At the beginning of a player's turn, update the card state to enable/disable cards and overlay
   * depending on settings.
   */
  const updateCardStateForTurn = useCallback(
    async (awaitingPlayerInput: boolean) => {
      if (!handState) throw new Error(`${ERR_ID} - Hand state not found for player turn.`);

      const newCardStates: CardBaseState[] = [...cardStates];
      const availableCards = getCardsAvailableIfFollowSuit().map((c) => c.index);

      for (const cardState of newCardStates) {
        const isAvailable: boolean = availableCards.includes(cardState.cardIndex);
        const cardEnabled = awaitingPlayerInput && isAvailable;
        const addOverlay = awaitingPlayerInput ? awaitingPlayerInput && !isAvailable : false;

        if (handState.shouldShowCardValue) {
          cardState.enabled = cardEnabled;
          cardState.cardFullName = getCardFullName(player.hand[cardState.cardIndex]);
          cardState.valueVisible = true;
          cardState.cardOverlay = addOverlay;
          cardState.renderKey = uuidv4();
        }
      }

      setCardStates(newCardStates);
    },
    [cardStates, getCardsAvailableIfFollowSuit, handState, player.hand, setCardStates]
  );

  /** Create card states to animate the card being played to the center of the table.
   * Regroups the remaining cards together in the player's hand. */
  const getStatesForPlayCard = (cardIndex: number, cardElement: HTMLElement, tableElement: HTMLElement) => {
    const newCardStates: CardBaseState[] = [...cardStates];
    const card = player.hand.find((c) => c.index === cardIndex);
    const currentProps: CardSpringProps[] = getAvailableCardsAndState(true);
    const cardWidthOffset = getWidth(cardElement, false);
    const newAnimationControls = [...animationControls];
    const animationState = animationStates.find((s) => s.cardIndex === cardIndex);

    if (!card) throw new Error();
    if (!animationState) throw new Error(`${ERR_ID} - Animation state not found for play card.`);

    const newSpringValues = getSpringsForCardPlayed(
      cardIndex,
      player,
      cardElement,
      tableElement,
      currentProps,
      animationState,
      euchreSettings.gameSpeed
    );

    const regroupHandValues = getSpringsGroupHand(
      player.location,
      cardWidthOffset,
      currentProps.filter((c) => c.cardIndex !== cardIndex)
    );

    for (const ctrl of newAnimationControls) {
      const newSpringVal = newSpringValues.cardSprings.find((c) => c.cardIndex === ctrl.cardIndex);
      const newFlipSpringVal = newSpringValues.flipSprings.find((c) => c.cardIndex === ctrl.cardIndex);
      const regroupVal = regroupHandValues.find((c) => c.cardIndex === ctrl.cardIndex);

      ctrl.animateSprings = [];
      ctrl.animateFlipSprings = [];

      if (newSpringVal) ctrl.animateSprings = newSpringVal.animateSprings;
      if (newFlipSpringVal) ctrl.animateFlipSprings = newFlipSpringVal.animateSprings;
      if (regroupVal) ctrl.animateSprings = regroupVal.animateSprings;
    }

    const cardState = newCardStates.find((s) => s.cardIndex === cardIndex);

    if (!cardState) throw new Error(`${ERR_ID} - Card state not found for player turn.`);

    cardState.renderKey = uuidv4();
    cardState.cardFullName = getCardFullName(card);
    cardState.valueVisible = true;
    cardState.cardOverlay = false;

    const trickId: string = euchreGame.currentTrick.trickId;
    cardPlayedForTrickRef.current.set(trickId, card);

    return { newCardStates, newAnimationControls };
  };

  //#region Game Play Handlers

  /** */
  const handleDiscard = async () => {
    if (!euchreGame.discard) return;

    const playerIsDealer = playerEqual(player, euchreGame.dealer);

    if (!playerIsDealer) return;

    if (euchreGame.loner) {
      const sittingOut = playerSittingOut(euchreGame);
      if (sittingOut && playerEqual(sittingOut, euchreGame.dealer)) {
        return;
      }
    }

    await animateDiscard();
  };

  /** */
  const handleReorderHand = useCallback(async () => {
    if (!handState?.shouldShowCardValue) {
      return;
    }

    if (euchreGame.loner) {
      const sittingOut = playerSittingOut(euchreGame);
      if (sittingOut && playerEqual(sittingOut, player)) {
        return;
      }
    }

    animateReorderHand();
    updateCardStateForTurn(false);
  }, [animateReorderHand, euchreGame, handState?.shouldShowCardValue, player, updateCardStateForTurn]);

  const handleAnimateReorder = useCallback(async () => {
    if (euchreGame.loner) {
      const sittingOut = playerSittingOut(euchreGame);
      if (sittingOut && playerEqual(sittingOut, player)) {
        onTrumpOrderedComplete(player.playerNumber);
        return;
      }
    }

    if (handState?.shouldShowCardValue) {
      await runCardAnimations(animationControls);
    }

    onTrumpOrderedComplete(player.playerNumber);
  }, [animationControls, euchreGame, handState?.shouldShowCardValue, onTrumpOrderedComplete, player]);

  /** Sets the animation for the card to be played. On the callback when the animation is finished is when the state is updated with
   * the card that was played.
   */
  const handleBeginPlayCard = async () => {
    const currentState = cardStates.find((c) => c.cardIndex === playedCardIndex.current);
    const cardElement = cardRefs.get(playedCardIndex.current)?.current;

    if (!currentState || !cardElement)
      throw new Error(`${ERR_ID} [handleBeginPlayCard] - Invalid card state`);
    if (!handState) throw new Error(`${ERR_ID} [handlePlayCardAnimation] - Invalid hand state`);

    if (!playerTableCenterElement)
      throw new Error(`${ERR_ID} [handleBeginPlayCard] - Invalid player table center element.`);

    const newStates = getStatesForPlayCard(playedCardIndex.current, cardElement, playerTableCenterElement);

    /** Animation is run here to for more responsiveness if cards are shown. */
    if (handState.shouldShowCardValue) {
      await runCardAnimations(animationControls);
    }

    setCardStates(newStates.newCardStates);
    setCardAnimationControls(newStates.newAnimationControls);
  };

  /** */
  const handleAnimatePlayCard = async () => {
    if (!handState?.shouldShowCardValue) {
      await runCardAnimations(animationControls);
    }

    animationHandlers.onCardPlayedComplete();
  };

  /** */
  const handleBeginPlayerTurn = useCallback(async () => {
    await updateCardStateForTurn(true);
  }, [updateCardStateForTurn]);

  /** */
  const handleEndPlayerTurn = useCallback(async () => {
    await updateCardStateForTurn(false);
  }, [updateCardStateForTurn]);

  /** */
  const handleTrickFinished = useCallback(async () => {
    await animateTakeTrick();
  }, [animateTakeTrick]);

  /** */
  const handlePassDeal = useCallback(async () => {
    const animations: Promise<void>[] = [];

    if (euchreSettings.shouldAnimateDeal) {
      animations.push(animatePassDeal());
    } else {
      animations.push(animateMoveCardsBackToPlayer());
    }

    animations.push(notificationDelay(euchreSettings));

    await Promise.all(animations);

    onDealPassed(player.playerNumber);
  }, [animateMoveCardsBackToPlayer, animatePassDeal, euchreSettings, onDealPassed, player.playerNumber]);

  /** */
  const handleSittingOut = useCallback(async () => {
    await animateMoveCardsBackToPlayer();
  }, [animateMoveCardsBackToPlayer]);

  /** Update game state that a card was played, either auto played or selected by the user. */
  const handlePlayCard = (cardIndex: number) => {
    playedCardIndex.current = cardIndex;
    const card = player.hand[cardIndex];
    animationHandlers.onCardPlayed(card);
  };

  const playHandHandler: PlayHandHandlers = {
    onPlayCard: handleBeginPlayCard,
    onDiscard: handleDiscard,
    onAnimatePlayCard: handleAnimatePlayCard,
    onPassDeal: handlePassDeal,
    onReorderHand: handleReorderHand,
    onAnimateReorderHand: handleAnimateReorder,
    onPlayerSittingOut: handleSittingOut,
    onTrickFinished: handleTrickFinished,
    onBeginPlayerTurn: handleBeginPlayerTurn,
    onEndPlayerTurn: handleEndPlayerTurn
  };

  //#endregion

  return {
    cardPlayedForTrick: cardPlayedForTrickRef.current,
    getCardsToDisplay,
    updateCardStateForTurn,
    getCardsAvailableIfFollowSuit,
    handlePlayCard,
    playHandHandler
  };
  //#endregion
};

export default useCardPlayAnimation;
