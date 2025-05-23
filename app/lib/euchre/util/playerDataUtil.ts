// import { Card, TEAM_COLOR_MAP, TeamColor } from '@/app/lib/euchre/definitions/definitions';
// import {
//   cardEqual,
//   getDisplayHeight,
//   getDisplayWidth
// } from '../../../../features/euchre/util/game/cardDataUtil';
// import { EuchrePlayer, EuchreSettings } from '../definitions/game-state-definitions';

// const playerEqual = (first: EuchrePlayer, second: EuchrePlayer): boolean => {
//   return first.playerNumber === second.playerNumber;
// };

// const getTeamColor = (player: EuchrePlayer, settings: EuchreSettings): TeamColor => {
//   if (player.team === 1) {
//     return settings.teamOneColor;
//   } else {
//     return settings.teamTwoColor;
//   }
// };

// const getTeamCssClassFromTeamColor = (teamColor: TeamColor): string => {
//   const teamCss = TEAM_COLOR_MAP.get(teamColor);

//   if (teamCss) return teamCss;

//   return 'bg-white';
// };

// const getTeamCssClass = (player: EuchrePlayer, settings: EuchreSettings): string => {
//   const teamColor = getTeamColor(player, settings);
//   return getTeamCssClassFromTeamColor(teamColor);
// };

// /** Remove the card from the player's hand. Maintains card order and indices. */
// const discard = (player: EuchrePlayer, cardToDiscard: Card, trump: Card): Card[] => {
//   if (cardEqual(trump, cardToDiscard)) return [...player.hand];

//   const playerCard = player.hand.find((c) => cardEqual(c, cardToDiscard));

//   if (!playerCard) throw new Error("Unable to discard. Card not found in player's hand.");

//   const tempHand: Card[] = [
//     ...player.hand.filter((c) => !cardEqual(c, playerCard)),
//     { suit: trump.suit, value: trump.value, index: playerCard.index }
//   ].sort((a, b) => a.index - b.index);

//   return tempHand;
// };

// /** Get the cards available to play for the current user. Returns the player's hand except the cards have have been played. */
// const availableCardsToPlay = (player: EuchrePlayer): Card[] => {
//   return player.hand.filter((c) => player.playedCards.find((p) => cardEqual(p, c)) === undefined);
// };

// /** Get the rotation of players relative to the given player.
//  *
//  */
// const getPlayerRotation = (
//   players: EuchrePlayer[],
//   relativePlayer: EuchrePlayer,
//   playerSittingOut: EuchrePlayer | null = null
// ): EuchrePlayer[] => {
//   const playerCount = players.length;
//   const playerRotation = [1, 3, 2, 4];
//   const returnRotation: EuchrePlayer[] = [];
//   const indexOffset = (playerRotation.indexOf(relativePlayer.playerNumber) + 1) % playerCount;

//   for (let i = 0; i < playerCount; i++) {
//     const playerNumber = playerRotation[(i + indexOffset) % playerCount];

//     if (playerSittingOut?.playerNumber === playerNumber) continue;

//     const player = players.filter((p) => p.playerNumber === playerNumber);
//     if (player?.length) returnRotation.push(player[0]);
//   }

//   return returnRotation;
// };

// /** Returns information regarding the position for each player's cards/hand and player information panel
//  *
//  */
// const getPlayerGridLayoutInfo = () => {
//   const playerLayoutForGrid = [
//     {
//       location: 'bottom',
//       locationClass: 'row-start-3 col-start-1 col-span-3 row-span-1 lg:top-0 md:top-4 sm:top-4 top-4',
//       innerClassName: 'flex items-end h-full justify-center',
//       playerInfoClass: 'lg:relative lg:right-4 lg:bottom-8 lg:min-w-32 right-28 bottom-8',
//       playerInnerDeckOffsetClass: 'left-1/2 top-0',
//       width: getDisplayWidth('bottom'),
//       height: getDisplayHeight('bottom')
//     },
//     {
//       location: 'top',
//       locationClass:
//         'row-start-1 col-start-1 col-span-3 row-span-1 lg:top-0 lg:left-0 md:-top-6 sm:-top-12 -top-10 left-16',
//       innerClassName: 'flex h-full items-start justify-center',
//       playerInfoClass: 'lg:relative lg:right-4 lg:top-2 lg:min-w-32 right-36 sm:top-12 top-10',
//       playerInnerDeckOffsetClass: 'left-1/2 bottom-0',
//       width: getDisplayWidth('top'),
//       height: getDisplayHeight('top')
//     },
//     {
//       location: 'left',
//       locationClass: 'row-start-1 col-start-1 row-span-3 col-span-1 lg:left-0 md:-left-6 sm:-left-8 -left-10',
//       innerClassName: ' flex flex-col items-start w-full lg:top-[20%] md:top-[5%] top-0',
//       playerInfoClass: 'lg:-bottom-16 lg:left-2 lg:min-w-32 -bottom-4 sm:left-8 left-10',
//       playerInnerDeckOffsetClass: 'top-1/2 right-0',
//       width: getDisplayWidth('left'),
//       height: getDisplayHeight('left')
//     },
//     {
//       location: 'right',
//       locationClass:
//         'row-start-1 col-start-3 row-span-3 row-span-1 lg:right-0 md:-right-6 sm:-right-8 -right-10',
//       innerClassName: 'flex flex-col items-end w-full lg:top-[20%] md:top-[5%] top-0',
//       playerInfoClass: 'lg:-bottom-16 lg:right-2 lg:min-w-32 -bottom-4 sm:right-8 right-10',
//       playerInnerDeckOffsetClass: 'top-1/2 left-0',
//       width: getDisplayWidth('right'),
//       height: getDisplayHeight('right')
//     }
//   ];

//   return playerLayoutForGrid;
// };

// export {
//   availableCardsToPlay,
//   playerEqual,
//   getPlayerRotation,
//   discard,
//   getTeamCssClass,
//   getTeamCssClassFromTeamColor,
//   getTeamColor,
//   getPlayerGridLayoutInfo
// };
