/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0c0c0c',
          'bg-secondary': '#1a1a1a',
          'bg-tertiary': '#2d2d2d',
          text: '#e0e0e0',
          'text-muted': '#a0a0a0',
          'text-dim': '#606060',
          green: '#00ff88',
          purple: '#ff79c6',
          blue: '#8be9fd',
          yellow: '#f1fa8c',
          orange: '#ffb86c',
          red: '#ff5555',
          cyan: '#50fa7b',
          border: '#404040',
          'border-active': '#606060',
          selection: '#44475a',
        }
      },
      fontFamily: {
        'mono': ['monospace'],
      },
      fontSize: {
        'terminal': ['14px', '20px'],
        'terminal-sm': ['12px', '18px'],
        'terminal-lg': ['16px', '24px'],
      },
    },
  },
  plugins: [],
};
