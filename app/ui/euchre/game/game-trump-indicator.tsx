import clsx from 'clsx';
import EphemeralModal from '../common/ephemeral-modal';
import { GameSpeed, Suit } from '../../../lib/euchre/definitions/definitions';
import { getCardClassColorFromSuit } from '../../../lib/euchre/util/cardSvgDataUtil';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  notificationSpeed: GameSpeed;
  trumpSuit: Suit;
}

const GameTrumpIndicator = ({ notificationSpeed, trumpSuit, className }: Props) => {
  return (
    <EphemeralModal
      className={clsx(`w-fit h-fit absolute z-10 left-1/3 top-1/4 lg:top-1/3`, className)}
      durationMs={500}
      delayMs={notificationSpeed}
      fadeType="in"
    >
      <div
        className={clsx(
          `lg:w-[75px] lg:h-auto lg:text-8xl text-6xl h-[65px] w-[55px] shadow-md shadow-black text-center absolute whitespace-nowrap opacity-40 border border-black bg-gray-300 rounded-2xl`,
          getCardClassColorFromSuit(trumpSuit)
        )}
      >
        {trumpSuit}
      </div>
    </EphemeralModal>
  );
};

export default GameTrumpIndicator;
