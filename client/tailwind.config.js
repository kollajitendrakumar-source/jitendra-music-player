/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        surface: '#ffffff',
        'surface-hover': '#f1f5f9',
        'surface-active': '#e2e8f0',
        border: '#e2e8f0',
        muted: '#64748b',
        accent: {
          DEFAULT: '#000000',
          hover: '#1e293b',
          light: '#334155',
          muted: 'rgba(0, 0, 0, 0.06)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

