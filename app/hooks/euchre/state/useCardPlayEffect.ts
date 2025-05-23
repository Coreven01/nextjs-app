import { RefObject, useCallback, useEffect, useRef } from 'react';

import useAnimationCardState from '../phases/useAnimationCardState';
import { playerSittingOut } from '../../../../features/euchre/util/game/gameDataUtil';
import { playerEqual } from '../../../../features/euchre/util/game/playerDataUtil';
import {
  EuchreGameState,
  EuchrePlayer,
  ErrorHandlers,
  HandState
} from '../../../../features/euchre/definitions/game-state-definitions';

const useCardPlayEffect = (
  state: EuchreGameState,
  player: EuchrePlayer,
  errorHandlers: ErrorHandlers,
  handState: HandState | undefined,
  playerCardsRefs: Map<number, RefObject<HTMLDivElement | null>>,
  onPassDeal: () => void,
  onReorderHand: () => void,
  onPlayerSittingOut: () => Promise<void>,
  onTrickFinished: () => void,
  onBeginPlayerTurn: () => void,
  onEndPlayerTurn: () => void
) => {
  const { euchreGame } = state;

  const {
    shouldAnimateBeginPassDeal,
    shouldReorderHand,
    shouldAnimateTrickFinished,
    shoudUpdateCardStateForTurnEnd,
    shoudUpdateCardStateForTurn
  } = useAnimationCardState(state);

  const initAnimatePassDeal = useRef(false);
  const initForCardsReorder = useRef(false);
  const initForSittingOut = useRef(false);
  const sittingOutPlayer = playerSittingOut(euchreGame);
  const playerIsSittingOut = sittingOutPlayer && playerEqual(player, sittingOutPlayer);

  /** Trick id where the the player's hand was re-grouped at the beginning of the player's turn. */
  const trickIdHandledBeginPlayerTurn = useRef<string[]>([]);

  /** Trick id where the the player's hand was re-grouped at the end of the player's turn. */
  const trickIdHandledEndPlayerTurn = useRef<string[]>([]);

  // trick ids where the event for trick finished was handled.
  const trickIdOnTrickFinishHandled = useRef<string[]>([]);

  const handleResetHandState = useCallback(() => {
    const shouldResetHandState = handState !== undefined && handState.handId !== euchreGame.handId;

    if (shouldResetHandState) {
      initAnimatePassDeal.current = false;
      initForCardsReorder.current = false;
      initForSittingOut.current = false;
      trickIdHandledEndPlayerTurn.current = [];
      trickIdOnTrickFinishHandled.current = [];
    }
  }, [euchreGame.handId, handState]);

  const handlePassDeal = useCallback(() => {
    const shouldHandlePassDeal = !initAnimatePassDeal.current && shouldAnimateBeginPassDeal;

    if (shouldHandlePassDeal) {
      initAnimatePassDeal.current = true;
      onPassDeal();
    }
  }, [onPassDeal, shouldAnimateBeginPassDeal]);

  const handleReorderHand = useCallback(() => {
    const shouldReorder = !initForCardsReorder.current && shouldReorderHand;

    if (shouldReorder) {
      initForCardsReorder.current = true;

      if (handState?.shouldShowCardValue && !playerIsSittingOut) {
        onReorderHand();
      }
    }
  }, [handState?.shouldShowCardValue, onReorderHand, playerIsSittingOut, shouldReorderHand]);

  const handlePlayerSittingOut = useCallback(() => {
    if (!initForSittingOut.current && playerIsSittingOut) {
      initForSittingOut.current = true;

      onPlayerSittingOut();
    }
  }, [onPlayerSittingOut, playerIsSittingOut]);

  const handleTrickFinished = useCallback(() => {
    const currentTrick = euchreGame.currentTrick;

    const shouldHandleTrickFinished =
      !trickIdOnTrickFinishHandled.current.find((s) => s === currentTrick.trickId) &&
      shouldAnimateTrickFinished;

    if (shouldHandleTrickFinished) {
      trickIdOnTrickFinishHandled.current.push(currentTrick.trickId);
      onTrickFinished();
    }
  }, [euchreGame.currentTrick, onTrickFinished, shouldAnimateTrickFinished]);

  const handleBeginPlayerTurn = useCallback(() => {
    const shouldHandleBeginPlayerTurn =
      player.human &&
      !trickIdHandledBeginPlayerTurn.current.includes(euchreGame.currentTrick.trickId) &&
      shoudUpdateCardStateForTurn &&
      playerEqual(player, euchreGame.currentPlayer) &&
      handState;

    if (shouldHandleBeginPlayerTurn) {
      trickIdHandledBeginPlayerTurn.current.push(euchreGame.currentTrick.trickId);

      onBeginPlayerTurn();
    }
  }, [
    euchreGame.currentPlayer,
    euchreGame.currentTrick.trickId,
    handState,
    onBeginPlayerTurn,
    player,
    shoudUpdateCardStateForTurn
  ]);

  const handleEndPlayerTurn = useCallback(() => {
    const shouldHandleEndPlayerTurn =
      player.human &&
      !trickIdHandledEndPlayerTurn.current.includes(euchreGame.currentTrick.trickId) &&
      shoudUpdateCardStateForTurnEnd &&
      playerEqual(player, euchreGame.currentPlayer) &&
      handState;

    if (shouldHandleEndPlayerTurn) {
      trickIdHandledEndPlayerTurn.current.push(euchreGame.currentTrick.trickId);

      onEndPlayerTurn();
    }
  }, [
    euchreGame.currentPlayer,
    euchreGame.currentTrick.trickId,
    handState,
    onEndPlayerTurn,
    player,
    shoudUpdateCardStateForTurnEnd
  ]);

  //#region  Effect Hooks

  useEffect(() => {
    handleResetHandState();
  }, [handleResetHandState]);

  useEffect(() => {
    handlePassDeal();
  }, [handlePassDeal]);

  useEffect(() => {
    handleReorderHand();
  }, [handleReorderHand]);

  /** Set initial hand state after cards have been dealt. */
  useEffect(() => {
    handlePlayerSittingOut();
  }, [handlePlayerSittingOut]);

  useEffect(() => {
    handleTrickFinished();
  }, [handleTrickFinished]);

  useEffect(() => {
    handleBeginPlayerTurn();
  }, [handleBeginPlayerTurn]);

  useEffect(() => {
    handleEndPlayerTurn();
  }, [handleEndPlayerTurn]);

  //#endregion

  return {};
};

export default useCardPlayEffect;
