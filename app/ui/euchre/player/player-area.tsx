import React from 'react';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';
import { EuchreGameValues, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import DummyCard from '../common/dummy-card';
import GameGrid from '../game/game-grid';
import useCardData from '../../../hooks/euchre/data/useCardData';
import PlayerInfo from './player-info';
import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  state: EuchreGameValues;
  className: string;
}

/** Area for statically-placed player information. Card animation is rendered by the PlayerCardArea component. */
const PlayerArea = ({ state, className, ...rest }: DivProps) => {
  const { getPlayerGridLayoutInfo } = usePlayerData();
  const { getCardClassForPlayerLocation } = useCardData();
  const cardAreas: React.ReactNode[] = [];
  const players = state.euchreGame.gamePlayers;
  const playerLayoutForGrid = getPlayerGridLayoutInfo(players);

  const getPlayerAreaCss = (player: EuchrePlayer) => {
    switch (player.playerNumber) {
      case 1:
        return {
          playerInfoClass: 'lg:relative lg:right-12 lg:bottom-8 lg:min-w-32 right-48'
        };
      case 2:
        return {
          playerInfoClass: 'lg:relative lg:right-8 lg:bottom-0 lg:top-auto lg:min-w-32 right-64 top-4'
        };
      case 3:
        return {
          playerInfoClass: 'lg:bottom-64 lg:left-0 lg:min-w-32 bottom-4'
        };
      case 4:
        return {
          playerInfoClass: 'lg:bottom-64 lg:right-0 lg:min-w-32 bottom-4'
        };
    }
  };

  const creatDummyCards = (
    player: EuchrePlayer,
    width: number,
    height: number,
    location: 'center' | 'side'
  ) => {
    const retval: React.ReactNode[] = [];
    for (let i = 0; i < 5; i++) {
      retval.push(
        <DummyCard
          id={`dummy-${player.playerNumber}-${i}`}
          key={`dummy-${player.playerNumber}-${i}`}
          className={getCardClassForPlayerLocation(player.playerNumber, false)}
          width={width}
          height={height}
          responsive={true}
          location={location}
        ></DummyCard>
      );
    }

    return retval;
  };

  for (let i = 0; i < playerLayoutForGrid.length; i++) {
    const playerInfo = playerLayoutForGrid[i];
    const cssVals = getPlayerAreaCss(playerInfo.player);
    cardAreas.push(
      <div
        id={`player-${playerInfo.player.playerNumber}-area`}
        key={`player-${playerInfo.player.playerNumber}-area`}
        className={playerInfo.className}
      >
        {creatDummyCards(playerInfo.player, playerInfo.width, playerInfo.height, playerInfo.location)}
        <div className={clsx('absolute lg:text-sm text-xs whitespace-nowrap z-30', cssVals.playerInfoClass)}>
          <PlayerInfo
            id={`player-info-${playerInfo.player.playerNumber}`}
            game={state.euchreGame}
            player={playerInfo.player}
            settings={state.euchreSettings}
          />
        </div>
      </div>
    );
  }

  return (
    <GameGrid className={className} {...rest}>
      {cardAreas}
    </GameGrid>
  );

  // // array of values for each player's deck area.
  // const playerRenderInfo = [
  //   {
  //     id: 'player1-game-deck',
  //     className: 'relative row-start-3 col-start-1 col-span-3 row-span-1 flex items-end',
  //     deckClass: '',
  //     tableRef: playerCenterTableRefs.get(1),
  //     player: state.euchreGame.player1,
  //     deckRef: playerDeckRefs.get(1)
  //   },
  //   {
  //     id: 'player2-game-deck',
  //     className: 'row-start-1 col-start-1 col-span-3 row-span-1 flex items-start',
  //     deckClass: '',
  //     tableRef: playerCenterTableRefs.get(2),
  //     player: state.euchreGame.player2,
  //     deckRef: playerDeckRefs.get(2)
  //   },
  //   {
  //     id: 'player3-game-deck',
  //     className: 'row-start-1 col-start-1 row-span-3 col-span-1 flex items-center',
  //     deckClass: '',
  //     tableRef: playerCenterTableRefs.get(3),
  //     player: state.euchreGame.player3,
  //     deckRef: playerDeckRefs.get(3)
  //   },
  //   {
  //     id: 'player4-game-deck',
  //     className: 'row-start-1 col-start-3 row-span-3 flex items-center',
  //     deckClass: '',
  //     tableRef: playerCenterTableRefs.get(4),
  //     player: state.euchreGame.player4,
  //     deckRef: playerDeckRefs.get(4)
  //   }
  // ];
  // return (
  //   <div
  //     className={clsx(
  //       'relative w-full h-full overflow-hidden grid lg:grid-rows-[1fr,150px,1fr] lg:grid-cols-[1fr,150px,1fr] grid-rows-[50px_minmax(50px,100%)_50px]',
  //       className
  //     )}
  //     {...rest}
  //   >
  //     {playerRenderInfo.map((info) => {
  //       return (
  //         <div className={info.className} key={info.id}>
  //           <PlayerGameDeck
  //             id={info.id}
  //             playerTableRef={info.tableRef}
  //             playerDeckRefs={playerDeckRefs}
  //             cardRefs={cardRefs}
  //             player={info.player}
  //             state={state}
  //             cardStates={cardStates}
  //             onDealComplete={getDealCompleteEvent()}
  //             onCardPlayed={onCardPlayed}
  //             onTrickComplete={handleTrickFinished}
  //             onPassDeal={onPassDeal}
  //             playedCard={
  //               playedCard && playerEqual(state.euchreGame.currentPlayer, info.player) ? playedCard : null
  //             }
  //           />
  //           <div ref={info.deckRef} id={`player-deck-${info.player.playerNumber}`} className="absolute">
  //             TEST
  //           </div>
  //         </div>
  //       );
  //     })}
  //     {getShouldShowDeck(state.euchreGame.dealer) && (
  //       <GameDeck
  //         deck={state.euchreGame.deck}
  //         cardRefs={cardRefs}
  //         location={location}
  //         playerNumber={1}
  //         cardStates={cardStates}
  //         onDealComplete={getDealCompleteEvent()}
  //         dealType={EuchreGameFlow.BEGIN_DEAL_FOR_DEALER}
  //         initDeckState={initSpringValue}
  //         initAnimationState={initAnimateValue}
  //       ></GameDeck>
  //     )}
  //   </div>
  // );
};

export default PlayerArea;
