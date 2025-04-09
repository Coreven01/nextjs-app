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

  const playerEqual = (first: EuchrePlayer, second: EuchrePlayer): boolean => {
    return first.playerNumber === second.playerNumber;
  };

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

  const orderPlayerHand = useCallback(
    (cards: Card[]): Card[] => {
      switch (cards.length) {
        case 5:
          return cards.map((c) => {
            return c;
          });
        case 4:
          return [...cards, ...createPlaceholderCards(1)].slice(0, 5).map((c) => {
            return c;
          });
        case 3:
          return [...createPlaceholderCards(1), ...cards, ...createPlaceholderCards(1)]
            .slice(0, 5)
            .map((c) => {
              return c;
            });
        case 2:
          return [...createPlaceholderCards(1), ...cards, ...createPlaceholderCards(2)]
            .slice(0, 5)
            .map((c) => {
              return c;
            });
        case 1:
          return [...createPlaceholderCards(2), ...cards, ...createPlaceholderCards(2)]
            .slice(0, 5)
            .map((c) => {
              return c;
            });
      }

      return createPlaceholderCards(5).map((c) => {
        return c;
      });
    },
    [createPlaceholderCards]
  );

  const sortCards = useCallback(
    (player: EuchrePlayer, trump: Card | null): Card[] => {
      let availableCards: Card[] = availableCardsToPlay(player);

      if (availableCards.length < 5) {
        availableCards = orderPlayerHand(availableCards);
        availableCards.forEach((c, index) => (c.index = index));

        return availableCards;
      }

      availableCards = [];
      const suitCount = getSuitCount(player.hand, trump).sort((a, b) => b.count - a.count);
      const cardValues = getCardValues(player.hand, trump);

      if (trump) {
        const trumpCards = cardValues
          .filter((c) => c.card.suit === trump.suit || cardIsLeftBower(c.card, trump))
          .sort((a, b) => b.value - a.value)
          .map((c) => c.card);
        availableCards.push(...trumpCards);

        const offSuitCards = cardValues.filter((c) => !trumpCards.includes(c.card));
        for (const suitVal of suitCount.filter((s) => s.suit !== trump.suit)) {
          availableCards.push(
            ...offSuitCards
              .filter((c) => c.card.suit === suitVal.suit)
              .sort((a, b) => b.value - a.value)
              .map((c) => c.card)
          );
        }
      } else {
        for (const suitVal of suitCount) {
          availableCards.push(
            ...cardValues
              .filter((c) => c.card.suit === suitVal.suit)
              .sort((a, b) => b.value - a.value)
              .map((c) => c.card)
          );
        }
      }

      availableCards = orderPlayerHand(availableCards);
      availableCards.forEach((c, index) => (c.index = index));
      return availableCards;
    },
    [availableCardsToPlay, cardIsLeftBower, getCardValues, getSuitCount, orderPlayerHand]
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
    sortCards,
    getPlayerRotation,
    discard,
    playerLocation,
    getTeamCssClass
  };
};

export default usePlayerData;

// class EuchrePlayer {
//     readonly name: string;
//     private hand: Card[] = [];
//     placeholder: Card[] = [];
//     playedCards: Card[] = [];
//     readonly playerNumber: 1 | 2 | 3 | 4;
//     readonly team: 1 | 2 = 1;
//     human: boolean = false;

//     constructor(name: string, team: 1 | 2, playerNumber: 1 | 2 | 3 | 4) {
//       this.name = name;
//       this.team = team;
//       this.playerNumber = playerNumber;
//       this.placeholder = createPlaceholderCards(5);
//     }

//     get innerPlayerBaseId(): string {
//       return `game-base-${this.playerNumber}-inner`;
//     }

//     get outerPlayerBaseId(): string {
//       return `game-base-${this.playerNumber}`;
//     }

//     get playerBase(): string {
//       return `player-base-${this.playerNumber}`;
//     }

//     get location(): 'center' | 'side' {
//       return this.playerNumber === 1 || this.playerNumber === 2 ? 'center' : 'side';
//     }

//     get availableCards(): Card[] {
//       return this.hand.filter((c) => c.value !== 'P');
//     }

