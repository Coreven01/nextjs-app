import React from 'react';
import GameGrid from '../game/game-grid';
import PlayerInfo from './player-info';
import clsx from 'clsx';
import { getPlayerGridLayoutInfo } from '../../util/game/playerDataUtil';
import { EuchreGameState } from '../../definitions/game-state-definitions';
import PlayerPositionalArea from './player-positional-area';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  state: EuchreGameState;
  className: string;
}

/** Area for statically-placed player information. Card animation is rendered by the PlayerCardArea component. */
const PlayerArea = ({ state, className, ...rest }: DivProps) => {
  const playerLayoutForGrid = getPlayerGridLayoutInfo();

  return (
    <GameGrid className={className} {...rest}>
      {playerLayoutForGrid.map((info) => {
        const player = state.euchreGame.gamePlayers.find((p) => p.location === info.location);

        return player ? (
          <div
            id={`player-${player.playerNumber}-area`}
            key={`player-${player.playerNumber}-area`}
            className={clsx('relative', info.locationClass)}
          >
            <div className={clsx('relative', info.innerClassName)}>
              <PlayerPositionalArea
                playerNumber={player.playerNumber}
                width={info.width}
                height={info.height}
                location={player.location}
                responsive
                showElements={state.euchreSettings.debugShowPositionElements}
              />
              <div
                className={clsx('absolute lg:text-sm text-xs whitespace-nowrap z-40', info.playerInfoClass)}
              >
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
        );
      })}
    </GameGrid>
  );
};

export default PlayerArea;
