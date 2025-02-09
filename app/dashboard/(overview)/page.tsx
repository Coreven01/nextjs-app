import { Metadata } from 'next';
import DashboardPage from '@/app/ui/dashboard/dashboard-page';

export const metadata: Metadata = {
  title: 'Nolan Appel | Dashboard Example',
};

export default async function Page() {

  return (<DashboardPage />);
}