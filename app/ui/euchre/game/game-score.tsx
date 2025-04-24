import Draggable, { DraggableEvent } from 'react-draggable';
import { RefObject, useRef } from 'react';
import { EuchreGameInstance, EuchreSettings } from '@/app/lib/euchre/definitions';
import PlayerColor from '../player/player-team-color';
import GameBorderBare from './game-border-bare';
import useGameData from '@/app/hooks/euchre/data/useGameData';
import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  game: EuchreGameInstance;
  settings: EuchreSettings;
  showScore: boolean;
}

const GameScore = ({ children, className, game, settings, showScore, ...rest }: DivProps) => {
  const { teamPoints } = useGameData();
  const { getSuitName } = useCardSvgData();
  const { getTeamColor } = usePlayerData();

  const teamOnePoints = teamPoints(game, 1);
  const teamTwoPoints = teamPoints(game, 2);
  const draggableRef: RefObject<HTMLDivElement> = useRef(null) as unknown as React.RefObject<HTMLDivElement>;
  const tricksOneCount = game.currentTricks.filter((t) => t.taker?.team === 1).length;
  const tricksTwoCount = game.currentTricks.filter((t) => t.taker?.team === 2).length;

  const handleDrag = (e: DraggableEvent, data: object) => {
    console.log('dragging:', data);
  };

  return (
    <Draggable
      grid={[15, 15]}
      defaultClassName={`absolute z-40 ${className}`}
      nodeRef={draggableRef}
      onDrag={handleDrag}
    >
      <div ref={draggableRef} className="cursor-move flex max-h-64" {...rest}>
        <GameBorderBare className="bg-white dark:bg-stone-800 shadow-md shadow-black lg:min-w-32">
          {showScore && (
            <>
              <h3 className="text-red-800 dark:text-yellow-200 font-bold text-center lg:text-base text-sm">
                Score
              </h3>
              <table className="w-auto m-1 lg:text-sm text-xs">
                <thead>
                  <tr>
                    <th className="w-6"></th>
                    <th>Pts</th>
                    <th>Tricks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <PlayerColor
                        className="border border-white text-transparent h-4 w-4"
                        teamColor={getTeamColor(game.player1, settings)}
                      >
                        X
                      </PlayerColor>
                    </td>
                    <td>
                      <div className="w-full text-center">{Math.min(teamOnePoints, 10)} / 10</div>
                    </td>
                    <td>
                      <div className="w-full text-center">{tricksOneCount} / 5</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <PlayerColor
                        className="border border-white text-transparent h-4 w-4"
                        teamColor={getTeamColor(game.player3, settings)}
                      >
                        X
                      </PlayerColor>
                    </td>
                    <td>
                      <div className="w-full text-center">{Math.min(teamTwoPoints, 10)} / 10</div>
                    </td>
                    <td>
                      <div className="w-full text-center">{tricksTwoCount} / 5</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
          <div className="mx-1 lg:text-sm text-xs text-center">
            Trump: {game.trump && game.maker ? getSuitName(game.trump.suit) + 's' : '...'}
          </div>
        </GameBorderBare>
      </div>
    </Draggable>
  );
};

export default GameScore;
