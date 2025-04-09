import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import { EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  player: EuchrePlayer;
  settings: EuchreSettings;
}

const PlayerColor = ({ children, className, player, settings, ...rest }: DivProps) => {
  const { getTeamCssClass } = usePlayerData();

  return (
    <div {...rest} className={clsx(`p-1 ${getTeamCssClass(player, settings)}`, className)}>
      {children}
    </div>
  );
};

export default PlayerColor;
