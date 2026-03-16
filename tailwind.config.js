/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  safelist: [
    // Onyx
    'bg-onyx', 'text-onyx', 'border-onyx',
    'bg-onyx/10', 'bg-onyx/20', 'bg-onyx/30',
    'text-onyx/70', 'text-onyx/80', 'text-onyx/55',
    // Champagne
    'bg-champagne', 'text-champagne', 'border-champagne',
    'bg-champagne/10', 'bg-champagne/15', 'bg-champagne/20',
    'border-champagne/20', 'border-champagne/30', 'border-champagne/35', 'border-champagne/40',
    'text-champagne/70', 'text-champagne/80',
    // Blush
    'bg-blush', 'text-blush', 'border-blush',
    'bg-blush/10', 'bg-blush/20',
    // Ivory
    'bg-ivory', 'text-ivory', 'border-ivory',
    // Stone
    'bg-stone', 'text-stone', 'border-stone',
    // Sage
    'bg-sage', 'text-sage', 'border-sage',
    'bg-sage/10', 'bg-sage/08', 'bg-sage/[0.08]', 'bg-sage/15',
    'border-sage/20', 'border-sage/25', 'border-sage/30',
    'hover:bg-sage', 'hover:text-sage', 'hover:border-sage',
    'hover:bg-sage/15',
  ],
  theme: {
    extend: {
      colors: {
        onyx: '#0D0D0D',
        champagne: '#C9A96E',
        blush: '#E8C4B8',
        ivory: '#FAF8F5',
        stone: '#8C8279',
        sage: '#4A6741',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        accent: ['DM Serif Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(13,13,13,.08), 0 1px 2px rgba(13,13,13,.06)',
        'md': '0 4px 12px rgba(13,13,13,.10), 0 2px 6px rgba(13,13,13,.06)',
        'lg': '0 8px 24px rgba(13,13,13,.14), 0 4px 10px rgba(13,13,13,.08)',
        'featured': '0 0 0 3px rgba(201,169,110,.08), 0 4px 12px rgba(13,13,13,.10)',
        'featured-hover': '0 0 0 3px rgba(201,169,110,.15), 0 8px 24px rgba(13,13,13,.14)',
      },
    },
  },
  plugins: [],
}
