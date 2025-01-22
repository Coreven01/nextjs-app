'use client';

import NavLinks from './nav-links';
import { useState } from 'react';

export default function SideNav() {

  const [isToggled, setMenuToggled] = useState(false);
  const menuSvg = "bg-[url('/menu.svg')] bg-no-repeat bg-center bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)] dark:bg-[rgba(15,15,15,0.1)]";

  const toggleMode = () => {
    setMenuToggled(!isToggled);
    console.log('toggle menu: ', isToggled);
  };

  return (
    <div className="md:flex-h-full border-r bg-zinc-100 dark:bg-neutral-800 bg-opacity-100 md:bg-opacity-40 dark:md:bg-opacity-10 md:w-64">
      <input checked={isToggled} type="checkbox" title="Navigation menu" className={`block bg-black md:hidden peer/menu absolute border rounded appearance-none cursor-pointer w-9 h-9 right-1 top-1 ${menuSvg}`} onChange={e => (setMenuToggled(e.target.checked))} />
      <div>
      </div>
      <div className='hidden fixed bg-black h-full w-full bg-opacity-20 peer-checked/menu:block' onClick={() => setMenuToggled(false)}>
      </div>
      <div className="hidden w-60 min-h-full bg-neutral-400 dark:bg-neutral-800 dark:bg-opacity-100 md:bg-opacity-0 dark:md:bg-opacity-10 peer-checked/menu:block peer-checked/menu:fixed md:block animate-slideInLeft">
        <div className="">
          <nav className="flex-column">
                <div className='flex flex-row md:hidden'>
                  <div className='bg-zinc-200 dark:bg-neutral-900 flex flex-grow text-xl text-black dark:text-white items-center p-3'>
                    Menu
                  </div>
                </div>       
                <NavLinks onClick={() => setMenuToggled(false)} />
            </nav>
        </div>  
      </div>
    </div>
  );
}