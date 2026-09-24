export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'ink-deep': '#050B1A',
        'institutional-purple': '#700080',
        'archive-amber': '#F59E0B',
        'ledger-paper': '#F8FAFC',
        'slate-border': '#1E293B',
      },
      fontFamily: {
        'headline': ['Newsreader', 'serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'monospace'],
      },
      spacing: {
        'gutter': '24px',
        'margin-page': '40px',
      },
      borderRadius: {
        'DEFAULT': '4px',
      },
    },
  },
  plugins: [],
}
