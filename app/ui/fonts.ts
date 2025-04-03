import { Inter, Lusitana, Chakra_Petch, Orbitron } from 'next/font/google';

export const orbitron = Orbitron({
  weight: '400',
  subsets: ['latin']
});

export const lusitana = Lusitana({
  weight: ['400', '700'],
  subsets: ['latin']
});

export const inter = Inter({
  weight: '400',
  subsets: ['latin'],
  style: 'normal'
});

export const chakraPetch = Chakra_Petch({
  weight: '400',
  subsets: ['latin']
});
