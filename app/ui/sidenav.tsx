'use client';

import NavLinks from './nav-links';
import { useState } from 'react';

export default function SideNav() {

  const [isToggled, setMenuToggled] = useState(false);
  const menuSvg = "checked:bg-[url('/menu.svg')] bg-[url('/menu.svg')] bg-no-repeat bg-center bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)] dark:bg-[rgba(15,15,15,0.1)]";

  return (
    <div className="md:fixed sticky md:left-0 md:top-[60px] overflow-auto min-h-full md:w-58 border-r min-w-48 bg-zinc-100 dark:bg-neutral-800 bg-opacity-100 block md:bg-opacity-40 dark:md:bg-opacity-10 z-20">
      <div className="w-50 min-h-full bg-neutral-400 dark:bg-neutral-800 dark:bg-opacity-100 md:bg-opacity-0 dark:md:bg-opacity-10 peer-checked/menu:block peer-checked/menu:fixed md:block animate-slideInLeft">
        <input checked={isToggled} type="checkbox" title="Navigation menu" className={`appearance-none cursor-pointer block bg-black md:hidden peer/menu fixed border rounded w-8 h-8 right-1 top-1 ${menuSvg} checked:dark:bg-neutral-500`} onChange={e => (setMenuToggled(e.target.checked))} />
        <div className='hidden border-b border-black md:border-none dark:border-white md:block peer-checked/menu:fixed peer-checked/menu:top-100 peer-checked/menu:block peer-checked/menu:w-full peer-checked/menu:bg-zinc-700'>
          <NavLinks onClick={() => setMenuToggled(false)} />
        </div>
      </div>
    </div>
  );
}