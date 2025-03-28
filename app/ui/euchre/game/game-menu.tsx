'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface Props {
  isFullScreen: boolean;
  showEvents: boolean;
  showSettings: boolean;
  onFullScreenToggle: (e: boolean) => void;
  onEventsToggle: (e: boolean) => void;
  onSettingsToggle: (e: boolean) => void;
  onCancelAndReset: () => void;
}

const menuSvg =
  "checked:bg-[url('/menu.svg')] bg-[url('/menu.svg')] bg-no-repeat bg-center bg-[length:1rem] md:bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)] dark:bg-[rgba(15,150,15,0.1)]";

export default function GameMenu({
  isFullScreen,
  showEvents,
  showSettings,
  onFullScreenToggle,
  onEventsToggle,
  onSettingsToggle,
  onCancelAndReset
}: Props) {
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const nav = document.getElementById('site-top-nav');
    if (nav) {
      nav.style.zIndex = isFullScreen ? '10' : '500';
    }

    return () => {
      if (nav) nav.style.zIndex = '500';
    };
  });

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
              `appearance-none cursor-pointer block bg-black peer/menu border rounded w-6 h-6 md:w-8 md:h-8 right-1 top-1 checked:dark:bg-neutral-500}`,
              menuSvg
            )}
            onChange={handleMenuClick}
          />
        </div>
      </div>
      <div
        className={clsx(
          'flex flex-col absolute min-w-32 bg-black bg-opacity-50 left-3 top-12 transition ease-in-out duration-300',
          {
            hidden: !showMenu
          }
        )}
        style={{ zIndex: 100 }}
      >
        <div className="p-2 text-white">
          <label>Toggle Fullscreen</label>
          <input
            checked={isFullScreen}
            type="checkbox"
            title="Toggle Fullscreen"
            className={``}
            onChange={(e) => onFullScreenToggle(e.target.checked)}
          />
        </div>
        <div className="p-2 text-white">
          Toggle Events
          <input
            checked={showEvents}
            type="checkbox"
            title="Toggle Events"
            className={`ml-2`}
            onChange={(e) => onEventsToggle(e.target.checked)}
          />
        </div>
        <div className="p-2 text-white">
          Toggle Settings
          <input
            checked={showSettings}
            type="checkbox"
            title="Toggle Settings"
            className={`ml-2`}
            onChange={(e) => onSettingsToggle(e.target.checked)}
          />
        </div>
        <div className="p-2 text-white">
          <button onClick={onCancelAndReset}>Cancel</button>
        </div>
      </div>
    </>
  );
}
