import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { caveat } from '../../fonts';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  onBegin: () => void;
  onSettings: () => void;
}

const GameIntro = ({ className, onBegin, onSettings }: DivProps) => {
  const titleElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(
      () => titleElement.current && titleElement.current.classList.add('!opacity-100', 'translate-y-[-20px]'),
      250
    );
  }, []);

  return (
    <div className="flex md:h-[85vh] md:w-[85vh] md:min-h-[25vh] min-h-[50vh] w-full bg-stone-900 bg-opacity-50 md:max-h-64">
      <div className="grow flex flex-col items-center justify-center">
        <div className="flex items-center grow w-full">
          <div className="relative grow flex justify-center relative bg-neutral-700 border-t border-b border-white p-2 text-center text-5xl">
            <div
              ref={titleElement}
              id="game-title"
              style={{ backgroundSize: '400%' }}
              className={clsx(
                'relative top-[20px] opacity-0 transition-all duration-[1.25s] ease-in transform text-transparent font-bold bg-clip-text bg-gradient-to-r from-lime-500 via-emerald-300 to-green-700 animate-wave',
                caveat.className
              )}
            >
              <div
                className={clsx(
                  'absolute opacity-40 top-0 font-bold text-black scale-[1.02] translate-x-1',
                  caveat.className
                )}
              >
                EUCHRE
              </div>
              EUCHRE
            </div>
          </div>
        </div>
        <div className="my-2 mx-4 flex gap-2">
          <button
            className="bg-stone-800 text-white border border-white md:p-2 p-1 m-auto min-w-32"
            onClick={onBegin}
          >
            Begin
          </button>
          <button
            className="bg-stone-800 text-white border border-white md:p-2 p-1 m-auto min-w-32"
            onClick={onSettings}
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameIntro;
