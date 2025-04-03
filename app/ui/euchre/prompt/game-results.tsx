'use client';

import { EuchreGameInstance, EuchreHandResult, EuchreSettings } from '@/app/lib/euchre/definitions';
import HandResult from './hand-result';
import { RefObject, useEffect, useRef, useState } from 'react';
import GamePrompt from './game-prompt';
import clsx from 'clsx';
import GameOverview from '../game/game-overview';
import { scrollElementIntoViewIfNeeded } from '@/app/lib/euchre/util';
import PromptHeader from './prompt-header';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  settings: EuchreSettings;
  gameResults: EuchreHandResult[] | null;
  onClose: () => void;
  onNewGame: () => void;
  onReplayGame: () => void;
}

export default function GameResults({
  game,
  settings,
  gameResults,
  onNewGame,
  onClose,
  onReplayGame,
  className,
  ...rest
}: DivProps) {
  const [selection, setSelection] = useState<number>(-1);
  const [showOverview, setShowOverview] = useState(true);
  const buttonLeft = useRef<HTMLButtonElement>(null as unknown as HTMLButtonElement);
  const buttonRight = useRef<HTMLButtonElement>(null as unknown as HTMLButtonElement);
  const menu = useRef<HTMLUListElement>(null as unknown as HTMLUListElement);

  const handleScrollLeft = (event: MouseEvent) => {
    handleSelectionChange(event, selection - 1);
  };
  const handleScrollRight = (event: MouseEvent) => {
    handleSelectionChange(event, selection + 1);
  };

  const handleSelectionChange = (event: MouseEvent, newSelection: number) => {
    if (newSelection < -1) return;

    if (gameResults && newSelection >= gameResults.length) return;

    handleButtonClick(newSelection);
  };

  useEffect(() => {
    const leftButton = buttonLeft.current;
    const rightButton = buttonRight.current;

    leftButton.addEventListener('click', handleScrollLeft);
    rightButton.addEventListener('click', handleScrollRight);

    return () => {
      leftButton.removeEventListener('click', handleScrollLeft);
      rightButton.removeEventListener('click', handleScrollRight);
    };
  });

  if (!gameResults) throw new Error('No game results were found');

  const handleButtonClick = (index: number): void => {
    const btn: HTMLElement | null = document.getElementById(
      index === -1 ? 'btn-overview' : `btn-hand-${index}`
    );

    if (btn) scrollElementIntoViewIfNeeded(btn, menu.current);

    if (index === -1) {
      setShowOverview(true);
      setSelection(-1);
    } else {
      setShowOverview(false);
      setSelection(index);
    }
  };

  return (
    <GamePrompt zIndex={50} {...rest} className={clsx('bg-stone-800', className)}>
      <div className="p-1">
        <div className="grid grid-cols-[630px] grid-rows-[1fr,1fr,370px,auto]">
          <div className="flex">
            <button className="w-8 h-8 hover:text-amber-400" ref={buttonLeft}>
              <ChevronLeftIcon />
            </button>
            <PromptHeader className="flex-grow md:text-base text-sm">Game Results</PromptHeader>
            <button className="w-8 h-8 hover:text-amber-400" ref={buttonRight}>
              <ChevronRightIcon />
            </button>
          </div>
          <HandResultNavigation
            menuRef={menu}
            onButtonClick={handleButtonClick}
            gameResults={gameResults}
            selection={selection}
          />

          {showOverview ? (
            <GameOverview game={game} gameSettings={settings} gameResults={gameResults} />
          ) : (
            <HandResult
              className="mx-auto"
              game={game}
              settings={settings}
              handResult={gameResults[selection ?? 0]}
            ></HandResult>
          )}

          <div className="flex gap-1 md:text-base text-xs">
            <button
              onClick={onClose}
              className="w-full border border-white bg-red-950 hover:bg-amber-100 hover:text-black"
            >
              Close
            </button>
            <button
              onClick={onNewGame}
              className="w-full border border-white bg-green-950 hover:bg-amber-100 hover:text-black disabled:hover:bg-inherit disabled:cursor-not-allowed disabled:text-gray-500"
            >
              New Game
            </button>
            <button
              onClick={onReplayGame}
              className="w-full border border-white bg-green-950 hover:bg-amber-100 hover:text-black disabled:hover:bg-inherit disabled:cursor-not-allowed disabled:text-gray-500"
            >
              Replay Game
            </button>
          </div>
        </div>
      </div>
    </GamePrompt>
  );
}

interface NavProps {
  menuRef: RefObject<HTMLUListElement>;
  selection: number;
  gameResults: EuchreHandResult[];
  onButtonClick: (selection: number) => void;
}
function HandResultNavigation({ menuRef, selection, gameResults, onButtonClick }: NavProps) {
  return (
    <ul
      ref={menuRef}
      className="flex gap-2 overflow-x-scroll w-full md:text-sm text-xs mb-2"
      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
    >
      <li
        className={clsx('whitespace-nowrap hover:text-yellow-500', {
          'text-yellow-500': selection === -1
        })}
      >
        <button
          className={clsx('', {
            'underline decoration-solid decoration-red-600': selection === -1
          })}
          id="btn-overview"
          onClick={() => onButtonClick(-1)}
        >
          Overview
        </button>
      </li>
      {gameResults.map((r, i) => {
        return (
          <li className={clsx('whitespace-nowrap')} key={i}>
            |{' '}
            <button
              className={clsx('hover:text-yellow-500', {
                'underline decoration-solid decoration-red-600 text-yellow-500': selection === i
              })}
              id={`btn-hand-${i}`}
              onClick={() => onButtonClick(i)}
            >
              Hand ({i + 1})
            </button>
          </li>
        );
      })}
    </ul>
  );
}
