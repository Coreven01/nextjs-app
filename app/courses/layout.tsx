import ReduxNav from '../ui/courses/topnav';

export default function ReduxLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="p-5 m-2 rounded-lg bg-orange-200">
      <ReduxNav />
      <div>{children}</div>
    </div>
  );
}
