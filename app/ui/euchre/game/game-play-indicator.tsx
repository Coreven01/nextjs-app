import { CheckCircleIcon } from '@heroicons/react/16/solid';
import UserInfo from '@/app/ui/euchre/player/user-info';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import EphemeralModal from '../common/ephemeral-modal';
import { GameSpeed } from '../../../lib/euchre/definitions/definitions';

interface Props {
  notificationSpeed: GameSpeed;
  playerNumber: number;
  side: 'center' | 'outer';
}
const GamePlayIndicator = ({ notificationSpeed, playerNumber, side }: Props) => {
  const icon: React.ReactNode = <CheckCircleIcon className="min-h-[18px] max-h-[20px] text-green-300" />;
  let messageLocation = '';

  switch (playerNumber) {
    case 1:
      messageLocation = side === 'outer' ? 'bottom-8 ' : '-top-8';
      break;
    case 2:
      messageLocation = side === 'outer' ? 'top-8' : '-bottom-8';
      break;
    case 3:
      messageLocation = side === 'outer' ? 'left-8' : '-right-8';
      break;
    case 4:
      messageLocation = side === 'outer' ? 'right-8' : '-left-8';
      break;
  }

  return (
    <EphemeralModal
      key={uuidv4()}
      className={clsx(`w-fit h-fit absolute whitespace-nowrap shadow-lg shadow-black z-50`, messageLocation)}
      durationMs={500}
      delayMs={notificationSpeed}
      fadeType="both"
    >
      <UserInfo
        className={clsx(
          `p-2 lg:text-lg text-base w-auto absolute whitespace-nowrap z-40 shadow-lg`,
          messageLocation
        )}
      >
        <div className="flex gap-2 items-center">{icon}</div>
      </UserInfo>
    </EphemeralModal>
  );
};

export default GamePlayIndicator;
