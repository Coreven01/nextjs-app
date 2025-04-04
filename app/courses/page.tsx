import { Metadata } from 'next';
import ReduxHome from '../ui/courses/home';

export const metadata: Metadata = {
  title: 'Nolan Appel | Bomb Seeker Example'
};

export default function Page() {
  return <ReduxHome />;
}
