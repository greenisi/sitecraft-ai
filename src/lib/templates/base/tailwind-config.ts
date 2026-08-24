import type { DesignSystem } from '@/types/project';

export function generateTailwindConfig(designSystem: DesignSystem): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: ${JSON.stringify(designSystem.colors.primary, null, 8)},
        secondary: ${JSON.stringify(designSystem.colors.secondary, null, 8)},
        accent: ${JSON.stringify(designSystem.colors.accent, null, 8)},
        neutral: ${JSON.stringify(designSystem.colors.neutral, null, 8)},
      },
      fontFamily: {
        heading: ['${designSystem.typography.headingFont}', 'sans-serif'],
        body: ['${designSystem.typography.bodyFont}', 'sans-serif'],
      },
      borderRadius: ${JSON.stringify(designSystem.borderRadius, null, 8)},
      boxShadow: ${JSON.stringify(designSystem.shadows, null, 8)},
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-150%)' },
          '100%': { transform: 'translateX(150%)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        kenburns: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(8px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'bounce-in': 'bounceIn 0.6s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease-in-out infinite',
        'kenburns': 'kenburns 16s ease-out forwards',
        'marquee': 'marquee 32s linear infinite',
        'blur-in': 'blurIn 0.9s ease-out forwards',
        'rise-in': 'riseIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'spin-slow': 'spinSlow 20s linear infinite',
      },
    },
  },
  plugins: [],
};
`;
}
