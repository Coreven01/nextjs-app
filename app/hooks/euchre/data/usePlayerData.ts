import {
  Card,
  EuchreCard,
  EuchrePlayer,
  EuchreSettings,
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

  const discard = useCallback(
    (player: EuchrePlayer, cardToDiscard: Card, trump: Card): Card[] => {
      if (cardEqual(trump, cardToDiscard) || player.hand.find((c) => cardEqual(c, cardToDiscard))) {
        const tempHand = [...player.hand, trump].filter((c) => !cardEqual(c, cardToDiscard));
        tempHand.forEach((c, index) => (c.index = index));
        return tempHand;
      } else {
        throw new Error("Unable to discard. Card not found in player's hand.");
      }
    },
    [cardEqual]
  );

  const availableCardsToPlay = useCallback(
    (player: EuchrePlayer): Card[] => {
      return player.hand.filter((c) => player.playedCards.find((p) => cardEqual(p, c)) === undefined);
    },
    [cardEqual]
  );

  // const orderPlayerHand = useCallback(
  //   (cards: Card[]): Card[] => {
  //     switch (cards.length) {
  //       case 5:
  //         return cards.map((c) => {
  //           return c;
  //         });
  //       case 4:
  //         return [...cards, ...createPlaceholderCards(1)].slice(0, 5).map((c) => {
  //           return c;
  //         });
  //       case 3:
  //         return [...createPlaceholderCards(1), ...cards, ...createPlaceholderCards(1)]
  //           .slice(0, 5)
  //           .map((c) => {
  //             return c;
  //           });
  //       case 2:
  //         return [...createPlaceholderCards(1), ...cards, ...createPlaceholderCards(2)]
  //           .slice(0, 5)
  //           .map((c) => {
  //             return c;
  //           });
  //       case 1:
  //         return [...createPlaceholderCards(2), ...cards, ...createPlaceholderCards(2)]
  //           .slice(0, 5)
  //           .map((c) => {
  //             return c;
  //           });
  //     }

  //     return createPlaceholderCards(5).map((c) => {
  //       return c;
  //     });
  //   },
  //   [createPlaceholderCards]
  // );

  const sortCardsIndices = useCallback(
    (cards: Card[], trump: Card | null): CardPosition[] => {
      const retval: CardPosition[] = [];
      let counter: number = 0;

      const suitCount = getSuitCount(cards, trump).sort((a, b) => b.count - a.count);
      const cardValues = getCardValues(cards, trump);

      if (trump) {
        const trumpCards: Card[] = cardValues
          .filter((c) => c.card.suit === trump.suit || cardIsLeftBower(c.card, trump))
          .sort((a, b) => b.value - a.value)
          .map((c) => c.card);

        for (const trumpCard of trumpCards) {
          retval.push({ ordinalIndex: counter++, cardIndex: trumpCard.index });
        }

        const offSuitCards = cardValues.filter((c) => !trumpCards.includes(c.card));
        for (const suitVal of suitCount.filter((s) => s.suit !== trump.suit)) {
          for (const offSuitCard of offSuitCards
            .filter((c) => c.card.suit === suitVal.suit)
            .sort((a, b) => b.value - a.value)
            .map((c) => c.card)) {
            retval.push({ ordinalIndex: counter++, cardIndex: offSuitCard.index });
          }
        }
      } else {
        const suitCountAndValue = suitCount.map((s) => ({
          ...s,
          value: cardValues.filter((v) => v.card.suit === s.suit).reduce((acc, curr) => acc + curr.value, 0)
        }));

        for (const suitVal of suitCountAndValue.sort((a, b) => {
          if (a.count !== b.count) {
            return a.count > b.count ? -1 : 1;
          }

          if (a.value !== b.value) {
            return a.value > b.value ? -1 : 1;
          }

          return 0;
        })) {
          for (const card of cardValues
            .filter((c) => c.card.suit === suitVal.suit)
            .sort((a, b) => (a.value > b.value ? -1 : 1))
            .map((c) => c.card)) {
            retval.push({ ordinalIndex: counter++, cardIndex: card.index });
          }
        }
      }

      return retval;
    },
    [cardIsLeftBower, getCardValues, getSuitCount]
  );

  const indexCards = (cards: Card[]): Card[] => {
    const newCards = [...cards];
    newCards.forEach((c, index) => (c.index = index));
    return newCards;
  };

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
    sortCardsIndices,
    indexCards,
    getPlayerRotation,
    discard,
    playerLocation,
    getTeamCssClass
  };
};

export default usePlayerData;
