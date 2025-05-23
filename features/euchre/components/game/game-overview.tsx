import PromptHeader from '../prompt/prompt-header';
import PlayerColor from '../player/player-team-color';

import { getPlayerOverviewStats, getTeamOverviewStats } from '../../util/game/gameDataUtil';
import { getTeamColor } from '../../util/game/playerDataUtil';
import { DIFFICULTY_MAP } from '../../definitions/definitions';
import { EuchreGameInstance, EuchreSettings } from '../../definitions/game-state-definitions';

interface Props {
  game: EuchreGameInstance;
  gameSettings: EuchreSettings;
}

const GameOverview = ({ game, gameSettings }: Props) => {
  const team1Stats = getTeamOverviewStats(game, 1);
  const team2Stats = getTeamOverviewStats(game, 2);

  const rounds = game.handResults.length;
  const difficultyName = DIFFICULTY_MAP.entries().find((v) => v[1] === gameSettings.difficulty)?.[0];

  return (
    <div className="p-1 overflow-auto w-full">
      <div className="lg:text-sm text-xs mx-1">
        <div className="flex mx-1 items-center justify-center gap-4 w-full">
          <PromptHeader className="">Rounds Played: {rounds}</PromptHeader> |
          <PromptHeader className="">Deals Passed: {game.dealPassedCount}</PromptHeader> |
          <PromptHeader className="">Difficulty: {difficultyName}</PromptHeader>
        </div>
        <table className="mx-auto">
          <thead>
            <tr>
              <th className="px-2">Team</th>
              <th className="px-2">Final Score</th>
              <th className="px-2">Loners Won</th>
              <th className="px-2">Euchred</th>
              <th className="px-2">Total Tricks</th>
            </tr>
          </thead>
          <tbody className="text-center">
            <tr>
              <td className="flex items-center gap-1">
                <PlayerColor
                  className="border border-white text-transparent h-4 w-4"
                  teamColor={getTeamColor(game.player1, gameSettings)}
                >
                  X
                </PlayerColor>
                <div>Team One</div>
              </td>
              <td>{team1Stats.score}</td>
              <td>{team1Stats.lonerCount}</td>
              <td>{team1Stats.euchredCount}</td>
              <td>{team1Stats.tricksWonCount}</td>
            </tr>
            <tr>
              <td className="flex items-center gap-1">
                <PlayerColor
                  className="border border-white text-transparent h-4 w-4"
                  teamColor={getTeamColor(game.player3, gameSettings)}
                >
                  X
                </PlayerColor>
                <div>Team Two</div>
              </td>
              <td>{team2Stats.score}</td>
              <td>{team2Stats.lonerCount}</td>
              <td>{team2Stats.euchredCount}</td>
              <td>{team2Stats.tricksWonCount}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <PromptHeader>Team One</PromptHeader>
        <TeamPlayerStats game={game} teamNumber={1} />
      </div>
      <div>
        <PromptHeader>Team Two</PromptHeader>
        <TeamPlayerStats game={game} teamNumber={2} />
      </div>
      <div></div>
    </div>
  );
};

interface TeamPlayerProps {
  game: EuchreGameInstance;
  teamNumber: 1 | 2;
}

const TeamPlayerStats = ({ game, teamNumber }: TeamPlayerProps) => {
  const teamPlayers = game.gamePlayers.filter((p) => p.team === teamNumber);

  return (
    <table className="lg:text-sm text-xs mx-auto w-full">
      <thead>
        <tr className="border-b border-white">
          <th>Player</th>
          <th>Trump Ordered</th>
          <th>Tricks Won</th>
          <th>4-Suited Hands</th>
          <th>3-Suited Hands</th>
          <th>2-Suited Hands</th>
          <th>Aces Lead Count</th>
          <th>Loner Count</th>
        </tr>
      </thead>
      <tbody>
        {teamPlayers.map((player) => {
          const playerStats = getPlayerOverviewStats(game, player);

          return (
            <tr className="text-center" key={player.playerNumber}>
              <td>{player.name}</td>
              <td>{playerStats.trumpOrderedCount}</td>
              <td>{playerStats.tricksWonCount}</td>
              <td>{playerStats.fourSuitedCount}</td>
              <td>{playerStats.threeSuitedCount}</td>
              <td>{playerStats.twoSuitedCount}</td>
              <td>{playerStats.acesLeadCount}</td>
              <td>{playerStats.lonerCount}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default GameOverview;
