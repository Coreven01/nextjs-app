import clsx from 'clsx';
import EphemeralModal from './ephemeral-modal';
import UserInfo from '../player/user-info';
import { EuchreSettings } from '../../definitions/game-state-definitions';
import { GameSpeed } from '../../definitions/definitions';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  settings: EuchreSettings;
  delayMs?: GameSpeed;
  children?: React.ReactNode;
}

export default function CenterInfo({ settings, delayMs, children, className }: DivProps) {
  if (children) {
    return (
      <EphemeralModal
        className={clsx(`w-fit h-fit absolute whitespace-nowrap shadow-lg shadow-black z-50`, className)}
        durationMs={500}
        delayMs={delayMs ?? settings.notificationSpeed}
        fadeType="both"
      >
        <UserInfo>
          <div className={clsx('flex gap-2 items-center')}>{children}</div>
        </UserInfo>
      </EphemeralModal>
    );
  }

  return <></>;
}
