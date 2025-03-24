'use client';

import { PlayerNotificationState } from '@/app/hooks/euchre/playerNotificationReducer';
import GameBorder from './game-border';
import WoodenBoard from '../wooden-board';

type Props = {
  playerNotification: PlayerNotificationState;
};

export default function GameTable({ playerNotification }: Props) {
  const renderOrder = [
    playerNotification.player2GameInfo,
    playerNotification.player3GameInfo,
    playerNotification.centerGameInfo,
    playerNotification.player4GameInfo,
    playerNotification.player1GameInfo
  ];

  return (
    <GameBorder innerClass="bg-yellow-800 relative" className="shadow-md shadow-black">
      <WoodenBoard className="absolute h-full w-full top-0 left-0 overflow-hidden" rows={25} />
      <div className="grid grid-flow-col grid-rows-[minmax(75px,1fr)_minmax(50px,auto)_minmax(50px,auto)] md:grid-rows-[150px,150px,150px] grid-cols-[33%,33%,33%] md:grid-cols-[1fr,175px,1fr] gap-1 text-black ">
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
