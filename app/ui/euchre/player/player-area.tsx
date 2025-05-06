import React from 'react';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';
import { EuchreGameValues, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import DummyCard from '../common/dummy-card';
import GameGrid from '../game/game-grid';
import useCardData from '../../../hooks/euchre/data/useCardData';
import PlayerInfo from './player-info';
import clsx from 'clsx';
import { TableLocation } from '../../../lib/euchre/definitions/definitions';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  state: EuchreGameValues;
  className: string;
}

/** Area for statically-placed player information. Card animation is rendered by the PlayerCardArea component. */
const PlayerArea = ({ state, className, ...rest }: DivProps) => {
  const { getPlayerGridLayoutInfo } = usePlayerData();
  const { getCardClassForPlayerLocation } = useCardData();
  const cardAreas: React.ReactNode[] = [];
  const playerLayoutForGrid = getPlayerGridLayoutInfo();

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

    if (!player) throw new Error('Player not found for location: ' + info.location);

    cardAreas.push(
      <div
        id={`player-${player.playerNumber}-area`}
        key={`player-${player.playerNumber}-area`}
        className={clsx('relative', info.locationClass)}
      >
        <div className={clsx('relative', info.innerClassName)}>
          {creatDummyCards(player, info.width, info.height, player.location)}
          <div className={clsx('absolute lg:text-sm text-xs whitespace-nowrap z-40', info.playerInfoClass)}>
            {state.euchreGameFlow.hasGameStarted && (
              <PlayerInfo
                id={`player-info-${player.playerNumber}`}
                game={state.euchreGame}
                player={player}
                settings={state.euchreSettings}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameGrid className={className} {...rest}>
      {cardAreas}
    </GameGrid>
  );
};

export default PlayerArea;
