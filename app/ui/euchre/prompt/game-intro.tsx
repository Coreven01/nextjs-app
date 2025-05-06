import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { caveat } from '../../fonts';
import { motion } from 'framer-motion';
import GameButton from '../game/game-button';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  onBegin: () => void;
  onSettings: () => void;
  onRunDebug: () => void;
}

const GameIntro = ({ className, onBegin, onSettings, onRunDebug, ...rest }: DivProps) => {
  const titleElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => titleElement.current && titleElement.current.classList.add('translate-y-[-20px]'), 250);
  }, []);

  return (
    <div className={clsx('flex lg:min-w-[30svw] lg:min-h-64 min-h-32', className)} {...rest}>
      <div className="flex grow flex-col items-center justify-center">
        <div className="flex grow items-center w-full">
          <div className="grow flex justify-center bg-neutral-900 border-t border-b border-white p-2 text-center text-5xl mt-4">
            <motion.div
              ref={titleElement}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { opacity: { duration: 3 } } }}
              id="game-title"
              style={{ backgroundSize: '400%' }}
              className={clsx(
                'relative top-[20px] transition-all duration-[1.25s] ease-in transform text-transparent font-bold bg-clip-text bg-gradient-to-r from-lime-600 via-emerald-400 to-green-600 animate-wave',
                caveat.className
              )}
            >
              <div
                className={clsx(
                  'absolute opacity-40 top-0 font-bold text-black scale-[1.02] translate-x-1 bold',
                  caveat.className
                )}
              >
                EUCHRE
              </div>
              EUCHRE
            </motion.div>
          </div>
        </div>
        <div className="my-4 mx-4 flex gap-2">
          <GameButton type="success" onClick={onBegin}>
            New Game
          </GameButton>
          <GameButton type="danger" onClick={onRunDebug}>
            Debug Game
          </GameButton>
          <GameButton type="primary" onClick={onSettings}>
            Settings
          </GameButton>
        </div>
      </div>
    </div>
  );
};

export default GameIntro;
