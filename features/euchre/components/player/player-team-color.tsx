import clsx from 'clsx';

import { getTeamCssClassFromTeamColor } from '../../util/game/playerDataUtil';
import { TeamColor } from '../../definitions/definitions';

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
