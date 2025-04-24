import {
  DIFFICULTY_MAP,
  EuchreGameInstance,
  EuchreHandResult,
  EuchreSettings
} from '@/app/lib/euchre/definitions';
import PromptHeader from '../prompt/prompt-header';
import PlayerColor from '../player/player-team-color';
import useGameData from '@/app/hooks/euchre/data/useGameData';
import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import useCardData from '@/app/hooks/euchre/data/useCardData';

interface Props {
  game: EuchreGameInstance;
  gameSettings: EuchreSettings;
  gameResults: EuchreHandResult[];
}

const GameOverview = ({ game, gameSettings, gameResults }: Props) => {
  const { teamPoints } = useGameData();
  const { getTeamColor } = usePlayerData();

  const teamOneScore = Math.min(teamPoints(game, 1), 10);
  const teamTwoScore = Math.min(teamPoints(game, 2), 10);
  const teamOneLoners = gameResults.filter(
    (r) => r.maker.team === 1 && r.loner && r.teamWon === 1 && r.points === 4
  ).length;
  const teamTwoLoners = gameResults.filter(
    (r) => r.maker.team === 2 && r.loner && r.teamWon === 2 && r.points === 4
  ).length;
  const teamOneEuchred = gameResults.filter((r) => r.maker.team === 1 && r.teamWon === 2).length;
  const teamTwoEuchred = gameResults.filter((r) => r.maker.team === 2 && r.teamWon === 1).length;
  const teamOneTotalTricks = gameResults
    .map((r) => r.tricks)
    .flat()
    .filter((t) => t.taker?.team === 1).length;
  const teamTwoTotalTricks = gameResults
    .map((r) => r.tricks)
    .flat()
    .filter((t) => t.taker?.team === 2).length;
  const rounds = gameResults.length;
  const difficultyName = DIFFICULTY_MAP.entries().find((v) => v[1] === gameSettings.difficulty)?.[0];

  return (
    <div className="p-1 overflow-auto">
      <div className="lg:text-sm text-xs mx-1">
        <div className="flex mx-1 items-center justify-center gap-4 w-full">
          <PromptHeader className="">Rounds Played: {rounds}</PromptHeader> |
          <PromptHeader className="">Deals Passed: {game.dealPassedCount}</PromptHeader> |
          <PromptHeader className="">Difficulty: {difficultyName}</PromptHeader>
        </div>
        <table>
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
              <td>{teamOneScore}</td>
              <td>{teamOneLoners}</td>
              <td>{teamOneEuchred}</td>
              <td>{teamOneTotalTricks}</td>
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
              <td>{teamTwoScore}</td>
              <td>{teamTwoLoners}</td>
              <td>{teamTwoEuchred}</td>
              <td>{teamTwoTotalTricks}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <PromptHeader>Team One</PromptHeader>
        <TeamPlayerStats game={game} gameResults={gameResults} teamNumber={1} />
      </div>
      <div>
        <PromptHeader>Team Two</PromptHeader>
        <TeamPlayerStats game={game} gameResults={gameResults} teamNumber={2} />
      </div>
      <div></div>
    </div>
  );
};

interface TeamPlayerProps {
  game: EuchreGameInstance;
  gameResults: EuchreHandResult[];
  teamNumber: 1 | 2;
}

const TeamPlayerStats = ({ game, gameResults, teamNumber }: TeamPlayerProps) => {
  const { getSuitCount } = useCardData();
  const { playerEqual } = usePlayerData();
  const teamPlayers = game.gamePlayers.filter((p) => p.team === teamNumber);

  return (
    <table className="lg:text-sm text-xs">
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
          const trumpOrdered = gameResults.filter((r) => playerEqual(r.maker, player)).length;
          const tricksWon = gameResults
            .map((r) => r.tricks)
            .flat()
            .filter((t) => t.taker !== null && playerEqual(t.taker, player)).length;
          const acesLead = gameResults
            .map((r) => r.tricks)
            .flat()
            .map((t) => t.cardsPlayed[0])
            .filter((c) => playerEqual(c.player, player) && c.card.value === 'A').length;
          const lonerCount = gameResults.filter((r) => playerEqual(r.maker, player) && r.loner).length;

          const gameHandsForPlayer = gameResults.map((r) => {
            return {
              trump: r.trump,
              cards: r.tricks
                .map((t) => t.cardsPlayed)
                .flat()
                .filter((c) => playerEqual(c.player, player))
            };
          });

          const suitsForPlayerHands = gameHandsForPlayer.map((h) =>
            getSuitCount(
              h.cards.map((c) => c.card),
              h.trump
            )
          );
          const fourSuited = suitsForPlayerHands.filter((h) => h.length === 4).length;
          const threeSuited = suitsForPlayerHands.filter((h) => h.length === 3).length;
          const twoSuited = suitsForPlayerHands.filter((h) => h.length === 2).length;

          return (
            <tr className="text-center" key={player.playerNumber}>
              <td>{player.name}</td>
              <td>{trumpOrdered}</td>
              <td>{tricksWon}</td>
              <td>{fourSuited}</td>
              <td>{threeSuited}</td>
              <td>{twoSuited}</td>
              <td>{acesLead}</td>
              <td>{lonerCount}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const TeamStats = ({ game, gameResults, teamNumber }: TeamPlayerProps) => {
  const { getSuitCount } = useCardData();
  const { playerEqual } = usePlayerData();

  const teamPlayers = game.gamePlayers.filter((p) => p.team === teamNumber);

  return (
    <table className="lg:text-sm text-xs">
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
          const trumpOrdered = gameResults.filter((r) => playerEqual(r.maker, player)).length;
          const tricksWon = gameResults
            .map((r) => r.tricks)
            .flat()
            .filter((t) => t.taker !== null && playerEqual(t.taker, player)).length;
          const acesLead = gameResults
            .map((r) => r.tricks)
            .flat()
            .map((t) => t.cardsPlayed[0])
            .filter((c) => playerEqual(c.player, player) && c.card.value === 'A').length;
          const lonerCount = gameResults.filter((r) => playerEqual(r.maker, player) && r.loner).length;

          const gameHandsForPlayer = gameResults.map((r) => {
            return {
              trump: r.trump,
              cards: r.tricks
                .map((t) => t.cardsPlayed)
                .flat()
                .filter((c) => playerEqual(c.player, player))
            };
          });

          const suitsForPlayerHands = gameHandsForPlayer.map((h) =>
            getSuitCount(
              h.cards.map((c) => c.card),
              h.trump
            )
          );
          const fourSuited = suitsForPlayerHands.filter((h) => h.length === 4).length;
          const threeSuited = suitsForPlayerHands.filter((h) => h.length === 3).length;
          const twoSuited = suitsForPlayerHands.filter((h) => h.length === 2).length;

          return (
            <tr className="text-center" key={player.playerNumber}>
              <td>{player.name}</td>
              <td>{trumpOrdered}</td>
              <td>{tricksWon}</td>
              <td>{fourSuited}</td>
              <td>{threeSuited}</td>
              <td>{twoSuited}</td>
              <td>{acesLead}</td>
              <td>{lonerCount}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default GameOverview;
