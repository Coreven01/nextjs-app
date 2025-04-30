import { Card, TEAM_COLOR_MAP, TeamColor } from '@/app/lib/euchre/definitions/definitions';
import useCardData from './useCardData';
import { useCallback } from 'react';
import {
  EuchreCard,
  EuchrePlayer,
  EuchreSettings
} from '../../../lib/euchre/definitions/game-state-definitions';

const usePlayerData = () => {
  const { cardEqual, getDisplayWidth, getDisplayHeight } = useCardData();

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

  const getTeamColor = useCallback((player: EuchrePlayer, settings: EuchreSettings): TeamColor => {
    if (player.team === 1) {
      return settings.teamOneColor;
    } else {
      return settings.teamTwoColor;
    }
  }, []);

  const getTeamCssClassFromTeamColor = (teamColor: TeamColor): string => {
    const teamCss = TEAM_COLOR_MAP.get(teamColor);

    if (teamCss) return teamCss;

    return 'bg-white';
  };

  const getTeamCssClass = (player: EuchrePlayer, settings: EuchreSettings): string => {
    const teamColor = getTeamColor(player, settings);
    return getTeamCssClassFromTeamColor(teamColor);
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

  /** Returns information regarding the position for each player's cards/hand and player information panel
   *
   */
  const getPlayerGridLayoutInfo = (players: EuchrePlayer[]) => {
    const widthCenter = getDisplayWidth('center');
    const widthSide = getDisplayWidth('side');
    const heightCenter = getDisplayHeight('center');
    const heightSide = getDisplayHeight('side');

    //lg:left-[25%] md:left-[15%] left-[10%]
    const playerLayoutForGrid = [
      {
        player: players[0],
        locationClass: 'row-start-3 col-start-1 col-span-3 row-span-1',
        innerClassName: 'flex items-end h-full justify-center',
        playerInfoClass: 'lg:relative lg:right-12 lg:bottom-8 lg:min-w-32 right-32 bottom-4',
        location: playerLocation(players[0]),
        width: 0,
        height: 0
      },
      {
        player: players[1],
        locationClass: 'row-start-1 col-start-1 col-span-3 row-span-1',
        innerClassName: 'flex h-full items-start justify-center',
        playerInfoClass: 'lg:relative lg:right-8 lg:bottom-0 lg:top-auto lg:min-w-32 right-32 top-0',
        location: playerLocation(players[1]),
        width: 0,
        height: 0
      },
      {
        player: players[2],
        locationClass: 'row-start-1 col-start-1 row-span-3 col-span-1',
        innerClassName: ' flex flex-col items-start w-full lg:top-[20%] md:top-[5%] top-0',
        playerInfoClass: 'lg:bottom-0 lg:left-0 lg:min-w-32 bottom-0',
        location: playerLocation(players[2]),
        width: 0,
        height: 0
      },
      {
        player: players[3],
        locationClass: 'row-start-1 col-start-3 row-span-3 row-span-1',
        innerClassName: 'flex flex-col items-end w-full lg:top-[20%] md:top-[5%] top-0',
        playerInfoClass: 'lg:bottom-0 lg:right-0 lg:min-w-32 bottom-0',
        location: playerLocation(players[3]),
        width: 0,
        height: 0
      }
    ];

    for (const value of playerLayoutForGrid) {
      value.width = value.location === 'center' ? widthCenter : widthSide;
      value.height = value.location === 'center' ? heightCenter : heightSide;
    }

    return playerLayoutForGrid;
  };

  return {
    availableCardsToPlay,
    playerEqual,
    getPlayerRotation,
    discard,
    playerLocation,
    getTeamCssClass,
    getTeamCssClassFromTeamColor,
    getTeamColor,
    getPlayerGridLayoutInfo
  };
};

export default usePlayerData;
