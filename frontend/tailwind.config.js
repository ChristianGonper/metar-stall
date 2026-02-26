/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      colors: {
        // Single accent system — blue
        accent: {
          DEFAULT: '#3b82f6',  // blue-500
          hi: '#60a5fa', // blue-400
          lo: '#1d4ed8', // blue-700
          bg: 'rgba(59,130,246,0.10)',
          border: 'rgba(59,130,246,0.22)',
        },
        // Surface system
        surface: {
          0: '#09090b', // page bg
          1: '#111116', // card
          2: '#18181f', // elevated card
        },
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}
