import { forwardRef, PropsWithoutRef, useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Switch from '@mui/material/Switch';

interface Props {
  isFullScreen: boolean;
  showEvents: boolean;
  showSettings: boolean;
  showScore: boolean;
  onFullScreenToggle: (e: boolean) => void;
  onEventsToggle: (e: boolean) => void;
  onSettingsToggle: (e: boolean) => void;
  onScoreToggle: (e: boolean) => void;
  onCancelAndReset: () => void;
}

const menuSvg =
  "checked:bg-[url('/menu.svg')] bg-[url('/menu.svg')] bg-no-repeat bg-center bg-[length:1rem] lg:bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)] dark:bg-[rgba(15,150,15,0.1)]";

const GameMenu = ({
  isFullScreen,
  showEvents,
  showSettings,
  showScore,
  onFullScreenToggle,
  onEventsToggle,
  onSettingsToggle,
  onScoreToggle,
  onCancelAndReset
}: Props) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const eventAdded = useRef(false);
  const enableToggleSettings = false;
  const enableToggleEvents = true;

  const exitMenu = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target && menuRef.current && !menuRef.current.contains(target)) {
      event.stopPropagation();
      setShowMenu(false);
    }
  }, []);

  useEffect(() => {
    const goToFullScreen = () => {
      const nav = document.getElementById('site-top-nav');
      const navMenu = document.getElementById('nav-menu');
      const bodyElement = document.body;

      // try {
      //   if (isFullScreen && !document.fullscreenElement) {

      //   } else if (!isFullScreen && document.fullscreenElement) {

      //   }
      // } catch (e) {
      //   console.error(e);
      // }

      if (nav) {
        nav.style.zIndex = isFullScreen ? '10' : '500';
      }

      if (navMenu) {
        navMenu.style.zIndex = isFullScreen ? '20' : '600';
      }

      if (bodyElement) {
        bodyElement.style.overflow = isFullScreen ? 'hidden' : '';
      }

      if (!eventAdded.current && showMenu) {
        document.addEventListener('click', exitMenu);
        eventAdded.current = true;
      } else if (eventAdded.current && !showMenu) {
        document.removeEventListener('click', exitMenu);
        eventAdded.current = false;
      }

      return () => {
        if (nav) nav.style.zIndex = '500';
        if (navMenu) navMenu.style.zIndex = '600';
        if (bodyElement) bodyElement.style.overflow = '';
        document.removeEventListener('click', exitMenu);
        eventAdded.current = false;
      };
    };

    goToFullScreen();
  }, [exitMenu, isFullScreen, showMenu]);

  const handleMenuClick = () => {
    setShowMenu(!showMenu);
  };

  const handleCancelGame = () => {
    setShowMenu(false);
    onCancelAndReset();
  };

  return (
    <>
      <div className="flex p-1 absolute" style={{ zIndex: 100 }}>
        <div className="bg-stone-800">
          <input
            checked={showMenu}
            type="checkbox"
            title="Toggle Menu"
            className={clsx(
              `appearance-none cursor-pointer block bg-transparent peer/menu border rounded w-6 h-6 lg:w-8 lg:h-8 right-1 top-1 checked:dark:bg-neutral-500}`,
              menuSvg
            )}
            onChange={handleMenuClick}
          />
        </div>
      </div>
      <GameMenuContent
        ref={menuRef}
        showMenu={showMenu}
        showEvents={showEvents}
        showSettings={showSettings}
        showScore={showScore}
        enableToggleEvents={enableToggleEvents}
        isFullScreen={isFullScreen}
        enableToggleSettings={enableToggleSettings}
        onFullScreenToggle={onFullScreenToggle}
        onEventsToggle={onEventsToggle}
        onSettingsToggle={onSettingsToggle}
        onScoreToggle={onScoreToggle}
        onCancelGame={handleCancelGame}
      />
    </>
  );
};

interface ContentProps {
  showMenu: boolean;
  showEvents: boolean;
  showSettings: boolean;
  showScore: boolean;
  enableToggleEvents: boolean;
  isFullScreen: boolean;
  enableToggleSettings: boolean;
  onFullScreenToggle: (value: boolean) => void;
  onEventsToggle: (value: boolean) => void;
  onSettingsToggle: (value: boolean) => void;
  onScoreToggle: (value: boolean) => void;
  onCancelGame: () => void;
}

const GameMenuContent = forwardRef<HTMLDivElement, PropsWithoutRef<ContentProps>>(
  (
    {
      showMenu,
      showEvents,
      showSettings,
      showScore,
      enableToggleEvents,
      isFullScreen,
      enableToggleSettings,
      onFullScreenToggle,
      onEventsToggle,
      onSettingsToggle,
      onScoreToggle,
      onCancelGame
    }: ContentProps,
    ref
  ) => {
    return (
      <div
        id="game-menu"
        ref={ref}
        className={clsx(
          'flex flex-col absolute min-w-32 bg-stone-800 lg:bg-opacity-90 left-3 top-12 transition ease-in-out duration-300',
          {
            hidden: !showMenu
          }
        )}
        style={{ zIndex: 100 }}
      >
        <div className="lg:p-2 p-1 text-white lg:text-base text-sm">
          <label htmlFor="isFullScreen">Toggle Fullscreen</label>
          <Switch
            id="isFullScreen"
            size="small"
            checked={isFullScreen}
            name="isFullScreen"
            color="success"
            onChange={(e) => onFullScreenToggle(e.target.checked)}
          />
        </div>
        {enableToggleEvents && (
          <div className="lg:p-2 p-1 text-white lg:text-base text-sm">
            <label htmlFor="showEvents">Toggle Events</label>
            <Switch
              id="showEvents"
              size="small"
              checked={showEvents}
              name="showEvents"
              color="success"
              onChange={(e) => onEventsToggle(e.target.checked)}
            />
          </div>
        )}
        {enableToggleSettings && (
          <div className="lg:p-2 p-1 text-white lg:text-base text-sm">
            <label htmlFor="showSettings">Toggle Settings</label>
            <Switch
              id="showSettings"
              size="small"
              checked={showSettings}
              name="showSettings"
              color="success"
              onChange={(e) => onSettingsToggle(e.target.checked)}
            />
          </div>
        )}
        <div className="lg:p-2 p-1 text-white lg:text-base text-sm">
          <label htmlFor="showScore">Toggle Score</label>
          <Switch
            id="showScore"
            size="small"
            checked={showScore}
            name="showScore"
            color="success"
            onChange={(e) => onScoreToggle(e.target.checked)}
          />
        </div>
        <div className="lg:p-2 p-1 text-white lg:text-base text-sm">
          <button onClick={onCancelGame}>Cancel Game</button>
        </div>
      </div>
    );
  }
);

GameMenuContent.displayName = 'GameMenuContent';

export default GameMenu;
