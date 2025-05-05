import { CheckCircleIcon } from '@heroicons/react/16/solid';
import UserInfo from '@/app/ui/euchre/player/user-info';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import EphemeralModal from '../common/ephemeral-modal';
import { GameSpeed } from '../../../lib/euchre/definitions/definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  notificationSpeed: GameSpeed;
}

const GamePlayIndicator = ({ notificationSpeed, className }: Props) => {
  const icon: React.ReactNode = <CheckCircleIcon className="min-h-[20px] max-h-[22px] text-green-300" />;

  return (
    <EphemeralModal
      key={uuidv4()}
      className={clsx(`w-fit h-fit absolute z-50`, className)}
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
