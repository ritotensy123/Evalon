// Design System Constants
export const COLORS = {
  PRIMARY: '#667eea',
  PRIMARY_LIGHT: '#8b9ef8',
  PRIMARY_DARK: '#5a67d8',
  SECONDARY: '#764ba2',
  SECONDARY_LIGHT: '#9b6bb8',
  SECONDARY_DARK: '#6b46c1',
  SUCCESS: '#10b981',
  SUCCESS_LIGHT: '#34d399',
  SUCCESS_DARK: '#059669',
  WARNING: '#f59e0b',
  WARNING_LIGHT: '#fbbf24',
  WARNING_DARK: '#d97706',
  ERROR: '#ef4444',
  ERROR_LIGHT: '#f87171',
  ERROR_DARK: '#dc2626',
  INFO: '#3b82f6',
  INFO_LIGHT: '#60a5fa',
  INFO_DARK: '#2563eb',
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6b7280',
  TEXT_DISABLED: '#9ca3af',
  GREY_50: '#f9fafb',
  GREY_100: '#f3f4f6',
  GREY_200: '#e5e7eb',
  GREY_300: '#d1d5db',
  GREY_400: '#9ca3af',
  GREY_500: '#6b7280',
  GREY_600: '#4b5563',
  GREY_700: '#374151',
  GREY_800: '#1f2937',
  GREY_900: '#111827',
  BACKGROUND_DEFAULT: '#ffffff',
  BACKGROUND_PAPER: '#ffffff',
  BACKGROUND_SUBTLE: '#f8fafc',
};

export const TYPOGRAPHY = {
  FONT_FAMILY: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  FONT_WEIGHT_LIGHT: 300,
  FONT_WEIGHT_REGULAR: 400,
  FONT_WEIGHT_MEDIUM: 500,
  FONT_WEIGHT_SEMIBOLD: 600,
  FONT_WEIGHT_BOLD: 700,
  FONT_WEIGHT_EXTRABOLD: 800,
  FONT_SIZE_XS: '0.75rem',
  FONT_SIZE_SM: '0.875rem',
  FONT_SIZE_BASE: '1rem',
  FONT_SIZE_LG: '1.125rem',
  FONT_SIZE_XL: '1.25rem',
  FONT_SIZE_2XL: '1.5rem',
  FONT_SIZE_3XL: '1.875rem',
  FONT_SIZE_4XL: '2.25rem',
  FONT_SIZE_5XL: '3rem',
  FONT_SIZE_6XL: '3.75rem',
  LINE_HEIGHT_TIGHT: 1.1,
  LINE_HEIGHT_SNUG: 1.2,
  LINE_HEIGHT_NORMAL: 1.3,
  LINE_HEIGHT_RELAXED: 1.4,
  LINE_HEIGHT_LOOSE: 1.5,
  LINE_HEIGHT_EXTRA_LOOSE: 1.6,
  LETTER_SPACING_TIGHT: '-0.025em',
  LETTER_SPACING_NORMAL: '0em',
  LETTER_SPACING_WIDE: '0.025em',
};

export const SPACING = {
  XS: 4, // 4px
  SM: 8, // 8px
  MD: 16, // 16px
  LG: 24, // 24px
  XL: 32, // 32px
  XXL: 48, // 48px
  XXXL: 64, // 64px
  XXXXL: 80, // 80px
};

export const BORDER_RADIUS = {
  NONE: 0,
  SM: 4, // 4px
  MD: 8, // 8px
  LG: 12, // 12px
  XL: 16, // 16px
  XXL: 24, // 24px
  FULL: 9999, // Full circle
};

export const SHADOWS = {
  NONE: 'none',
  SM: '0 1px 2px rgba(0, 0, 0, 0.05)',
  MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  XXL: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

export const GRADIENTS = {
  PRIMARY: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  SECONDARY: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
  SUCCESS: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  WARNING: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  ERROR: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  INFO: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
};

export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 960,
  LG: 1280,
  XL: 1920,
};

export const ANIMATIONS = {
  DURATION_FAST: '150ms',
  DURATION_NORMAL: '300ms',
  DURATION_SLOW: '500ms',
  EASING_EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  EASING_EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
  EASING_EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
};

// Component-specific constants
export const BUTTON_SIZES = {
  SM: {
    padding: '6px 12px',
    fontSize: '0.875rem',
    borderRadius: '6px',
  },
  MD: {
    padding: '8px 16px',
    fontSize: '1rem',
    borderRadius: '8px',
  },
  LG: {
    padding: '12px 24px',
    fontSize: '1.125rem',
    borderRadius: '10px',
  },
};

export const CARD_STYLES = {
  DEFAULT: {
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    padding: '24px',
  },
  ELEVATED: {
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    padding: '32px',
  },
}; 