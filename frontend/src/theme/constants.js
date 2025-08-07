// Evalon Design System - Constants and Design Tokens

export const COLORS = {
  // Primary Colors
  PRIMARY: '#667eea',
  PRIMARY_LIGHT: '#8b9ef8',
  PRIMARY_DARK: '#5a67d8',
  
  // Secondary Colors
  SECONDARY: '#764ba2',
  SECONDARY_LIGHT: '#9b6bb8',
  SECONDARY_DARK: '#6b46c1',
  
  // Text Colors
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6b7280',
  TEXT_DISABLED: '#9ca3af',
  
  // Background Colors
  BACKGROUND: '#ffffff',
  BACKGROUND_SUBTLE: '#f8fafc',
  
  // Grey Scale
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
  
  // Status Colors
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
};

export const TYPOGRAPHY = {
  // Font Weights
  FONT_WEIGHT_LIGHT: 300,
  FONT_WEIGHT_REGULAR: 400,
  FONT_WEIGHT_MEDIUM: 500,
  FONT_WEIGHT_SEMIBOLD: 600,
  FONT_WEIGHT_BOLD: 700,
  FONT_WEIGHT_EXTRABOLD: 800,
  
  // Font Sizes
  FONT_SIZE_XS: '0.75rem',
  FONT_SIZE_SM: '0.875rem',
  FONT_SIZE_BASE: '1rem',
  FONT_SIZE_LG: '1.125rem',
  FONT_SIZE_XL: '1.25rem',
  FONT_SIZE_2XL: '1.5rem',
  FONT_SIZE_3XL: '2rem',
  FONT_SIZE_4XL: '2.5rem',
  FONT_SIZE_5XL: '3rem',
  FONT_SIZE_6XL: '3.75rem',
  
  // Line Heights
  LINE_HEIGHT_TIGHT: 1.1,
  LINE_HEIGHT_NORMAL: 1.4,
  LINE_HEIGHT_RELAXED: 1.6,
  LINE_HEIGHT_LOOSE: 1.7,
  
  // Letter Spacing
  LETTER_SPACING_TIGHT: '-0.025em',
  LETTER_SPACING_NORMAL: '0em',
  LETTER_SPACING_WIDE: '0.1em',
};

export const SPACING = {
  // Base spacing unit: 8px
  XS: 4,    // 4px
  SM: 8,    // 8px
  MD: 16,   // 16px
  LG: 24,   // 24px
  XL: 32,   // 32px
  XXL: 48,  // 48px
  XXXL: 64, // 64px
};

export const BORDER_RADIUS = {
  SM: 8,    // 8px
  MD: 12,   // 12px
  LG: 16,   // 16px
  XL: 20,   // 20px
  XXL: 24,  // 24px
  FULL: 9999, // Full rounded
};

export const SHADOWS = {
  NONE: 'none',
  SM: '0 1px 2px rgba(0, 0, 0, 0.05)',
  MD: '0 1px 3px rgba(0, 0, 0, 0.1)',
  LG: '0 4px 12px rgba(0, 0, 0, 0.1)',
  XL: '0 8px 24px rgba(0, 0, 0, 0.15)',
  XXL: '0 20px 40px rgba(0, 0, 0, 0.2)',
};

export const GRADIENTS = {
  PRIMARY: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  LIGHT: 'linear-gradient(45deg, #f0f9ff 0%, #e0f2fe 100%)',
  WARM: 'linear-gradient(45deg, #fef3c7 0%, #fde68a 100%)',
  SUCCESS: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  ERROR: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
};

export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536,
};

export const ANIMATIONS = {
  FAST: '0.15s ease',
  NORMAL: '0.2s ease',
  SLOW: '0.3s ease',
  SMOOTH: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
  SMALL: {
    padding: '8px 16px',
    fontSize: '0.875rem',
    minHeight: 40,
    borderRadius: 12,
  },
  MEDIUM: {
    padding: '12px 24px',
    fontSize: '0.875rem',
    minHeight: 48,
    borderRadius: 16,
  },
  LARGE: {
    padding: '16px 32px',
    fontSize: '1rem',
    minHeight: 56,
    borderRadius: 20,
  },
};

export const CARD_STYLES = {
  DEFAULT: {
    borderRadius: 16,
    border: '1px solid #f3f4f6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  ELEVATED: {
    borderRadius: 16,
    border: '1px solid #f3f4f6',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  HOVER: {
    borderRadius: 16,
    border: '1px solid #667eea',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)',
  },
};

// Usage examples and best practices
export const THEME_USAGE = {
  // Color usage
  COLORS: {
    PRIMARY_ACTION: COLORS.PRIMARY,
    SECONDARY_ACTION: COLORS.SECONDARY,
    SUCCESS_STATE: COLORS.SUCCESS,
    ERROR_STATE: COLORS.ERROR,
    WARNING_STATE: COLORS.WARNING,
    INFO_STATE: COLORS.INFO,
    TEXT_HEADING: COLORS.TEXT_PRIMARY,
    TEXT_BODY: COLORS.TEXT_SECONDARY,
    BACKGROUND_MAIN: COLORS.BACKGROUND,
    BACKGROUND_ALT: COLORS.BACKGROUND_SUBTLE,
  },
  
  // Typography usage
  TYPOGRAPHY: {
    PAGE_TITLE: {
      variant: 'h1',
      fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRABOLD,
      fontSize: TYPOGRAPHY.FONT_SIZE_6XL,
    },
    SECTION_TITLE: {
      variant: 'h2',
      fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRABOLD,
      fontSize: TYPOGRAPHY.FONT_SIZE_5XL,
    },
    CARD_TITLE: {
      variant: 'h4',
      fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
      fontSize: TYPOGRAPHY.FONT_SIZE_3XL,
    },
    BODY_TEXT: {
      variant: 'body1',
      fontWeight: TYPOGRAPHY.FONT_WEIGHT_REGULAR,
      fontSize: TYPOGRAPHY.FONT_SIZE_BASE,
    },
    CAPTION: {
      variant: 'caption',
      fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM,
      fontSize: TYPOGRAPHY.FONT_SIZE_XS,
    },
  },
  
  // Spacing usage
  SPACING: {
    SECTION_PADDING: SPACING.XXL,
    CARD_PADDING: SPACING.LG,
    BUTTON_PADDING: SPACING.MD,
    TEXT_MARGIN: SPACING.SM,
  },
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  GRADIENTS,
  BREAKPOINTS,
  ANIMATIONS,
  Z_INDEX,
  BUTTON_SIZES,
  CARD_STYLES,
  THEME_USAGE,
}; 