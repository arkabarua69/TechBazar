const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    extend: {
      colors: {
        // Peach/Orange design system
        peach:   '#FAE5D3',
        cloud:   '#FFFFFF',
        line:    '#F2D9C8',
        primary: {
          accent:    '#E84B0F',
          hover:     '#C63E0A',
          light:     '#FFF0EB',
          orange:    '#E84B0F',
          green:     '#16a34a',
          lightGreen:'#16a34a',
          yellow:    '#f59e0b',
          darkBlue:  '#1e1b18',
          grey:      '#7a6f67',
          blue:      '#E84B0F',
        },
      },
      fontFamily: {
        sans:    ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        xxs: ['11px', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card:       '0 4px 24px -4px rgba(232,75,15,0.10), 0 1px 3px rgba(0,0,0,0.06)',
        'card-hover':'0 8px 32px -4px rgba(232,75,15,0.18), 0 2px 6px rgba(0,0,0,0.08)',
        form:       '0 8px 40px -8px rgba(232,75,15,0.14), 0 2px 8px rgba(0,0,0,0.06)',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 18s linear infinite',
      },
    },
  },
  plugins: [],
};
