# Evalon Design System - Theme Documentation

## 🎨 Overview

This document outlines the complete design system for the Evalon SaaS Platform. All components, pages, and UI elements must follow this design system for consistency.

## 📁 File Structure

```
src/theme/
├── theme.js          # Main Material-UI theme configuration
├── constants.js      # Design tokens and constants
└── README.md         # This documentation
```

## 🎯 Core Design Principles

1. **Consistency**: Use theme values, never hardcode colors or spacing
2. **Accessibility**: Maintain proper contrast ratios and touch targets
3. **Responsiveness**: Design for all screen sizes from mobile to desktop
4. **Modern**: Clean, professional, and contemporary design
5. **Scalable**: Easy to maintain and extend

## 🎨 Color Palette

### Primary Colors
- **Primary**: `#667eea` - Main brand color for primary actions
- **Primary Light**: `#8b9ef8` - Hover states and highlights
- **Primary Dark**: `#5a67d8` - Active states and emphasis

### Secondary Colors
- **Secondary**: `#764ba2` - Accent color for secondary actions
- **Secondary Light**: `#9b6bb8` - Secondary hover states
- **Secondary Dark**: `#6b46c1` - Secondary active states

### Text Colors
- **Text Primary**: `#111827` - Main text color
- **Text Secondary**: `#6b7280` - Secondary text color
- **Text Disabled**: `#9ca3af` - Disabled text color

### Background Colors
- **Background**: `#ffffff` - Main background
- **Background Subtle**: `#f8fafc` - Alternative background

### Status Colors
- **Success**: `#10b981` - Success states and confirmations
- **Warning**: `#f59e0b` - Warning states and alerts
- **Error**: `#ef4444` - Error states and notifications
- **Info**: `#3b82f6` - Information states and tips

## 📝 Typography

### Font Family
- **Primary**: Inter (with Roboto, Helvetica, Arial fallbacks)

### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700
- **Extrabold**: 800

### Font Sizes
- **XS**: 0.75rem (12px)
- **SM**: 0.875rem (14px)
- **Base**: 1rem (16px)
- **LG**: 1.125rem (18px)
- **XL**: 1.25rem (20px)
- **2XL**: 1.5rem (24px)
- **3XL**: 2rem (32px)
- **4XL**: 2.5rem (40px)
- **5XL**: 3rem (48px)
- **6XL**: 3.75rem (60px)

### Typography Variants
- **h1**: Page titles (3.75rem, 800 weight)
- **h2**: Section titles (3rem, 800 weight)
- **h3**: Subsection titles (2.5rem, 800 weight)
- **h4**: Card titles (2rem, 700 weight)
- **h5**: Small titles (1.5rem, 600 weight)
- **h6**: Micro titles (1.25rem, 600 weight)
- **body1**: Main text (1rem, 400 weight)
- **body2**: Secondary text (0.875rem, 400 weight)
- **button**: Button text (0.875rem, 600 weight)
- **caption**: Small labels (0.75rem, 500 weight)

## 📏 Spacing System

### Base Unit: 8px

- **XS**: 4px (0.5rem)
- **SM**: 8px (1rem)
- **MD**: 16px (2rem)
- **LG**: 24px (3rem)
- **XL**: 32px (4rem)
- **XXL**: 48px (6rem)
- **XXXL**: 64px (8rem)

### Usage
```javascript
// Use theme.spacing() for consistent spacing
sx={{ padding: theme.spacing(2) }} // 16px
sx={{ margin: theme.spacing(1, 2) }} // 8px top/bottom, 16px left/right
```

## 🔲 Border Radius

- **SM**: 8px - Small elements
- **MD**: 12px - Default (theme.shape.borderRadius)
- **LG**: 16px - Cards and containers
- **XL**: 20px - Large buttons
- **XXL**: 24px - Large containers
- **FULL**: 9999px - Fully rounded

## 🌟 Shadows

- **NONE**: No shadow
- **SM**: `0 1px 2px rgba(0, 0, 0, 0.05)` - Subtle elevation
- **MD**: `0 1px 3px rgba(0, 0, 0, 0.1)` - Default elevation
- **LG**: `0 4px 12px rgba(0, 0, 0, 0.1)` - Medium elevation
- **XL**: `0 8px 24px rgba(0, 0, 0, 0.15)` - High elevation
- **XXL**: `0 20px 40px rgba(0, 0, 0, 0.2)` - Maximum elevation

## 🎨 Gradients

- **Primary**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Light**: `linear-gradient(45deg, #f0f9ff 0%, #e0f2fe 100%)`
- **Warm**: `linear-gradient(45deg, #fef3c7 0%, #fde68a 100%)`
- **Success**: `linear-gradient(135deg, #10b981 0%, #059669 100%)`
- **Error**: `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`

## 📱 Breakpoints

- **XS**: 0-600px (Mobile)
- **SM**: 600-900px (Tablet)
- **MD**: 900-1200px (Desktop)
- **LG**: 1200-1536px (Large Desktop)
- **XL**: 1536px+ (Extra Large)

## ⚡ Animations

- **FAST**: 0.15s ease
- **NORMAL**: 0.2s ease (default)
- **SLOW**: 0.3s ease
- **SMOOTH**: 0.3s cubic-bezier(0.4, 0, 0.2, 1)

## 🧩 Component Guidelines

### Buttons
```javascript
// Use theme button styles
<Button variant="contained" size="large">
  Primary Action
</Button>

// Custom styling
sx={{
  background: GRADIENTS.PRIMARY,
  borderRadius: BORDER_RADIUS.XL,
  boxShadow: SHADOWS.LG,
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: SHADOWS.XL,
  }
}}
```

### Cards
```javascript
// Use theme card styles
<Card sx={CARD_STYLES.DEFAULT}>
  <CardContent>
    Content
  </CardContent>
</Card>

// Hover effect
sx={{
  ...CARD_STYLES.DEFAULT,
  '&:hover': CARD_STYLES.HOVER,
  transition: ANIMATIONS.SMOOTH,
}}
```

### Typography
```javascript
// Use theme typography
<Typography variant="h1" sx={{ color: COLORS.TEXT_PRIMARY }}>
  Page Title
</Typography>

<Typography variant="body1" sx={{ color: COLORS.TEXT_SECONDARY }}>
  Body text
</Typography>
```

## 📋 Usage Examples

### Importing Constants
```javascript
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../theme/constants';
```

### Using Theme in Components
```javascript
import { useTheme } from '@mui/material/styles';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(3),
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[1],
    }}>
      Content
    </Box>
  );
};
```

### Responsive Design
```javascript
sx={{
  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
  padding: { xs: 2, sm: 3, md: 4 },
  flexDirection: { xs: 'column', sm: 'row' },
}}
```

## ✅ Best Practices

1. **Always use theme values** - Never hardcode colors, spacing, or typography
2. **Follow responsive patterns** - Design for all screen sizes
3. **Maintain consistency** - Use the same patterns across components
4. **Test accessibility** - Ensure proper contrast and touch targets
5. **Document custom components** - Add comments for complex styling
6. **Use semantic naming** - Choose meaningful variable names
7. **Optimize performance** - Avoid unnecessary re-renders

## 🔧 Customization

To modify the theme:

1. Update `theme.js` for Material-UI theme changes
2. Update `constants.js` for design token changes
3. Update this documentation
4. Test across all components
5. Ensure accessibility compliance

## 📚 Resources

- [Material-UI Theme Documentation](https://mui.com/material-ui/customization/theme/)
- [Inter Font](https://rsms.me/inter/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Remember**: Consistency is key! Always use the theme system for all styling decisions. 