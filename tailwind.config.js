import defaultTheme from 'tailwindcss/defaultTheme'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['src/**/*.tsx'],
  theme: {
    extend: {
      fontSize: {
        ...defaultTheme.fontSize,
        xxs: [
          '10px',
          {
            lineHeight: '16px'
          }
        ]
      }
    }
  },
  plugins: []
}
