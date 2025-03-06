import { Card, EuchreGameInstance, EuchrePlayer } from "@/app/lib/euchre/data";
import PlayerHand from "./player-hand";
import PlayerInfo from "./player-info";
import GameDeck from "./game-deck";
import { GameFlowState } from "@/app/hooks/euchre/gameFlowReducer";

type Props = {
  player: EuchrePlayer;
  game: EuchreGameInstance;
  gameState: GameFlowState;
  dealDeck: Card[];
  location: "center" | "side";
  onCardClick: (card: Card) => void;
};

export default function PlayerGameDeck({
  player,
  game,
  gameState,
  dealDeck,
  location,
  onCardClick,
}: Props) {
  const playerNumber = player.playerNumber;
  const positionCenter = `absolute ${playerNumber === 1 ? "bottom-0" : "top-0"}`;
  const positionSide = `absolute ${playerNumber === 3 ? "left-0" : "right-0"}`;
  const position = location === "center" ? positionCenter : positionSide;
  const shouldShowDeckImages = gameState.shouldShowDeckImages.find(
    (c) => c.player === player,
  )?.value;

  const gameDeck = shouldShowDeckImages ? (
    <div id={`game-deck-${playerNumber}`} className={position}>
      <GameDeck deck={dealDeck} location={location} />
    </div>
  ) : (
    <></>
  );
  const classForLocation =
    `${location === "side" ? "flex-col" : ""} ${playerNumber === 1 || playerNumber === 4 ? "items-end" : ""}`.trim();
  const playerInfoClass = `${location === "side" ? "w-full" : ""}`;

  return (
    <>
      <div
        className={`flex ${classForLocation} h-full justify-center relative`}
      >
        <PlayerHand
          gameState={gameState}
          player={player}
          location={location}
          onCardClick={onCardClick}
        />
        <div id={`player-base-${playerNumber}`} className={position}>
          X
        </div>
        {gameDeck}
        <div className={playerInfoClass}>
          <PlayerInfo game={game} player={player} />
        </div>
      </div>
    </>
  );
}
