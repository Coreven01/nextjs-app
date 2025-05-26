import { RefObject, useEffect, useRef } from 'react';
import GameCard from '../game/game-card';
import clsx from 'clsx';

import { getCardClassForPlayerLocation } from '../../util/game/cardDataUtil';
import { logConsole, logError } from '../../../../app/lib/euchre/util/util';
import { incrementSpeed } from '../../util/game/gameDataUtil';
import useCardAnimation from '../../../../app/hooks/euchre/effects/play/useCardAnimation';
import { Card, TableLocation } from '../../definitions/definitions';
import { GamePlayContext, EuchrePlayer } from '../../definitions/game-state-definitions';

type Props = {
  gameContext: GamePlayContext;
  player: EuchrePlayer;

  /** Card to played without user interaction. Used for auto play. */
  playedCard: Card | null;
  playerCenterTableRef: RefObject<HTMLDivElement | null>;
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  centerHorizontalRef: RefObject<HTMLDivElement | null>;
  centerVerticalRef: RefObject<HTMLDivElement | null>;

  onTrickComplete: (card: Card) => void;
  onDealPassed: (playerNumber: number) => void;
  onDealComplete: (playerNumber: number) => void;
  onTrumpOrderedComplete: (playerNumber: number) => void;
};

const PlayerHand = ({
  gameContext,
  player,
  playedCard,
  playerCenterTableRef,
  playerDeckRefs,
  centerHorizontalRef,
  centerVerticalRef,
  onTrickComplete,
  onDealPassed,
  onDealComplete,
  onTrumpOrderedComplete
}: Props) => {
  //#region Hooks

  const {
    playerCardsVisible,
    cardRefs,
    handState,
    cardStates,
    animationControls,
    getCardsToDisplay,
    handlePlayCard,
    updateCardStateForTurn,
    setRefsReady
  } = useCardAnimation(
    gameContext,
    player,
    centerHorizontalRef.current,
    centerVerticalRef.current,
    playerCenterTableRef?.current,
    playerDeckRefs,
    onDealComplete,
    onTrickComplete,
    onTrumpOrderedComplete,
    onDealPassed
  );
  const { euchreGame, euchreSettings } = gameContext.state;

  /** Map of trick ID to the associated card (index) that was played for that trick.*/
  const cardIndicesPlayed = useRef<Map<string, number>>(new Map<string, number>());
  /** Used to prevent clicking cards in rapid succession */
  const isCardClickHandled = useRef(false);

  /** Notify card animation hook that cards have been rendered and refs should be set. */
  useEffect(() => {
    const localSetRefsReady = setRefsReady;

    if (playerCardsVisible && localSetRefsReady) localSetRefsReady(true);

    return () => {
      if (localSetRefsReady) localSetRefsReady(false);
    };
  }, [playerCardsVisible, setRefsReady]);

  /** Animate the card being played. Once animation for the card is complete, the state should be updated that the player
   * played a card.
   */
  useEffect(() => {
    if (playedCard && !cardIndicesPlayed.current.has(euchreGame.currentTrick.trickId)) {
      cardIndicesPlayed.current.set(euchreGame.currentTrick.trickId, playedCard.index);
      logConsole('[PLAYERHAND] [useEffect] [handlePlayCardAnimation], auto played card: ', playedCard);

      const playerTableElement = playerCenterTableRef?.current;

      if (!playerTableElement)
        logError(
          '[PLAYERHAND] [useEffect] [handlePlayCardAnimation] - Invalid table element. Card animation was not handled.'
        );
      else {
        handlePlayCard(playedCard.index);
        //throw new Error('not implemented');
        //onCardPlayed(playedCard);
      }
    }
  }, [handlePlayCard, playedCard, playerCenterTableRef, euchreGame.currentTrick.trickId]);
  //#endregion

  const playerCurrentHand: Card[] = getCardsToDisplay();
  const location = player.location;

  const handleCardClick = (cardIndex: number) => {
    logConsole(
      '[PLAYERHAND] [handleCardClick] - player: ',
      player.name,
      ' trick ids played: ',
      cardIndicesPlayed.current
    );

    if (!isCardClickHandled.current && !cardIndicesPlayed.current.has(euchreGame.currentTrick.trickId)) {
      isCardClickHandled.current = true;
      cardIndicesPlayed.current.set(euchreGame.currentTrick.trickId, cardIndex);

      const delay = incrementSpeed(euchreSettings.gameSpeed, 1);
      const tableElement = playerCenterTableRef?.current;

      updateCardStateForTurn(false);

      if (!tableElement) {
        logError(
          '[PLAYERHAND] [useEffect] [handleCardClick] - Invalid table ref. Card animation was not handled.'
        );
        return;
      }

      // release lock so the next card can be handled.
      setTimeout(() => {
        isCardClickHandled.current = false;
      }, delay);

      handlePlayCard(cardIndex);
    }
  };

  logConsole(
    '*** [PLAYERHAND] [RENDER] player: ',
    player.name,
    ' player hand: ',
    playerCurrentHand
    // ' card states',
    // cardStates,
    // ' card refs: ',
    // cardRefs,
    // ' animation controls: ',
    // animationControls
  );

  return (
    <>
      {playerCardsVisible &&
        handState &&
        playerCurrentHand.map((card) => {
          const keyval = `${player.playerNumber}-${card.index}`;
          const cardState = cardStates.find((s) => s.cardIndex === card.index);
          const animationControl = animationControls[card.index];
          const cardRef = cardRefs.get(card.index);

          return cardState && cardRef ? (
            <GameCard
              renderKey={cardState.renderKey}
              key={keyval}
              className={clsx('absolute', getCardClassForPlayerLocation(player.location))}
              location={location}
              card={card}
              cardState={cardState}
              animationControls={animationControl}
              ref={cardRef}
              width={handState.width}
              height={handState.height}
              responsive={true}
              onCardClick={cardState.enabled ? handleCardClick : undefined}
            />
          ) : (
            <div>Invalid card state or card ref.</div>
          );
        })}
    </>
  );
};

export default PlayerHand;
