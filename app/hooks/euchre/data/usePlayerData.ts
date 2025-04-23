import {
  Card,
  EuchreCard,
  EuchrePlayer,
  EuchreSettings,
  Suit,
  TEAM_COLOR_MAP,
  TeamColor
} from '@/app/lib/euchre/definitions';
import useCardData from './useCardData';
import { useCallback } from 'react';
import { CardPosition } from './useCardTransform';

const usePlayerData = () => {
  const { cardEqual, cardIsLeftBower, createPlaceholderCards, getCardValues, getSuitCount } = useCardData();

  const euchreCardEqual = (card1: EuchreCard, card2: EuchreCard): boolean => {
    return cardEqual(card1.card, card2.card) && playerEqual(card1.player, card2.player);
  };

  const innerPlayerBaseId = (player: EuchrePlayer): string => {
    return `game-base-${player.playerNumber}-inner`;
  };

  const outerPlayerBaseId = (player: EuchrePlayer): string => {
    return `game-base-${player.playerNumber}`;
  };

  const playerBase = (player: EuchrePlayer): string => {
    return `player-base-${player.playerNumber}`;
  };

  const playerLocation = (player: EuchrePlayer): 'center' | 'side' => {
    return player.playerNumber === 1 || player.playerNumber === 2 ? 'center' : 'side';
  };

  const availableCards = (player: EuchrePlayer): Card[] => {
    return player.hand.filter((c) => c.value !== 'P');
  };

  const playerEqual = useCallback((first: EuchrePlayer, second: EuchrePlayer): boolean => {
    return first.playerNumber === second.playerNumber;
  }, []);

  const getTeamColor = (player: EuchrePlayer, settings: EuchreSettings): TeamColor => {
    if (player.team === 1) {
      return settings.teamOneColor;
    } else {
      return settings.teamTwoColor;
    }
  };

  const getTeamCssClass = (player: EuchrePlayer, settings: EuchreSettings): string => {
    const teamColor = getTeamColor(player, settings);
    const teamCss = TEAM_COLOR_MAP.get(teamColor);

    if (teamCss) return teamCss;

    return 'bg-white';
  };

  /** Remove the card from the player's hand. Maintains card order and indices. */
  const discard = useCallback(
    (player: EuchrePlayer, cardToDiscard: Card, trump: Card): Card[] => {
      if (cardEqual(trump, cardToDiscard)) return [...player.hand];

      const playerCard = player.hand.find((c) => cardEqual(c, cardToDiscard));

      if (!playerCard) throw new Error("Unable to discard. Card not found in player's hand.");

      const tempHand: Card[] = [
        ...player.hand.filter((c) => !cardEqual(c, playerCard)),
        { suit: trump.suit, value: trump.value, index: playerCard.index }
      ].sort((a, b) => a.index - b.index);

      return tempHand;
    },
    [cardEqual]
  );

  /** Get the cards available to play for the current user. Returns the player's hand except the cards have have been played. */
  const availableCardsToPlay = useCallback(
    (player: EuchrePlayer): Card[] => {
      return player.hand.filter((c) => player.playedCards.find((p) => cardEqual(p, c)) === undefined);
    },
    [cardEqual]
  );

  /** Get the rotation of players relative to the given player.
   *
   */
  const getPlayerRotation = useCallback(
    (
      players: EuchrePlayer[],
      relativePlayer: EuchrePlayer,
      playerSittingOut: EuchrePlayer | null = null
    ): EuchrePlayer[] => {
      const playerCount = players.length;
      const playerRotation = [1, 3, 2, 4];
      const returnRotation: EuchrePlayer[] = [];
      const indexOffset = (playerRotation.indexOf(relativePlayer.playerNumber) + 1) % playerCount;

      for (let i = 0; i < playerCount; i++) {
        const playerNumber = playerRotation[(i + indexOffset) % playerCount];

        if (playerSittingOut?.playerNumber === playerNumber) continue;

        const player = players.filter((p) => p.playerNumber === playerNumber);
        if (player?.length) returnRotation.push(player[0]);
      }

      return returnRotation;
    },
    []
  );

  return {
    availableCardsToPlay,
    playerEqual,
    getPlayerRotation,
    discard,
    playerLocation,
    getTeamCssClass
  };
};

export default usePlayerData;
