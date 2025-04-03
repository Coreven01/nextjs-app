'use client';

import GameMap from './game-map';

/**
 * Create a bomb seeker game.
 * @returns
 */
export default function BombSeeker() {

  return (
    <div onContextMenu={(event) => event.preventDefault()}>
      <div className={`relative mx-auto flex w-full flex-col`}>
        <GameMap/>
      </div>
    </div>
  );
}
