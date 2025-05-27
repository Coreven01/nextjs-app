import HandResult from './hand-result';
import { RefObject, useEffect, useRef, useState } from 'react';
import GamePrompt from './game-prompt';
import clsx from 'clsx';
import GameOverview from '../game/game-overview';
import PromptHeader from './prompt-header';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';

import GameButton from '../game/game-button';
import { scrollElementIntoViewIfNeeded } from '../../util/util';
import { EuchreHandResult } from '../../definitions/definitions';
import { EuchreGameInstance, EuchreSettings } from '../../definitions/game-state-definitions';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  settings: EuchreSettings;
  handResults: EuchreHandResult[] | null;
  onClose: () => void;
  onNewGame: () => void;
  onReplayGame: () => void;
}

export default function GameResult({
  game,
  settings,
  handResults,
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

    if (handResults && newSelection >= handResults.length) return;

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

  if (!handResults) throw new Error('No game results were found');

  return (
    <GamePrompt zIndex={50} {...rest} className={clsx('bg-stone-800 h-full w-full lg:mt-0 mt-4', className)}>
      <div className="p-1">
        <div className="grid grid-cols-[85vw] grid-rows-[1fr,25px,220px,auto] lg:grid-rows-[1fr,1fr,350px,auto] lg:grid-cols-[650px] lg:max-h-full max-h-[310px] justify-center">
          <div className="flex">
            <button className="w-8 h-8 hover:text-amber-400" ref={buttonLeft}>
              <ChevronLeftIcon />
            </button>
            <PromptHeader className="grow lg:text-base text-sm">Game Result</PromptHeader>
            <button className="w-8 h-8 hover:text-amber-400" ref={buttonRight}>
              <ChevronRightIcon />
            </button>
          </div>
          <HandResultNavigation
            menuRef={menu}
            onButtonClick={handleButtonClick}
            gameResults={handResults}
            selection={selection}
          />

          {showOverview ? (
            <GameOverview game={game} gameSettings={settings} />
          ) : (
            <HandResult
              className="mx-auto"
              game={game}
              settings={settings}
              handResult={handResults[selection]}
            ></HandResult>
          )}

          <div className="flex gap-1 h-8">
            <GameButton className="w-full" type="danger" onClick={onClose}>
              Main Menu
            </GameButton>
            {settings.debugEnableDebugMenu && (
              <GameButton className="w-full" type="warn" onClick={onReplayGame}>
                Replay Game
              </GameButton>
            )}
            <GameButton className="w-full" type="success" onClick={onNewGame}>
              New Game
            </GameButton>
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
      className="flex gap-2 overflow-x-scroll w-full lg:text-sm text-xs mb-2 mx-auto"
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
