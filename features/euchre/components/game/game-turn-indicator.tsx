import clsx from 'clsx';
import GameBorderBare from './game-border-bare';
import {
  ArrowUpCircleIcon,
  ArrowRightCircleIcon,
  ArrowLeftCircleIcon,
  ArrowDownCircleIcon
} from '@heroicons/react/16/solid';
import { TableLocation } from '../../definitions/definitions';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  location: TableLocation;
}

const GameTurnIndicator = ({ location, className, ...rest }: DivProps) => {
  let locationCss = '';
  let icon: React.ReactNode;
  const iconCss = 'lg:h-6 lg:w-6 h-4 w-4 text-amber-400';
  switch (location) {
    case 'bottom':
      locationCss = '-top-10 left-1/3';
      icon = <ArrowDownCircleIcon className={iconCss}></ArrowDownCircleIcon>;
      break;
    case 'top':
      locationCss = '-bottom-12 left-1/3';
      icon = <ArrowUpCircleIcon className={iconCss}></ArrowUpCircleIcon>;
      break;
    case 'left':
      locationCss = '-top-10 right-1/3';
      icon = <ArrowLeftCircleIcon className={iconCss}></ArrowLeftCircleIcon>;
      break;
    case 'right':
      locationCss = '-top-10 left-1/3';
      icon = <ArrowRightCircleIcon className={iconCss}></ArrowRightCircleIcon>;
      break;
  }
  return (
    <GameBorderBare className={clsx('absolute animate-bounce', locationCss, className)} {...rest}>
      <div className="bg-white dark:bg-stone-800 p-1 flex">{icon}</div>
    </GameBorderBare>
  );
};
export default GameTurnIndicator;
