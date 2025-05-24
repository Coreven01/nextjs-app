import { CheckCircleIcon } from '@heroicons/react/16/solid';
import UserInfo from '@/features/euchre/components/player/user-info';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import EphemeralModal from '../common/ephemeral-modal';
import { GameSpeed } from '../../definitions/definitions';
import { NotificationActionType } from '../../../../app/hooks/euchre/reducers/playerNotificationReducer';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  notificationSpeed: GameSpeed;
  playerLocation: NotificationActionType;
  relativeLocation?: 'center' | 'middle' | 'outer';
}

const GamePlayIndicator = ({ notificationSpeed, playerLocation, relativeLocation, className }: Props) => {
  const icon: React.ReactNode = (
    <CheckCircleIcon className="lg:min-h-[22px] lg:max-h-[24px] min-h-[18px] max-h-[20px] text-green-300" />
  );

  const getClassForLocation = (
    playerLocation: NotificationActionType,
    relativeLocation?: 'center' | 'middle' | 'outer'
  ): string => {
    switch (playerLocation) {
      case NotificationActionType.BOTTOM:
        if (relativeLocation === 'outer') {
          return 'bottom-[35%] left-[40%]';
        } else if (relativeLocation === 'center') {
          return '-top-[5%] left-[40%]';
        } else {
          return 'top-[35%] left-[40%]';
        }
      case NotificationActionType.TOP:
        if (relativeLocation === 'outer') {
          return 'top-[5%] left-[40%]';
        } else if (relativeLocation === 'center') {
          return 'bottom-[20%] left-[40%]';
        } else {
          return 'top-[40%] left-[40%]';
        }
      case NotificationActionType.LEFT:
        if (relativeLocation === 'outer') {
          return 'left-[5%] top-[40%]';
        } else if (relativeLocation === 'center') {
          return 'right-[15%] top-[40%]';
        } else {
          return 'left-[40%] top-[40%]';
        }
      case NotificationActionType.RIGHT:
        if (relativeLocation === 'outer') {
          return 'right-1/4 top-[40%]';
        } else if (relativeLocation === 'center') {
          return '-left-[5%] top-[40%]';
        } else {
          return 'left-[40%] top-[40%]';
        }
      default:
        return 'left-[40%] top-[40%]';
    }
  };

  return (
    <EphemeralModal
      key={uuidv4()}
      className={clsx(
        `w-fit h-fit absolute z-50`,
        getClassForLocation(playerLocation, relativeLocation),
        className
      )}
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
