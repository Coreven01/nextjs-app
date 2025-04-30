import clsx from 'clsx';
import React, { RefObject, useCallback, useRef } from 'react';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';
import useGameData from '../../../hooks/euchre/data/useGameData';
import {
  EuchreAnimationHandlers,
  EuchreGameValues,
  EuchrePlayer
} from '../../../lib/euchre/definitions/game-state-definitions';
import { Card } from '../../../lib/euchre/definitions/definitions';
import useDeckState from '../../../hooks/euchre/useDeckState';
import GameGrid from '../game/game-grid';
import GameDeck from '../game/game-deck';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  state: EuchreGameValues;
  playedCard: Card | null;
  playerCenterTableRefs: Map<number, RefObject<HTMLDivElement | null>>;
  playerOuterTableRefs: Map<number, RefObject<HTMLDivElement | null>>;
  animationHandlers: EuchreAnimationHandlers;
  className: string;
}

/** Area for card animation for dealing and player's cards. */
const PlayerCardArea = ({
  state,
  playedCard,
  playerCenterTableRefs,
  playerOuterTableRefs,
  animationHandlers,
  className,
  ...rest
}: DivProps) => {
  const {
    gameDeckVisible,
    gameDeckRef,
    playerDeckRefs,
    playerInnerDeckRefs,
    deckCardRefs,
    gameDeckState,
    deckAnimationControls,
    cardStates
  } = useDeckState(state, playerOuterTableRefs, animationHandlers);

  const { getPlayerGridLayoutInfo } = usePlayerData();
  const { playerSittingOut } = useGameData();

  const players = state.euchreGame.gamePlayers;
  const playerLayoutForGrid = getPlayerGridLayoutInfo(players);
  const sittingOutPlayer: EuchrePlayer | null = playerSittingOut(state.euchreGame);
  const cardCountDuringPlay: number = sittingOutPlayer ? 3 : 4;

  const playersInitDealFinished = useRef<Set<number>>(new Set<number>());
  /** Map of trick id to the card values that were played for that trick. */
  const cardsPlayedForTrick = useRef<Map<string, Set<string>>>(new Map<string, Set<string>>());

  /** Set of trick id's where the event handler was executed to finish the trick. */
  const tricksFinished = useRef<Set<string>>(new Set<string>());

  // const handleInitComplete = (playerNumber: number) => {
  //   console.log('[handleInitComplete] - player-area.tsx');
  //   if (playersInitDealFinished.current.values().toArray().length === 4) return;

  //   playersInitDealFinished.current.add(playerNumber);

  //   if (playersInitDealFinished.current.values().toArray().length === 4) {
  //   }
  // };

  // const handleTrickFinished = useCallback(
  //   (card: Card) => {
  //     console.log('[handleTrickFinished] - player-area.tsx');

  //     const trick: EuchreTrick | undefined = state.euchreGame.currentTrick;
  //     const trickFinished = tricksFinished.current.has(trick.trickId);

  //     if (trickFinished) return;

  //     const cardVals = cardsPlayedForTrick.current.get(trick.trickId) ?? new Set<string>();

  //     cardVals.add(`${card.value}-${card.suit}`);
  //     cardsPlayedForTrick.current.set(trick.trickId, cardVals);

  //     if (trick.playerRenege || cardVals.values().toArray().length === cardCountDuringPlay) {
  //       tricksFinished.current.add(trick.trickId);
  //       animationHandlers.handleTrickFinished(); //  onTrickComplete();
  //     }
  //   },
  //   [animationHandlers, cardCountDuringPlay, state.euchreGame.currentTrick]
  // );

  console.log(
    '**** [PlayerCardArea] render. gameDeckState: ',
    gameDeckState,
    ' deck visible: ',
    gameDeckVisible,
    ' game state: ',
    state
  );

  return (
    <GameGrid className={className} {...rest}>
      {playerLayoutForGrid.map((info) => {
        const deckRef = playerDeckRefs.get(info.player.playerNumber);
        const innerDeckRef = playerInnerDeckRefs.get(info.player.playerNumber);
        const isPlayer1 = info.player.playerNumber === 1;
        const isPlayer2 = info.player.playerNumber === 2;
        const isPlayer3 = info.player.playerNumber === 3;
        const isPlayer4 = info.player.playerNumber === 4;

        return (
          <div
            className={clsx('relative', info.locationClass)}
            key={`player${info.player.playerNumber}-game-deck`}
          >
            {/* <PlayerGameDeck
              id={info.id}
              playerTableRef={info.tableRef}
              playerDeckRefs={playerDeckRefs}
              cardRefs={cardRefs}
              player={info.player}
              state={state}
              cardStates={cardStates}
              onDealComplete={getDealCompleteEvent()}
              onCardPlayed={animationHandlers.handleCardPlayed}
              onTrickComplete={handleTrickFinished}
              onPassDeal={() => null}
              playedCard={
                playedCard && playerEqual(state.euchreGame.currentPlayer, info.player) ? playedCard : null
              }
            /> */}
            <div
              ref={deckRef}
              id={`player-deck-${info.player.playerNumber}`}
              className={clsx(
                'absolute',
                { 'left-1/2 bottom-0': isPlayer1 },
                { 'left-1/2 top-0': isPlayer2 },
                { 'top-1/2 left-0': isPlayer3 },
                { 'top-1/2 right-0': isPlayer4 }
              )}
            >
              {`D-${info.player.playerNumber}`}
            </div>
            <div
              ref={innerDeckRef}
              id={`player-inner-deck-${info.player.playerNumber}`}
              className={clsx(
                'absolute',
                { 'left-1/2 top-0': isPlayer1 },
                { 'left-1/2 bottom-0': isPlayer2 },
                { 'top-1/2 right-0': isPlayer3 },
                { 'top-1/2 left-0': isPlayer4 }
              )}
            >
              {`I-${info.player.playerNumber}`}
            </div>
          </div>
        );
      })}
      {gameDeckState && gameDeckVisible && (
        <GameDeck
          ref={gameDeckRef}
          deck={gameDeckState.deck}
          deckCardRefs={deckCardRefs}
          location={gameDeckState.location}
          playerNumber={gameDeckState.playerNumber}
          cardStates={cardStates}
          onAnimationComplete={gameDeckState.handleAnimationComplete}
          dealType={gameDeckState.dealType}
          initDeckState={gameDeckState.initSpringValue}
          controls={deckAnimationControls}
          width={gameDeckState.width}
          height={gameDeckState.height}
          handId={gameDeckState.handId}
        />
      )}
    </GameGrid>
  );

  //   const playerNumber = 1; //player.playerNumber;
  //   const positionCenter = `absolute ${playerNumber === 1 ? 'top-0' : 'bottom-0'}`;
  //   const positionSide = `absolute ${playerNumber === 3 ? 'right-0' : 'left-0'}`;
  //   const positionCenterInner = `absolute ${playerNumber === 1 ? 'bottom-0' : 'top-0'}`;
  //   const positionSideInner = `absolute ${playerNumber === 3 ? 'left-0' : 'right-0'}`;
  //   const location = 'center'; //playerLocation(player);
  //   const position = location === 'center' ? positionCenter : positionSide;
  //   const positionInner = location === 'center' ? positionCenterInner : positionSideInner;
  //   const duration = state.euchreSettings.gameSpeed / 1000;
  //   const initSpringValue = { opacity: 0, y: 100 };
  //   const initAnimateValue = {
  //     opacity: 1,
  //     y: 20,
  //     transition: {
  //       opacity: { duration: duration },
  //       y: { duration: duration }
  //     }
  //   };

  //   const handleInitComplete = (playerNumber: number) => {
  //     console.log('[handleInitComplete] - player-area.tsx');
  //     if (playersInitDealFinished.current.values().toArray().length === 4) return;

  //     playersInitDealFinished.current.add(playerNumber);

  //     if (playersInitDealFinished.current.values().toArray().length === 4) {
  //     }
  //   };

  //   const handleTrickFinished = useCallback(
  //     (card: Card) => {
  //       console.log('[handleTrickFinished] - player-area.tsx');

  //       const trick: EuchreTrick | undefined = state.euchreGame.currentTrick;
  //       const trickFinished = tricksFinished.current.has(trick.trickId);

  //       if (trickFinished) return;

  //       const cardVals = cardsPlayedForTrick.current.get(trick.trickId) ?? new Set<string>();

  //       cardVals.add(`${card.value}-${card.suit}`);
  //       cardsPlayedForTrick.current.set(trick.trickId, cardVals);

  //       if (trick.playerRenege || cardVals.values().toArray().length === cardCountDuringPlay) {
  //         tricksFinished.current.add(trick.trickId);
  //         onTrickComplete();
  //       }
  //     },
  //     [cardCountDuringPlay, onTrickComplete, state.euchreGame.currentTrick]
  //   );

  //   // array of values for each player's deck area.
  //   const playerRenderInfo = [
  //     {
  //       id: 'player1-game-deck',
  //       className: 'relative row-start-3 col-start-1 col-span-3 row-span-1 flex items-end',
  //       deckClass: '',
  //       tableRef: playerCenterTableRefs.get(1),
  //       player: state.euchreGame.player1,
  //       deckRef: playerDeckRefs.get(1)
  //     },
  //     {
  //       id: 'player2-game-deck',
  //       className: 'row-start-1 col-start-1 col-span-3 row-span-1 flex items-start',
  //       deckClass: '',
  //       tableRef: playerCenterTableRefs.get(2),
  //       player: state.euchreGame.player2,
  //       deckRef: playerDeckRefs.get(2)
  //     },
  //     {
  //       id: 'player3-game-deck',
  //       className: 'row-start-1 col-start-1 row-span-3 col-span-1 flex items-center',
  //       deckClass: '',
  //       tableRef: playerCenterTableRefs.get(3),
  //       player: state.euchreGame.player3,
  //       deckRef: playerDeckRefs.get(3)
  //     },
  //     {
  //       id: 'player4-game-deck',
  //       className: 'row-start-1 col-start-3 row-span-3 flex items-center',
  //       deckClass: '',
  //       tableRef: playerCenterTableRefs.get(4),
  //       player: state.euchreGame.player4,
  //       deckRef: playerDeckRefs.get(4)
  //     }
  //   ];
  //   return (
  //     <div
  //       className={clsx(
  //         'relative w-full h-full overflow-hidden grid lg:grid-rows-[1fr,150px,1fr] lg:grid-cols-[1fr,150px,1fr] grid-rows-[50px_minmax(50px,100%)_50px]',
  //         className
  //       )}
  //       {...rest}
  //     >
  //       {playerRenderInfo.map((info) => {
  //         return (
  //           <div className={info.className} key={info.id}>
  //             <PlayerGameDeck
  //               id={info.id}
  //               playerTableRef={info.tableRef}
  //               playerDeckRefs={playerDeckRefs}
  //               cardRefs={cardRefs}
  //               player={info.player}
  //               state={state}
  //               cardStates={cardStates}
  //               onDealComplete={getDealCompleteEvent()}
  //               onCardPlayed={onCardPlayed}
  //               onTrickComplete={handleTrickFinished}
  //               onPassDeal={onPassDeal}
  //               playedCard={
  //                 playedCard && playerEqual(state.euchreGame.currentPlayer, info.player) ? playedCard : null
  //               }
  //             />
  //             <div ref={info.deckRef} id={`player-deck-${info.player.playerNumber}`} className="absolute">
  //               TEST
  //             </div>
  //           </div>
  //         );
  //       })}
  //       {getShouldShowDeck(state.euchreGame.dealer) && (
  //         <GameDeck
  //           deck={state.euchreGame.deck}
  //           cardRefs={cardRefs}
  //           location={location}
  //           playerNumber={1}
  //           cardStates={cardStates}
  //           onDealComplete={getDealCompleteEvent()}
  //           dealType={EuchreGameFlow.BEGIN_DEAL_FOR_DEALER}
  //           initDeckState={initSpringValue}
  //           initAnimationState={initAnimateValue}
  //         ></GameDeck>
  //       )}
  //     </div>
  //   );
};

export default PlayerCardArea;
