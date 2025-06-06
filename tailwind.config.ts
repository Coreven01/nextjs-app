import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  safelist: [
    'rotate-[-10deg],rotate-[-5deg],rotate-[10deg],rotate-[5deg]',
    'translate-y-[-10px],translate-y-[-15px],translate-y-[10px],translate-y-[15px],translate-y-[25px]',
    'translate-x-[-10px],translate-x-[-15px],translate-x-[10px],translate-x-[15px]',
    'translate-x-[60px],translate-x-[30px],translate-x-[-60px],translate-x-[-30px],',
    'translate-y-[60px],translate-y-[30px],translate-y-[-60px],translate-y-[-30px],'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        wooden1: "url('/wooden/wooden-2.jpg'),url('/wooden/wooden-3.jpg')",
        wooden2: "url('/wooden/wooden-1.jpg'),url('/wooden/wooden-4.jpg')",
        wooden3: "url('/wooden/wooden-5.jpg'),url('/wooden/wooden-6.jpg')"
      },
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))'
      },
      boxShadow: {
        'custom-gray': '2px 2px 1px darkgray',
        'custom-black': '2px 2px 1px black'
      },
      transitionDuration: {
        '150': '150ms'
      },
      animation: {
        slideInRight: 'slideInRight 0.15s ease-out',
        slideInLeft: 'slideInLeft 0.15s ease-out',
        slideInTop: 'slideInTop 0.75s ease-out',
        wave: 'wave 20s ease-in-out infinite'
      },
      keyframes: {
        wave: {
          '0%': {
            'background-position': '0% 0%'
          },
          '25%': {
            'background-position': '75% 75%'
          },
          '50%': {
            'background-position': '50% 50%'
          },
          '75%': {
            'background-position': '25% 25%'
          },
          '100%': {
            'background-position': '0% 0%'
          }
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-200px)' },
          '100%': { transform: 'translateX(0px)' }
        },
        slideInTop: {
          '0%': { transform: 'translateY(-40px)' },
          '25%': { transform: 'translateY(-20px)' },
          '50%': { transform: 'translateY(-8px)' },
          '75%': { transform: 'translateY(-3px)' },
          '100%': { transform: 'translateY(0px)' }
        },
        shimmer: {
          '100%': {
            transform: 'translateX(100%)'
          }
        }
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)'
      }
    }
  },
  plugins: [forms]
} satisfies Config;