//     /** Return 5 cards for the player's hand, however it inclues "placement" cards for cards that have already been played.
//      * These placement cards are intended to be hidden by the UI. */
//     get displayCards(): Card[] {
//       return [...this.hand];
//     }

//     set assignCards(cards: Card[]) {
//       this.hand = cards;
//     }

//     equal(other: EuchrePlayer): boolean {
//       return this.playerNumber === other.playerNumber;
//     }

//     getTeamColor(settings: EuchreSettings): TeamColor {
//       if (this.team === 1) {
//         return settings.teamOneColor;
//       } else {
//         return settings.teamTwoColor;
//       }
//     }

//     getTeamCssClass(settings: EuchreSettings): string {
//       const teamColor = this.getTeamColor(settings);
//       const teamCss = TEAM_COLOR_MAP.get(teamColor);

//       if (teamCss) return teamCss;

//       return 'bg-white';
//     }

//     addToHand(cards: Card[]) {
//       this.hand = [...this.hand, ...cards];
//     }

//     generateElementId(): string {
//       return `player-${this.playerNumber}-${Math.floor(Math.random() * 1000)}`;
//     }

//     /** Routine to determine if the computer should indicate if the flipped card should be picked up, or should name suit. */
//     determineBid(
//       game: EuchreGameInstance,
//       flipCard: Card,
//       firstRoundOfBidding: boolean,
//       gameSettings: EuchreSettings
//     ): BidResult {
//       return determineBidLogic(game, flipCard, firstRoundOfBidding, gameSettings);
//     }

//     determineCardToPlay(game: EuchreGameInstance, difficulty: GameDifficulty): Card {
//       return determineCardToPlayLogic(game, difficulty);
//     }

//     /** */
//     chooseDiscard(game: EuchreGameInstance, difficulty: GameDifficulty): Card {
//       const cardToDiscard = determineDiscard(game, this, difficulty);
//       if (game.trump) this.discard(cardToDiscard, game.trump);
//       return cardToDiscard;
//     }

//     discard(cardToDiscard: Card, trump: Card) {
//       if (this.hand.find((c) => c === cardToDiscard)) {
//         const tempHand = [...this.hand, trump].filter((c) => c !== cardToDiscard);
//         tempHand.forEach((c, index) => (c.index = index));
//         this.hand = tempHand;
//       } else {
//         throw new Error("Unable to discard. Card not found in player's hand.");
//       }
//     }

//     playGameCard(card: Card): EuchreCard {
//       const euchreCard = new EuchreCard(this, card);
//       const tempCards = this.availableCards.filter((c) => c !== card);
//       this.assignCards = tempCards;
//       this.playedCards.push(card);

//       return euchreCard;
//     }

//     sortCards(trump: Card | null): void {
//       let tempHand: Card[] = this.availableCards;

//       if (tempHand.length < 5) {
//         tempHand = orderPlayerHand(tempHand);
//         tempHand.forEach((c, index) => (c.index = index));
//         this.hand = tempHand;

//         return;
//       }

//       tempHand = [];
//       const suitCount = getSuitCount(this.hand, trump).sort((a, b) => b.count - a.count);
//       const cardValues = getCardValues(this.hand, trump);

//       if (trump) {
//         const trumpCards = cardValues
//           .filter((c) => c.card.suit === trump.suit || cardIsLeftBower(c.card, trump))
//           .sort((a, b) => b.value - a.value)
//           .map((c) => c.card);
//         tempHand.push(...trumpCards);

//         const offSuitCards = cardValues.filter((c) => !trumpCards.includes(c.card));
//         for (const suitVal of suitCount.filter((s) => s.suit !== trump.suit)) {
//           tempHand.push(
//             ...offSuitCards
//               .filter((c) => c.card.suit === suitVal.suit)
//               .sort((a, b) => b.value - a.value)
//               .map((c) => c.card)
//           );
//         }
//       } else {
//         for (const suitVal of suitCount) {
//           tempHand.push(
//             ...cardValues
//               .filter((c) => c.card.suit === suitVal.suit)
//               .sort((a, b) => b.value - a.value)
//               .map((c) => c.card)
//           );
//         }
//       }

//       tempHand = orderPlayerHand(tempHand);
//       tempHand.forEach((c, index) => (c.index = index));
//       this.hand = tempHand;
//     }
//   }
