import { useCallback, useRef } from 'react';
import { playerSittingOut } from '../util/game/gameDataUtil';
import { EuchrePlayer, EuchreTrick, GamePlayContext } from '../definitions/game-state-definitions';
import { Card } from '../definitions/definitions';

const usePlayerActionState = (gameContext: GamePlayContext) => {
  const playersInitDealFinished = useRef<Set<number>>(new Set<number>());
  const playersTrumpOrderedComplete = useRef<Set<number>>(new Set<number>());
  const playersDealPassedComplete = useRef<Set<number>>(new Set<number>());

  /** Map of trick id to the card values that were played for that trick. */
  const cardsPlayedForTrick = useRef<Map<string, Set<string>>>(new Map<string, Set<string>>());

  /** Set of trick id's where the event handler was executed to finish the trick. */
  const tricksFinished = useRef<Set<string>>(new Set<string>());

  const { euchreGame } = gameContext.state;
  const sittingOutPlayer: EuchrePlayer | null = playerSittingOut(euchreGame);

  const cardCountDuringPlay: number = sittingOutPlayer ? 3 : 4;

  const resetStateForNewHand = () => {
    playersInitDealFinished.current.clear();
    playersTrumpOrderedComplete.current.clear();
    cardsPlayedForTrick.current.clear();
    tricksFinished.current.clear();
    playersDealPassedComplete.current.clear();
  };

  const handleDealAnimationComplete = useCallback(
    (playerNumber: number) => {
      //logConsole('*** [PLAYERCARDAREA] [handleDealAnimationComplete]');
      if (playersInitDealFinished.current.values().toArray().length === 4) return;

      playersInitDealFinished.current.add(playerNumber);

      if (playersInitDealFinished.current.values().toArray().length === 4) {
        gameContext.animationHandlers.onEndRegularDealComplete();
      }
    },
    [gameContext.animationHandlers]
  );

  const handlePassDealAnimationComplete = (playerNumber: number) => {
    //logConsole('*** [PLAYERCARDAREA] [handleDealAnimationComplete]');
    if (playersDealPassedComplete.current.values().toArray().length === 4) return;

    playersDealPassedComplete.current.add(playerNumber);

    if (playersDealPassedComplete.current.values().toArray().length === 4) {
      gameContext.animationHandlers.onPassDealComplete();
    }
  };

  // const handleCardPlayed = (card: Card) => {
  //   // animationHandlers.onCardPlayed(card);
  // };

  const handleTrickFinished = useCallback(
    (card: Card) => {
      //logConsole('*** [PLAYERCARDAREA] [handleTrickFinished]');

      const trick: EuchreTrick | undefined = euchreGame.currentTrick;
      const trickFinished = tricksFinished.current.has(trick.trickId);

      if (trickFinished) return;

      const cardVals = cardsPlayedForTrick.current.get(trick.trickId) ?? new Set<string>();

      cardVals.add(`${card.value}-${card.suit}`);
      cardsPlayedForTrick.current.set(trick.trickId, cardVals);

      if (trick.playerRenege || cardVals.values().toArray().length === cardCountDuringPlay) {
        tricksFinished.current.add(trick.trickId);
        gameContext.animationHandlers.onTrickFinished();
      }
    },
    [cardCountDuringPlay, euchreGame.currentTrick, gameContext.animationHandlers]
  );

  const handleTrumpOrderedComplete = useCallback(
    (playerNumber: number) => {
      //logConsole('*** [PLAYERCARDAREA] [handleTrickFinished]');
      if (playersTrumpOrderedComplete.current.values().toArray().length === 4) return;

      playersTrumpOrderedComplete.current.add(playerNumber);

      if (playersTrumpOrderedComplete.current.values().toArray().length === 4) {
        gameContext.animationHandlers.onTrumpOrderedComplete();
      }
    },
    [gameContext.animationHandlers]
  );

  return {
    resetStateForNewHand,
    handleDealAnimationComplete,
    handleTrickFinished,
    handleTrumpOrderedComplete,
    handlePassDealAnimationComplete
  };
};

export default usePlayerActionState;
