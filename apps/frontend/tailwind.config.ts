import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)',
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'medium': 'var(--shadow-medium)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'slide-out-1': {
					from: {
						transform: 'translateX(0) scale(0)',
						opacity: '0'
					},
					to: {
						transform: 'translateX(-44px) scale(1)',
						opacity: '1'
					}
				},
				'slide-out-2': {
					from: {
						transform: 'translateX(0) scale(0)',
						opacity: '0'
					},
					to: {
						transform: 'translateX(-88px) scale(1)',
						opacity: '1'
					}
				},
				'slide-out-3': {
					from: {
						transform: 'translateX(0) scale(0)',
						opacity: '0'
					},
					to: {
						transform: 'translateX(-132px) scale(1)',
						opacity: '1'
					}
				},
				'slide-in-1': {
					from: {
						transform: 'translateX(-44px) scale(1)',
						opacity: '1'
					},
					to: {
						transform: 'translateX(0) scale(0)',
						opacity: '0'
					}
				},
				'slide-in-2': {
					from: {
						transform: 'translateX(-88px) scale(1)',
						opacity: '1'
					},
					to: {
						transform: 'translateX(0) scale(0)',
						opacity: '0'
					}
				},
				'slide-in-3': {
					from: {
						transform: 'translateX(-132px) scale(1)',
						opacity: '1'
					},
					to: {
						transform: 'translateX(0) scale(0)',
						opacity: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-out-1': 'slide-out-1 0.2s ease-out forwards',
				'slide-out-2': 'slide-out-2 0.25s ease-out forwards',
				'slide-out-3': 'slide-out-3 0.3s ease-out forwards',
				'slide-in-1': 'slide-in-1 0.15s ease-in forwards',
				'slide-in-2': 'slide-in-2 0.1s ease-in forwards',
				'slide-in-3': 'slide-in-3 0.05s ease-in forwards'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
