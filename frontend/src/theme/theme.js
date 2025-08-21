import { createTheme } from '@mui/material/styles';

// Evalon Design System - Complete Theme Configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea', // Primary brand color
      light: '#8b9ef8',
      dark: '#5a67d8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2', // Secondary brand color
      light: '#9b6bb8',
      dark: '#6b46c1',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      subtle: '#f8fafc',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      disabled: '#9ca3af',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3.75rem',
      lineHeight: 1.1,
      letterSpacing: '-0.025em',
      color: '#111827',
    },
    h2: {
      fontWeight: 800,
      fontSize: '3rem',
      lineHeight: 1.1,
      letterSpacing: '-0.025em',
      color: '#111827',
    },
    h3: {
      fontWeight: 800,
      fontSize: '2.5rem',
      lineHeight: 1.1,
      letterSpacing: '-0.025em',
      color: '#111827',
    },
    h4: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
      color: '#111827',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: '#111827',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: '#111827',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#6b7280',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#6b7280',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8, // 8px base unit
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 16,
          padding: '12px 24px',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 48,
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            transform: 'translateY(-1px)',
          },
        },
        sizeLarge: {
          padding: '16px 32px',
          fontSize: '1rem',
          minHeight: 56,
          borderRadius: 20,
        },
        sizeSmall: {
          padding: '8px 16px',
          fontSize: '0.875rem',
          minHeight: 40,
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderRadius: 16,
          border: '1px solid #f3f4f6',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#667eea',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#667eea',
              borderWidth: '2px',
            },
          },
          '& .MuiFormHelperText-root': {
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginTop: 4,
            '&.Mui-error': {
              color: '#ef4444',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 600,
          fontSize: '0.875rem',
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiFormHelperText-root': {
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginTop: 4,
            '&.Mui-error': {
              color: '#ef4444',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#111827',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default theme;

// Theme Usage Guide:
/*
Evalon Design System - Theme Usage Guide

1. COLORS:
   - Primary: #667eea (Main brand color)
   - Secondary: #764ba2 (Accent color)
   - Text Primary: #111827 (Dark text)
   - Text Secondary: #6b7280 (Muted text)
   - Background: #ffffff (White background)
   - Background Subtle: #f8fafc (Light gray background)

2. TYPOGRAPHY:
   - Headlines: Use h1-h6 variants with proper weights
   - Body: Use body1/body2 for regular text
   - Buttons: Use button variant for button text
   - Captions: Use caption for small labels

3. SPACING:
   - Base unit: 8px
   - Use theme.spacing() for consistent spacing
   - Common values: 1(8px), 2(16px), 3(24px), 4(32px)

4. BORDER RADIUS:
   - Small: 8px (theme.shape.borderRadius)
   - Medium: 12px
   - Large: 16px
   - Extra Large: 20px

5. SHADOWS:
   - Light: 0 1px 3px rgba(0,0,0,0.1)
   - Medium: 0 4px 12px rgba(0,0,0,0.1)
   - Heavy: 0 8px 24px rgba(0,0,0,0.15)

6. GRADIENTS:
   - Primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
   - Light: linear-gradient(45deg, #f0f9ff 0%, #e0f2fe 100%)
   - Warm: linear-gradient(45deg, #fef3c7 0%, #fde68a 100%)

7. COMPONENT USAGE:
   - Always use theme.palette for colors
   - Use theme.typography for text styles
   - Use theme.spacing for consistent spacing
   - Use theme.breakpoints for responsive design

8. RESPONSIVE DESIGN:
   - xs: 0-600px (Mobile)
   - sm: 600-900px (Tablet)
   - md: 900-1200px (Desktop)
   - lg: 1200-1536px (Large Desktop)
   - xl: 1536px+ (Extra Large)

9. ANIMATIONS:
   - Standard: 0.2s ease
   - Smooth: 0.3s ease
   - Hover effects: translateY(-1px) to (-2px)

10. CONSISTENCY RULES:
    - Always use theme colors, never hardcode
    - Use consistent border radius values
    - Maintain consistent spacing patterns
    - Follow typography hierarchy
    - Use consistent shadow patterns
*/ 