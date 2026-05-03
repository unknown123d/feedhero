/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg:      '#0c0c0f',
        bg2:     '#141418',
        bg3:     '#1c1c22',
        bg4:     '#24242c',
        border:  '#2a2a35',
        border2: '#353545',
        text:    '#e8e8f0',
        text2:   '#9090a8',
        text3:   '#5a5a72',
        accent:  '#6c63ff',
        accent2: '#8b85ff',
        green:   '#22c55e',
        amber:   '#f59e0b',
        red:     '#ef4444',
        teal:    '#14b8a6',
      },
    },
  },
  plugins: [],
}
