'use client';

import { EuchreGameInstance, EuchreHandResult, EuchreSettings } from '@/app/lib/euchre/definitions';
import HandResult from '../prompt/hand-result';
import { useEffect, useRef, useState } from 'react';
import GamePrompt from './game-prompt';
import clsx from 'clsx';
import GameOverview from './game-overview';
import { scrollElementIntoViewIfNeeded } from '@/app/lib/euchre/util';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  settings: EuchreSettings;
  gameResults: EuchreHandResult[] | null;
  onClose: () => void;
  onReplayHand: () => void;
}

export default function GameResults({
  game,
  settings,
  gameResults,
  onReplayHand,
  onClose,
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

    const btn: HTMLElement | null = document.getElementById(
      newSelection === -1 ? 'btn-overview' : `btn-hand-${newSelection}`
    );
    handleButtonClick(newSelection);

    if (btn) scrollElementIntoViewIfNeeded(btn, menu.current);
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
        <div className="grid grid-cols-[630px] grid-rows-[1fr,1fr,300px,1fr]">
          <div className="flex">
            <button ref={buttonLeft}>&lt;</button>
            <h2 className="text-yellow-200 font-bold p-1 text-center flex-grow">Game Results</h2>
            <button ref={buttonRight}>&gt;</button>
          </div>
          <ul
            ref={menu}
            className="flex gap-2 overflow-x-scroll w-full text-sm mb-2"
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
                onClick={() => handleButtonClick(-1)}
              >
                Overview
              </button>
            </li>
            {gameResults.map((r, i) => {
              return (
                <li
                  className={clsx('whitespace-nowrap hover:text-yellow-500', {
                    'text-yellow-500': selection === i
                  })}
                  key={i}
                >
                  <button
                    className={clsx('', {
                      'underline decoration-solid decoration-red-600': selection === i
                    })}
                    id={`btn-hand-${i}`}
                    onClick={() => handleButtonClick(i)}
                  >
                    Hand ({i + 1})
                  </button>
                </li>
              );
            })}
          </ul>

          {showOverview ? (
            <GameOverview game={game} gameResults={gameResults} />
          ) : (
            <HandResult game={game} settings={settings} handResult={gameResults[selection ?? 0]}></HandResult>
          )}

          <button onClick={onClose} className="border border-white w-full mt-2">
            Close
          </button>
        </div>
      </div>
    </GamePrompt>
  );
}
