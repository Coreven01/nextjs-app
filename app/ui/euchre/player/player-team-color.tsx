import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import clsx from 'clsx';
import { TeamColor } from '../../../lib/euchre/definitions/definitions';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  teamColor: TeamColor;
}

const PlayerColor = ({ children, className, teamColor, ...rest }: DivProps) => {
  const { getTeamCssClassFromTeamColor } = usePlayerData();

  return (
    <div className={clsx(`p-1`, getTeamCssClassFromTeamColor(teamColor), className)} {...rest}>
      {children}
    </div>
  );
};

export default PlayerColor;
