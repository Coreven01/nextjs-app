import { EuchreGameInstance, EuchreHandResult } from '@/app/lib/euchre/definitions';

interface Props {
  game: EuchreGameInstance;
  gameResults: EuchreHandResult[];
}
export default function GameOverview({ game, gameResults }: Props) {
  return (
    <div>
      Final Score: Rounds Played: Game Time: Team One Stats:
      <div>
        Ordered Trump, Called Suit, Total Tricks, 4 Suited hands, 3 suited hands, 2 suited hands, Lead Ace,
        Loner count won, lead ace lost Bob: Rob: Total: Euchred rounds
      </div>
      Team Two Stats:
      <div></div>
    </div>
  );
}
