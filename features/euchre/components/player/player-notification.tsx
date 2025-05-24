import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/16/solid';
import EphemeralModal from '../common/ephemeral-modal';
import UserInfo from './user-info';
import clsx from 'clsx';

import { playerEqual } from '../../util/game/playerDataUtil';
import { Suit, GameSpeed } from '../../definitions/definitions';
import { EuchrePlayer, EuchreSettings } from '../../definitions/game-state-definitions';

interface Props {
  dealer: EuchrePlayer;
  player: EuchrePlayer;
  settings: EuchreSettings;
  info: 'pass' | 'order' | 'named' | 'renege' | 'message';
  loner: boolean;
  namedSuit: Suit | null;
  delayMs?: GameSpeed;
  message?: string;
}

const PlayerNotification = ({
  dealer,
  player,
  delayMs,
  settings,
  info,
  loner,
  namedSuit,
  message
}: Props) => {
  const circleIcon: React.ReactNode = (
    <CheckCircleIcon className="min-h-[18px] max-h-[20px] text-green-700 dark:text-green-400" />
  );
  const xIcon: React.ReactNode = (
    <XCircleIcon className="min-h-[18px] max-h-[20px] text-red-800 dark:text-red-300" />
  );

  let icon: React.ReactNode;
  let messageLocation = '';

  switch (player.location) {
    case 'bottom':
      messageLocation = 'lg:bottom-8 lg:top-auto top-3';
      break;
    case 'top':
      messageLocation = 'lg:top-8 top-3';
      break;
    case 'left':
      messageLocation = 'lg:right-8 lg:left-auto left-3';
      break;
    case 'right':
      messageLocation = 'lg:left-8 lg:right-auto right-3';
      break;
  }

  let messageDetail: string;

  switch (info) {
    case 'pass':
      messageDetail = 'Pass';
      icon = xIcon;
      break;
    case 'order':
      messageDetail = playerEqual(dealer, player) ? 'Picking Up' : 'Pick it up';
      icon = circleIcon;
      break;
    case 'named':
      messageDetail = 'Calling ' + namedSuit;
      icon = circleIcon;
      break;
    case 'renege':
      messageDetail = "Renege! Didn't follow suit!";
      icon = xIcon;
      break;
    case 'message':
      messageDetail = message ?? '';
      icon = undefined;
      break;
  }

  return (
    <EphemeralModal
      className={clsx(`w-fit h-fit absolute whitespace-nowrap shadow-lg shadow-black z-50`, messageLocation)}
      durationMs={500}
      delayMs={delayMs ?? settings.notificationSpeed}
      fadeType="both"
    >
      <UserInfo>
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
