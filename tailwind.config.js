/** @type {import('tailwindcss').Config} */
module.exports = {
  // Disable dark mode to prevent analytics components from showing dark styles
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  // Safelist gradient classes used in avatar utility
  safelist: [
    'bg-gradient-to-br',
    'from-violet-500', 'to-purple-600',
    'from-blue-500', 'to-cyan-500',
    'from-emerald-500', 'to-teal-500',
    'from-orange-500', 'to-amber-500',
    'from-pink-500', 'to-rose-500',
    'from-indigo-500', 'to-blue-600',
    'from-teal-500', 'to-green-500',
    'from-red-500', 'to-orange-500',
    'from-fuchsia-500', 'to-pink-500',
    'from-cyan-500', 'to-blue-500',
    'from-lime-500', 'to-green-500',
    'from-amber-500', 'to-yellow-500',
    'text-white',
    'bg-gray-400',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
    },
  },
  plugins: [],
};
