import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreErrorState, EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect } from 'react';
import { createEvent } from '@/app/lib/euchre/util';
import { PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import { Card, EuchreGameInstance, EuchrePlayer } from '@/app/lib/euchre/definitions';
import EphemeralModal from '@/app/ui/euchre/ephemeral-modal';
import GameBorder from '@/app/ui/euchre/game/game-border';
import GameCard from '@/app/ui/euchre/game/game-card';
import clsx from 'clsx';
import useGameSetupLogic from './logic/useGameSetupLogic';
import useGamePlayLogic from './logic/useGamePlayLogic';
import useGameStateLogic from './logic/useGameStateLogic';
import useCardSvgData from './data/useCardSvgData';
import useCardData from './data/useCardData';
import { v4 as uuidv4 } from 'uuid';

const useEuchreGameShuffle = (state: EuchreGameState, errorState: EuchreErrorState) => {
  const { isGameStateValidToContinue, generateElementId } = useGameStateLogic();
  const { shuffleAndDealHand } = useGameSetupLogic();
  const { getGameStateForNextHand } = useGamePlayLogic();
  const { getEncodedCardSvg, getCardFullName } = useCardSvgData();
  const { getDisplayHeight, getDisplayWidth } = useCardData();

  const FLIPPED_CARD_ID = 'flipped-card';

  /** */
  const getFaceUpCard = useCallback(
    (id: string, card: Card, fadeOut: boolean) => {
      return (
        <EphemeralModal
          key={`${generateElementId()}`}
          durationMs={150}
          delayMs={150}
          fadeType={fadeOut ? 'out' : 'in'}
          className={clsx(
            'md:relative md:right-auto md:top-auto absolute -right-16 -top-8',
            { 'opacity-100': fadeOut },
            { 'opacity-0': !fadeOut }
          )}
        >
          <GameBorder innerClass="bg-stone-800" className="shadow-md shadow-black" size="small">
            <div className="p-2 bg-green-950 flex items-center justify-center">
              <GameCard
                cardState={{
                  src: getEncodedCardSvg(card, 'center'),
                  cardFullName: getCardFullName(card),
                  cardIndex: card.index
                }}
                className="lg:h-[125px] md:h-[115px] h-[95px]"
                card={card}
                responsive={true}
                id={id}
                width={getDisplayWidth('center')}
                height={getDisplayHeight('center')}
                title={getCardFullName(card)}
              ></GameCard>
            </div>
          </GameBorder>
        </EphemeralModal>
      );
    },
    [generateElementId, getCardFullName, getDisplayHeight, getDisplayWidth, getEncodedCardSvg]
  );

  //#region Shuffle and Deal for regular playthrough *************************************************************************

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

    let newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;
    if (!newGame?.dealer) throw new Error('Dealer not found for shuffle and deal.');

    state.addEvent(
      createEvent('v', state.euchreSettings, newGame.dealer, 'Begin shuffle and deal for regular play.')
    );

    const shuffleResult = shuffleAndDealHand(
      newGame,
      state.euchreSettings,
      state.euchreReplayGame,
      state.shouldCancel
    );

    newGame = shuffleResult.game;

    if (!newGame?.trump) throw Error('Trump not found after shuffle and deal for regular play.');

    state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });

    // display trump card for bidding in the center of the table.
    state.dispatchPlayerNotification({
      type: PlayerNotificationActionType.UPDATE_CENTER,
      payload: getFaceUpCard(FLIPPED_CARD_ID, newGame.trump, false)
    });

    const newGameState: EuchreGameFlowState = getGameStateForNextHand(
      state.euchreGameFlow,
      state.euchreSettings,
      newGame
    );
    newGameState.gameFlow = EuchreGameFlow.BEGIN_DEAL_CARDS;

    state.dispatchGameFlow({ type: EuchreFlowActionType.UPDATE_ALL, payload: newGameState });
    state.dispatchGameAnimationFlow({
      type: EuchreAnimationActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
    });
    state.setEuchreGame(newGame);
  }, [getFaceUpCard, getGameStateForNextHand, isGameStateValidToContinue, shuffleAndDealHand, state]);

  useEffect(() => {
    try {
      beginShuffleAndDealHand();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in beginShuffleAndDealHand',
        gameFlow: EuchreFlowActionType.SET_BEGIN_SHUFFLE_CARDS,
        animationType: EuchreAnimationActionType.SET_ANIMATE_NONE
      });
    }
  }, [beginShuffleAndDealHand, errorState, state]);

  /**  */
  useEffect(() => {
    const beginAnimationForDealCards = async () => {
      if (
        !isGameStateValidToContinue(
          state.euchreGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.BEGIN_DEAL_CARDS,
          EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      if (!state.euchreGame) throw new Error();
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

      //state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
      //state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_BID_FOR_TRUMP });
    };

    try {
      beginAnimationForDealCards();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in beginAnimationForDealCards',
        gameFlow: EuchreFlowActionType.SET_BEGIN_DEAL_CARDS,
        animationType: EuchreAnimationActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
      });
    }
  }, [errorState, isGameStateValidToContinue, state]);

  const handleShuffleAndDealComplete = () => {
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_BID_FOR_TRUMP });
  };
  //#endregion

  return { handleShuffleAndDealComplete };
};

export default useEuchreGameShuffle;
