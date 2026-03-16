/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Brand palette for MillStream ERP
                primary: {
                    50: '#fdf6ec',
                    100: '#fae8cc',
                    200: '#f4cf99',
                    300: '#ecb060',
                    400: '#e5932d',
                    500: '#d97a14',  // Main brand amber
                    600: '#b8600d',
                    700: '#8f490f',
                    800: '#743c13',
                    900: '#603314',
                },
                dark: {
                    900: '#0f0f11',
                    800: '#18181b',
                    700: '#27272a',
                    600: '#3f3f46',
                },
                success: '#22c55e',
                warning: '#f59e0b',
                danger: '#ef4444',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            },
            boxShadow: {
                card: '0 4px 24px 0 rgba(0,0,0,0.18)',
                glow: '0 0 24px 0 rgba(217,122,20,0.18)',
            },
        },
    },
    plugins: [],
    darkMode: 'class',
}
