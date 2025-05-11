import React from 'react';
import { EuchreGameState, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import DummyCard from '../common/dummy-card';
import GameGrid from '../game/game-grid';
import PlayerInfo from './player-info';
import clsx from 'clsx';
import { TableLocation } from '../../../lib/euchre/definitions/definitions';
import { getPlayerGridLayoutInfo } from '../../../lib/euchre/util/playerDataUtil';
import { getCardClassForPlayerLocation } from '../../../lib/euchre/util/cardDataUtil';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  state: EuchreGameState;
  className: string;
}

/** Area for statically-placed player information. Card animation is rendered by the PlayerCardArea component. */
const PlayerArea = ({ state, className, ...rest }: DivProps) => {
  const cardAreas: React.ReactNode[] = [];
  const playerLayoutForGrid = getPlayerGridLayoutInfo();

  // these cards are used to position elements.
  const creatDummyCards = (player: EuchrePlayer, width: number, height: number, location: TableLocation) => {
    const retval: React.ReactNode[] = [];
    for (let i = 0; i < 5; i++) {
      retval.push(
        <DummyCard
          id={`dummy-${player.playerNumber}-${i}`}
          key={`dummy-${player.playerNumber}-${i}`}
          className={getCardClassForPlayerLocation(location)}
          width={width}
          height={height}
          responsive={true}
          location={location}
          visible={state.euchreSettings.debugShowPositionElements}
        ></DummyCard>
      );
    }

    return retval;
  };

  for (let i = 0; i < playerLayoutForGrid.length; i++) {
    const info = playerLayoutForGrid[i];
    const player = state.euchreGame.gamePlayers.find((p) => p.location === info.location);

    cardAreas.push(
      player ? (
        <div
          id={`player-${player.playerNumber}-area`}
          key={`player-${player.playerNumber}-area`}
          className={clsx('relative', info.locationClass)}
        >
          <div className={clsx('relative', info.innerClassName)}>
            {creatDummyCards(player, info.width, info.height, player.location)}
            <div className={clsx('absolute lg:text-sm text-xs whitespace-nowrap z-40', info.playerInfoClass)}>
              {state.euchreGameFlow.hasGameStarted && (
                <PlayerInfo id={`player-info-${player.playerNumber}`} state={state} player={player} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={clsx('relative', info.locationClass)}>
          Player not found for location: {info.location}
        </div>
      )
    );
  }

  return (
    <GameGrid className={className} {...rest}>
      {cardAreas}
    </GameGrid>
  );
};

export default PlayerArea;
