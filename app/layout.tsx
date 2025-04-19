import type { Viewport } from 'next';
import '@/app/ui/global.css';
import SideNav from './ui/common/sidenav';
import TopNav from './ui/common/topnav';
import AppLink from './ui/link';

export const viewport: Viewport = {
  //themeColor: 'black',
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="fixed top-0 left-0 h-full w-full pl-bg dark:dk-bg"></div>

        <SideNav />
        <TopNav className="flex fixed top-0 left-0 w-full">Nolan Appel - .NET Developer</TopNav>

        <div className="relative flex min-h-[93vh] bg-transparent flex-row lg:pl-[192px] lg:top-[60px] top-[50px]">
          <div className="grow">
            <main className="min-h-[85vh]">{children}</main>
            <footer className="flex justify-center border-t border-b text-black dark:text-white bg-green-100 dark:bg-neutral-900">
              <div className="m-1">
                <AppLink link="https://www.linkedin.com/in/nolanappel/" text="LinkedIn" />
              </div>
              <div>&nbsp;|&nbsp;</div>
              <div className="m-1">
                <AppLink link="https://github.com/Coreven01" text="Github" />
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
