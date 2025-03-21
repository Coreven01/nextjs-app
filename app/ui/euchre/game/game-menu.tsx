'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface Props {
  isFullScreen: boolean;
  showEvents: boolean;
  showSettings: boolean;
  onFullScreenToggle: (e: boolean) => void;
  onEventsToggle: (e: boolean) => void;
  onSettingsToggle: (e: boolean) => void;
}

const menuSvg =
  "checked:bg-[url('/menu.svg')] bg-[url('/menu.svg')] bg-no-repeat bg-center bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)] dark:bg-[rgba(15,150,15,0.1)]";

export default function GameMenu({
  isFullScreen,
  showEvents,
  showSettings,
  onFullScreenToggle,
  onEventsToggle,
  onSettingsToggle
}: Props) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = () => {
    setShowMenu(!showMenu);
  };

  return (
    <>
      <div className="flex p-1 absolute z-10">
        <div className="bg-stone-800">
          <input
            checked={showMenu}
            type="checkbox"
            title="Toggle Menu"
            className={`appearance-none cursor-pointer block bg-black peer/menu border rounded w-8 h-8 right-1 top-1 ${menuSvg} checked:dark:bg-neutral-500}`}
            onChange={handleMenuClick}
          />
        </div>
      </div>
      <div
        className={clsx(
          'flex flex-col absolute min-w-32 z-10 bg-black bg-opacity-50 left-3 top-12 transition ease-in-out duration-300',
          {
            hidden: !showMenu
          }
        )}
      >
        <div className="p-2 text-white">
          Toggle Fullscreen
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
      </div>
    </>
  );
}
