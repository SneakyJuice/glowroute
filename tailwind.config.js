/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1B2A4A', mid: '#243459' },
        teal: { DEFAULT: '#028090', light: '#02C39A' },
        cream: { DEFAULT: '#FBF7F0', dark: '#F2ECE1' },
        gold: '#E8A838',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(27,42,74,.08), 0 1px 2px rgba(27,42,74,.06)',
        'md': '0 4px 12px rgba(27,42,74,.10), 0 2px 6px rgba(27,42,74,.06)',
        'lg': '0 8px 24px rgba(27,42,74,.14), 0 4px 10px rgba(27,42,74,.08)',
        'featured': '0 0 0 3px rgba(232,168,56,.08), 0 4px 12px rgba(27,42,74,.10)',
        'featured-hover': '0 0 0 3px rgba(232,168,56,.15), 0 8px 24px rgba(27,42,74,.14)',
      },
    },
  },
  plugins: [],
}
