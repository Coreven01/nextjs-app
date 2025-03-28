import { EuchreGameInstance, EuchreHandResult, EuchreSettings } from '@/app/lib/euchre/definitions';
import PromptHeader from '../prompt/prompt-header';
import { getSuitCount } from '@/app/lib/euchre/game';
import PlayerColor from '../player/player-team-color';

interface Props {
  game: EuchreGameInstance;
  gameSettings: EuchreSettings;
  gameResults: EuchreHandResult[];
}
export default function GameOverview({ game, gameSettings, gameResults }: Props) {
  const teamOneScore = Math.min(game.teamPoints(1), 10);
  const teamTwoScore = Math.min(game.teamPoints(2), 10);
  const rounds = gameResults.length;

  return (
    <div className="p-1 overflow-auto">
      <div className="flex">
        <div className="flex flex-col md:text-base text-xs mx-1">
          <PromptHeader>Final Score</PromptHeader>
          <div className="flex items-center gap-2">
            <PlayerColor
              className="border border-white text-transparent h-4 w-4"
              player={game.player1}
              settings={gameSettings}
            >
              X
            </PlayerColor>
            <div>Team One: {teamOneScore}</div>
          </div>
          <div className="flex items-center gap-2">
            <PlayerColor
              className="border border-white text-transparent h-4 w-4"
              player={game.player3}
              settings={gameSettings}
            >
              X
            </PlayerColor>
            <div>Team Two: {teamTwoScore}</div>
          </div>
        </div>
        <div className="flex flex-col md:text-base text-xs mx-1">
          <PromptHeader>Rounds Played</PromptHeader>
          <div className="text-center">{rounds}</div>
        </div>
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
}

interface TeamPlayerProps {
  game: EuchreGameInstance;
  gameResults: EuchreHandResult[];
  teamNumber: 1 | 2;
}

const TeamPlayerStats = ({ game, gameResults, teamNumber }: TeamPlayerProps) => {
  const teamPlayers = game.gamePlayers.filter((p) => p.team === teamNumber);

  return (
    <table className="md:text-sm text-xs">
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
          const trumpOrdered = gameResults.filter((r) => r.maker.equal(player)).length;
          const tricksWon = gameResults
            .map((r) => r.tricks)
            .flat()
            .filter((t) => t.taker !== null && t.taker.equal(player)).length;
          const acesLead = gameResults
            .map((r) => r.tricks)
            .flat()
            .map((t) => t.cardsPlayed[0])
            .filter((c) => c.player.equal(player) && c.card.value === 'A').length;
          const lonerCount = gameResults.filter((r) => r.maker.equal(player) && r.loner).length;

          const gameHandsForPlayer = gameResults.map((r) => {
            return {
              trump: r.trump,
              cards: r.tricks
                .map((t) => t.cardsPlayed)
                .flat()
                .filter((c) => c.player.equal(player))
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
  const teamPlayers = game.gamePlayers.filter((p) => p.team === teamNumber);

  return (
    <table className="md:text-sm text-xs">
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
          const trumpOrdered = gameResults.filter((r) => r.maker.equal(player)).length;
          const tricksWon = gameResults
            .map((r) => r.tricks)
            .flat()
            .filter((t) => t.taker !== null && t.taker.equal(player)).length;
          const acesLead = gameResults
            .map((r) => r.tricks)
            .flat()
            .map((t) => t.cardsPlayed[0])
            .filter((c) => c.player.equal(player) && c.card.value === 'A').length;
          const lonerCount = gameResults.filter((r) => r.maker.equal(player) && r.loner).length;

          const gameHandsForPlayer = gameResults.map((r) => {
            return {
              trump: r.trump,
              cards: r.tricks
                .map((t) => t.cardsPlayed)
                .flat()
                .filter((c) => c.player.equal(player))
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
