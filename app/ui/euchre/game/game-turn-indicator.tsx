import clsx from 'clsx';
import { TableLocation } from '../../../lib/euchre/definitions/definitions';
import GameBorderBare from './game-border-bare';
import {
  ArrowUpCircleIcon,
  ArrowRightCircleIcon,
  ArrowLeftCircleIcon,
  ArrowDownCircleIcon
} from '@heroicons/react/16/solid';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  location: TableLocation;
}

const GameTurnIndicator = ({ location, ...rest }: DivProps) => {
  let locationCss = '';
  let icon: React.ReactNode;
  const iconCss = 'lg:h-5 lg:w-5 h-4 w-4 text-amber-400';
  switch (location) {
    case 'bottom':
      locationCss = '-top-10 left-2';
      icon = <ArrowDownCircleIcon className={iconCss}></ArrowDownCircleIcon>;
      break;
    case 'top':
      locationCss = '-bottom-11 left-2';
      icon = <ArrowUpCircleIcon className={iconCss}></ArrowUpCircleIcon>;
      break;
    case 'left':
      locationCss = '-top-10 right-2';
      icon = <ArrowLeftCircleIcon className={iconCss}></ArrowLeftCircleIcon>;
      break;
    case 'right':
      locationCss = '-top-10 left-2';
      icon = <ArrowRightCircleIcon className={iconCss}></ArrowRightCircleIcon>;
      break;
  }
  return (
    <GameBorderBare className={clsx('absolute animate-bounce', locationCss)} {...rest}>
      <div className="bg-white dark:bg-stone-800 p-1 flex">{icon} Turn</div>
    </GameBorderBare>
  );
};
export default GameTurnIndicator;
