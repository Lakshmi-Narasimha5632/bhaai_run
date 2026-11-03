/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          gold: '#FFD700',
          orange: '#FF6B00',
          pink: '#FF007F',
          cyan: '#00E5FF',
          purple: '#8A2BE2',
          neon: '#39FF14',
          dark: '#0D0E15',
          card: '#16192B',
        }
      },
      fontFamily: {
        game: ['"Fredoka"', '"Titan One"', 'system-ui', 'sans-serif'],
        comic: ['"Bungee"', 'cursive', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 4s linear infinite',
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        }
      }
    },
  },
  plugins: [],
}

