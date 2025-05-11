import clsx from 'clsx';
import { TeamColor } from '../../../lib/euchre/definitions/definitions';
import { getTeamCssClassFromTeamColor } from '../../../lib/euchre/util/playerDataUtil';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  teamColor: TeamColor;
}

const PlayerColor = ({ children, className, teamColor, ...rest }: DivProps) => {
  return (
    <div className={clsx(`p-1`, getTeamCssClassFromTeamColor(teamColor), className)} {...rest}>
      {children}
    </div>
  );
};

export default PlayerColor;
