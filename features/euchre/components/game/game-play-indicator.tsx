import { CheckCircleIcon } from '@heroicons/react/16/solid';
import UserInfo from '@/features/euchre/components/player/user-info';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import EphemeralModal from '../common/ephemeral-modal';
import { GameSpeed, TableLocation } from '../../definitions/definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  notificationSpeed: GameSpeed;
  location: TableLocation;
}

const GamePlayIndicator = ({ notificationSpeed, location, className }: Props) => {
  let locationClass = '';
  const icon: React.ReactNode = (
    <CheckCircleIcon className="lg:min-h-[22px] lg:max-h-[24px] min-h-[18px] max-h-[20px] text-green-300" />
  );

  switch (location) {
    case 'bottom':
      locationClass = 'top-1/4';
      break;
    case 'top':
      locationClass = 'top-1/4';
      break;
    case 'left':
      locationClass = 'left-1/4';
      break;
    case 'right':
      locationClass = 'right-1/4';
  }

  return (
    <EphemeralModal
      key={uuidv4()}
      className={clsx(`w-fit h-fit absolute z-50`, locationClass, className)}
      durationMs={500}
      delayMs={notificationSpeed}
      fadeType="both"
    >
      <UserInfo className={clsx(`p-2 w-auto absolute whitespace-nowrap shadow-lg shadow-black`)}>
        <div className="flex gap-2 items-center">{icon}</div>
      </UserInfo>
    </EphemeralModal>
  );
};

export default GamePlayIndicator;
