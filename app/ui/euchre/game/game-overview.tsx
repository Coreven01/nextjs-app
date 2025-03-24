import { EuchreGameInstance, EuchreHandResult } from '@/app/lib/euchre/definitions';
import PromptHeader from '../prompt/prompt-header';
import { getSuitCount } from '@/app/lib/euchre/game';

interface Props {
  game: EuchreGameInstance;
  gameResults: EuchreHandResult[];
}
export default function GameOverview({ game, gameResults }: Props) {
  const teamOneScore = Math.min(game.teamPoints(1), 10);
  const teamTwoScore = Math.min(game.teamPoints(2), 10);
  const rounds = gameResults.length;

  return (
    <div className="p-1 overflow-auto">
      <div className="flex">
        <div className="flex flex-col">
          <PromptHeader>Final Score</PromptHeader>
          <div>Team One: {teamOneScore}</div>
          <div>Team Two: {teamTwoScore}</div>
        </div>
        <div className="flex flex-col">
          <PromptHeader>Rounds Played</PromptHeader>
          <div className="text-center">{rounds}</div>
        </div>
      </div>
      <div>
        <PromptHeader>Team One</PromptHeader>
        <TeamStats game={game} gameResults={gameResults} teamNumber={1} />
      </div>
      <div>
        <PromptHeader>Team Two</PromptHeader>
        <TeamStats game={game} gameResults={gameResults} teamNumber={2} />
      </div>
      <div></div>
    </div>
  );
}

interface TeamProps {
  game: EuchreGameInstance;
  gameResults: EuchreHandResult[];
  teamNumber: 1 | 2;
}

const TeamStats = ({ game, gameResults, teamNumber }: TeamProps) => {
  const teamPlayers = game.gamePlayers.filter((p) => p.team === teamNumber);

  return (
    <table className="text-sm">
      <thead>
        <tr className="border-b border-white">
          <th>Player</th>
          <th>Trump Ordered</th>
          <th>Tricks Won</th>
          <th>Suit</th>
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
              <td>{player.name}</td>
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
