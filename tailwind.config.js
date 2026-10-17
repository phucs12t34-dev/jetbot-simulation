/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nvidia: {
          green: "#76B900",
          glow: "#8ae400",
          dark: "#0a1100",
          card: "#121816",
        },
        cyber: {
          bg: "#0A0E13",
          surface: "#111822",
          card: "#182330",
          border: "#233346",
          accent: "#00E5FF",
          warning: "#FFB020",
          danger: "#FF3366",
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(118, 185, 0, 0.4), 0 0 10px rgba(118, 185, 0, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(118, 185, 0, 0.8), 0 0 30px rgba(118, 185, 0, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
