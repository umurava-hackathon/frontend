import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEF4FF',
          100: '#D9E7FF',
          200: '#BBCFFF',
          300: '#8CAEFC',
          400: '#5D8DF8',
          500: '#2B71F0',
          600: '#1A5CE0',
          700: '#1547C0',
          800: '#1238A0',
          900: '#0D2870',
        },
        neutral: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        success: '#16A34A',
        successLight: '#DCFCE7',
        warning: '#D97706',
        warningLight: '#FEF9C3',
        danger:  '#DC2626',
        dangerLight: '#FEE2E2',
      },
      fontFamily: { 
        sans: ['Inter', 'system-ui', 'sans-serif'] 
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        dropdown: '0 4px 16px rgba(0,0,0,0.12)',
        soft: "0 10px 30px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;

