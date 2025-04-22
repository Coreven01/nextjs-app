import { EuchrePlayer, EuchreSettings, GameSpeed, Suit } from '@/app/lib/euchre/definitions';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/16/solid';
import EphemeralModal from '../ephemeral-modal';
import UserInfo from './user-info';
import clsx from 'clsx';

interface Props {
  dealer: EuchrePlayer;
  player: EuchrePlayer;
  settings: EuchreSettings;
  info: 'pass' | 'order' | 'named' | 'renege';
  loner: boolean;
  namedSuit: Suit | null;
  delayMs?: GameSpeed;
}

const PlayerNotification = ({ dealer, player, delayMs, settings, info, loner, namedSuit }: Props) => {
  const icon: React.ReactNode =
    info === 'pass' || info === 'renege' ? (
      <XCircleIcon className="min-h-[18px] max-h-[20px] text-red-800 dark:text-red-300" />
    ) : (
      <CheckCircleIcon className="min-h-[18px] max-h-[20px] text-green-700 dark:text-green-400" />
    );
  let messageLocation = '';

  switch (player.playerNumber) {
    case 1:
      messageLocation = 'lg:bottom-8 lg:top-auto top-3';
      break;
    case 2:
      messageLocation = 'lg:top-8 top-3';
      break;
    case 3:
      messageLocation = 'lg:right-8 lg:left-auto left-3';
      break;
    case 4:
      messageLocation = 'lg:left-8 lg:right-auto right-3';
      break;
  }

  let messageDetail: string;

  switch (info) {
    case 'pass':
      messageDetail = 'Pass';
      break;
    case 'order':
      messageDetail = dealer === player ? 'Picking Up' : 'Pick it up';
      break;
    case 'named':
      messageDetail = 'Calling ' + namedSuit;
      break;
    case 'renege':
      messageDetail = "Renege! Didn't follow suit!";
      break;
  }

  return (
    <EphemeralModal
      className={clsx(`w-fit h-fit absolute whitespace-nowrap shadow-lg shadow-black z-50`, messageLocation)}
      durationMs={500}
      delayMs={delayMs ?? settings.notificationSpeed}
      fadeType="both"
    >
      <UserInfo className="lg:text-base text-xs bg-white dark:bg-stone-800 p-2 border border-black dark:border-white text-black dark:text-white">
        <div className={clsx('flex gap-2 items-center')}>
          {icon}
          <div>{messageDetail}</div>
        </div>
        {loner && (
          <div className="w-full text-center text-red-800 dark:text-yellow-200 lg:text-xl">Going Alone!</div>
        )}
      </UserInfo>
    </EphemeralModal>
  );
};

export default PlayerNotification;
