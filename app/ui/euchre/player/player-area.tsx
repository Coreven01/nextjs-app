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
  const players = state.euchreGame.gamePlayers;
  const playerLayoutForGrid = getPlayerGridLayoutInfo(players);

  const creatDummyCards = (player: EuchrePlayer, width: number, height: number, location: TableLocation) => {
    const retval: React.ReactNode[] = [];
    for (let i = 0; i < 5; i++) {
      retval.push(
        <DummyCard
          id={`dummy-${player.playerNumber}-${i}`}
          key={`dummy-${player.playerNumber}-${i}`}
          className={getCardClassForPlayerLocation(location, false)}
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
    cardAreas.push(
      <div
        id={`player-${playerInfo.player.playerNumber}-area`}
        key={`player-${playerInfo.player.playerNumber}-area`}
        className={clsx('relative', playerInfo.locationClass)}
      >
        <div className={clsx('relative', playerInfo.innerClassName)}>
          {creatDummyCards(
            playerInfo.player,
            playerInfo.width,
            playerInfo.height,
            playerInfo.player.location
          )}
          <div
            className={clsx('absolute lg:text-sm text-xs whitespace-nowrap z-30', playerInfo.playerInfoClass)}
          >
            {state.euchreGameFlow.hasGameStarted && (
              <PlayerInfo
                id={`player-info-${playerInfo.player.playerNumber}`}
                game={state.euchreGame}
                player={playerInfo.player}
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
