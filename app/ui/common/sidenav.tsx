'use client';

import NavLinks from './nav-links';
import { useState } from 'react';

export default function SideNav() {
  const [isMenuToggled, setMenuToggled] = useState(false);
  const menuSvg =
    "checked:bg-[url('/menu.svg')] bg-[url('/menu.svg')] bg-no-repeat bg-center bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)] dark:bg-[rgba(15,15,15,0.1)]";

  return (
    <div
      id="nav-menu"
      style={{ zIndex: 600 }}
      className="lg:fixed sticky lg:top-[57px] lg:left-0 overflow-auto min-h-full lg:w-58 border-r min-w-48 bg-neutral-900 bg-opacity-50"
    >
      <div className="relative w-50 min-h-full peer-checked/menu:block peer-checked/menu:fixed lg:block animate-slideInLeft">
        <input
          checked={isMenuToggled}
          type="checkbox"
          title="Navigation menu"
          className={`appearance-none cursor-pointer block bg-green-950 dark:bg-black lg:hidden peer/menu fixed border rounded w-8 h-8 right-1 top-1 ${menuSvg} checked:dark:bg-neutral-500`}
          onChange={(e) => setMenuToggled(e.target.checked)}
        />
        <div className="hidden border-b border-black lg:border-none dark:border-white lg:block peer-checked/menu:fixed peer-checked/menu:top-[45px] peer-checked/menu:block peer-checked/menu:w-full peer-checked/menu:bg-zinc-700">
          <NavLinks onClick={() => setMenuToggled(false)} />
        </div>
      </div>
    </div>
  );
}
