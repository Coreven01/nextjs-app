import { EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  player: EuchrePlayer;
  settings: EuchreSettings;
}

export default function PlayerColor({ children, className, player, settings, ...rest }: DivProps) {
  return (
    <div {...rest} className={clsx(`p-1 ${player.getTeamCssClass(settings)}`, className)}>
      {children}
    </div>
  );
}
