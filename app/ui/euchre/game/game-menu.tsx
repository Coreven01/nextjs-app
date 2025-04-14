import { useCallback, useEffect, useRef, useState } from 'react';
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
  "checked:bg-[url('/menu.svg')] bg-[url('/menu.svg')] bg-no-repeat bg-center bg-[length:1rem] md:bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)] dark:bg-[rgba(15,150,15,0.1)]";

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
  const menuRef = useRef<HTMLDivElement | null>(null);
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
    const goToFullScreen = async () => {
      const nav = document.getElementById('site-top-nav');
      const navMenu = document.getElementById('nav-menu');

      try {
        if (isFullScreen && !document.fullscreenElement) {
          //await document.documentElement.requestFullscreen();
          //await document.body.requestFullscreen();
        } else if (!isFullScreen && document.fullscreenElement) {
          //await document.exitFullscreen();
        }
      } catch (e) {
        console.error(e);
      }

      if (nav) {
        nav.style.zIndex = isFullScreen ? '10' : '500';
      }

      if (navMenu) {
        navMenu.style.zIndex = isFullScreen ? '20' : '600';
      }

      if (!eventAdded.current && showMenu) {
        document.addEventListener('click', exitMenu);
        eventAdded.current = true;
      } else if (eventAdded.current && !showMenu) {
        document.removeEventListener('click', exitMenu);
        eventAdded.current = false;
      }

      return async () => {
        if (nav) nav.style.zIndex = '500';
        if (navMenu) navMenu.style.zIndex = '600';
        //if (isFullScreen && document.fullscreenElement) await document.exitFullscreen();
        document.removeEventListener('click', exitMenu);
        eventAdded.current = false;
      };
    };

    goToFullScreen();
  }, [exitMenu, isFullScreen, showMenu]);

  const handleMenuClick = () => {
    setShowMenu(!showMenu);
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
              `appearance-none cursor-pointer block bg-transparent peer/menu border rounded w-6 h-6 md:w-8 md:h-8 right-1 top-1 checked:dark:bg-neutral-500}`,
              menuSvg
            )}
            onChange={handleMenuClick}
          />
        </div>
      </div>
      <div
        id="game-menu"
        ref={menuRef}
        className={clsx(
          'flex flex-col absolute min-w-32 bg-stone-800 md:bg-opacity-50 left-3 top-12 transition ease-in-out duration-300',
          {
            hidden: !showMenu
          }
        )}
        style={{ zIndex: 100 }}
      >
        <div className="p-2 text-white">
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
          <div className="p-2 text-white">
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
          <div className="p-2 text-white">
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
        <div className="p-2 text-white">
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
        <div className="p-2 text-white">
          <button onClick={onCancelAndReset}>Cancel Game</button>
        </div>
      </div>
    </>
  );
};

export default GameMenu;
