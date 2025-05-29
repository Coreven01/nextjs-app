import { forwardRef, PropsWithoutRef, useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Switch from '@mui/material/Switch';
import { GameMenuValues } from '../../definitions/game-state-definitions';

interface Props {
  menuValues: GameMenuValues;
}

const menuSvg =
  "checked:bg-[url('/menu.svg')] bg-[url('/menu.svg')] bg-no-repeat bg-center bg-[length:1rem] lg:bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)] dark:bg-[rgba(15,150,15,0.1)]";

const GameMenu = ({ menuValues }: Props) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const eventAdded = useRef(false);
  const enableToggleSettings = false;
  const enableToggleEvents = true;

  const { isFullScreen, onCancel } = menuValues;

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
    onCancel();
  };

  const newMenuValues = { ...menuValues, onCancel: handleCancelGame };

  return (
    <>
      <div className="flex p-1 absolute" style={{ zIndex: 100 }}>
        <div className="bg-stone-900">
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
        menuValues={newMenuValues}
        enableToggleEvents={enableToggleEvents}
        enableToggleSettings={enableToggleSettings}
      />
    </>
  );
};

interface ContentProps {
  showMenu: boolean;
  enableToggleSettings: boolean;
  enableToggleEvents: boolean;
  menuValues: GameMenuValues;
}

const GameMenuContent = forwardRef<HTMLDivElement, PropsWithoutRef<ContentProps>>(
  ({ showMenu, menuValues, enableToggleSettings, enableToggleEvents }: ContentProps, ref) => {
    const {
      showEvents,
      showSettings,
      showScore,
      isFullScreen,
      onToggleFullscreen,
      onToggleEvents,
      onToggleSettings,
      onToggleScore,
      onCancel
    } = menuValues;

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
            onChange={(e) => onToggleFullscreen(e.target.checked)}
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
              onChange={(e) => onToggleEvents(e.target.checked)}
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
              onChange={(e) => onToggleSettings(e.target.checked)}
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
            onChange={(e) => onToggleScore(e.target.checked)}
          />
        </div>
        <div className="lg:p-2 p-1 text-white lg:text-base text-sm">
          <button onClick={onCancel}>Cancel Game</button>
        </div>
      </div>
    );
  }
);

GameMenuContent.displayName = 'GameMenuContent';

export default GameMenu;
