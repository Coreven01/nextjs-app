'use client';

import { PlayerNotificationState } from '@/app/hooks/euchre/playerNotificationReducer';
import GameBorder from './game-border';

type Props = {
  playerInfoState: PlayerNotificationState;
};

export function GameInfo({ playerInfoState }: Props) {
  const renderOrder = [
    playerInfoState.player2GameInfo,
    playerInfoState.player3GameInfo,
    playerInfoState.centerGameInfo,
    playerInfoState.player4GameInfo,
    playerInfoState.player1GameInfo
  ];

  return (
    <GameBorder>
      <div className="grid grid-flow-col grid-rows-[150px,150px,150px] gap-1 h-full w-full text-black grid-cols-[1fr,175px,1fr]">
        <div id="player2-region" className="col-span-1 col-start-2 relative flex justify-center items-center">
          <div id={`game-base-2`} className={`absolute top-0`}>
            X
          </div>
          <div id={`game-base-2-inner`} className={`absolute bottom-0`}>
            X
          </div>
          {renderOrder[0]}
        </div>
        <div
          id="player3-region"
          className="col-span-1 col-start-1 row-start-2 relative flex justify-center items-center"
        >
          <div id={`game-base-3`} className={`absolute left-0`}>
            X
          </div>
          <div id={`game-base-3-inner`} className={`absolute top-auto right-0`}>
            X
          </div>
          {renderOrder[1]}
        </div>
        <div
          id="game-info"
          className="col-span-1 col-start-2 row-start-2 relative flex justify-center items-center"
        >
          <div id={`game-center`} className={`absolute top-auto`}>
            X
          </div>
          {renderOrder[2]}
        </div>
        <div
          id="player4-region"
          className="col-span-1 col-start-3 row-start-2 relative flex justify-center items-center"
        >
          <div id={`game-base-4`} className={`absolute top-auto right-0`}>
            X
          </div>
          <div id={`game-base-4-inner`} className={`absolute top-auto left-0`}>
            X
          </div>
          {renderOrder[3]}
        </div>
        <div
          id="player1-region"
          className="col-span-1 col-start-2 row-start-3 relative flex justify-center items-center"
        >
          <div id={`game-base-1`} className={`absolute bottom-0`}>
            X
          </div>
          <div id={`game-base-1-inner`} className={`absolute top-0`}>
            X
          </div>
          {renderOrder[4]}
        </div>
      </div>
    </GameBorder>
  );
}
