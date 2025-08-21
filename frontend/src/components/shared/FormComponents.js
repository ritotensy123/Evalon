import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  Switch,
  Avatar,
  Divider,
} from '@mui/material';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../../theme/constants';

// Professional Form Field Styles
const formFieldStyles = {
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: BORDER_RADIUS.MD,
      backgroundColor: COLORS.BACKGROUND,
      transition: ANIMATIONS.SMOOTH,
      '& fieldset': {
        borderColor: COLORS.GREY_300,
        borderWidth: '1.5px',
        transition: ANIMATIONS.SMOOTH,
      },
      '&:hover fieldset': {
        borderColor: COLORS.PRIMARY,
        borderWidth: '2px',
      },
      '&.Mui-focused fieldset': {
        borderColor: COLORS.PRIMARY,
        borderWidth: '2px',
      },
      '&.Mui-error fieldset': {
        borderColor: COLORS.ERROR,
        borderWidth: '2px',
      },
    },
    '& .MuiInputLabel-root': {
      color: COLORS.TEXT_SECONDARY,
      fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM,
      fontSize: TYPOGRAPHY.FONT_SIZE_SM,
      '&.Mui-focused': {
        color: COLORS.PRIMARY,
        fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMIBOLD,
      },
      '&.Mui-error': {
        color: COLORS.ERROR,
      },
    },
    '& .MuiInputBase-input': {
      fontSize: TYPOGRAPHY.FONT_SIZE_BASE,
      fontWeight: TYPOGRAPHY.FONT_WEIGHT_REGULAR,
      color: COLORS.TEXT_PRIMARY,
      padding: '16px 20px',
      '&::placeholder': {
        color: COLORS.TEXT_DISABLED,
        opacity: 1,
      },
    },
    '& .MuiFormHelperText-root': {
      fontSize: TYPOGRAPHY.FONT_SIZE_SM,
      fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM,
      marginTop: SPACING.XS,
      '&.Mui-error': {
        color: COLORS.ERROR,
      },
    },
  },
  select: {
    '& .MuiOutlinedInput-root': {
      borderRadius: BORDER_RADIUS.MD,
      backgroundColor: COLORS.BACKGROUND,
      transition: ANIMATIONS.SMOOTH,
      '& fieldset': {
        borderColor: COLORS.GREY_300,
        borderWidth: '1.5px',
        transition: ANIMATIONS.SMOOTH,
      },
      '&:hover fieldset': {
        borderColor: COLORS.PRIMARY,
        borderWidth: '2px',
      },
      '&.Mui-focused fieldset': {
        borderColor: COLORS.PRIMARY,
        borderWidth: '2px',
      },
      '&.Mui-error fieldset': {
        borderColor: COLORS.ERROR,
        borderWidth: '2px',
      },
    },
    '& .MuiSelect-select': {
      fontSize: TYPOGRAPHY.FONT_SIZE_BASE,
      fontWeight: TYPOGRAPHY.FONT_WEIGHT_REGULAR,
      color: COLORS.TEXT_PRIMARY,
      padding: '16px 20px',
    },
  },
  menuItem: {
    fontSize: TYPOGRAPHY.FONT_SIZE_BASE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_REGULAR,
    padding: '12px 20px',
    '&:hover': {
      backgroundColor: COLORS.GREY_50,
    },
    '&.Mui-selected': {
      backgroundColor: `${COLORS.PRIMARY} !important`,
      color: COLORS.BACKGROUND,
      '&:hover': {
        backgroundColor: COLORS.PRIMARY_DARK,
      },
    },
  },
};

// Professional Button Styles
const buttonStyles = {
  primary: {
    background: COLORS.GRADIENTS.PRIMARY,
    color: COLORS.BACKGROUND,
    borderRadius: BORDER_RADIUS.MD,
    padding: '14px 28px',
    fontSize: TYPOGRAPHY.FONT_SIZE_BASE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMIBOLD,
    textTransform: 'none',
    boxShadow: SHADOWS.LG,
    transition: ANIMATIONS.SMOOTH,
    '&:hover': {
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
      boxShadow: SHADOWS.XL,
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
    '&:disabled': {
      background: COLORS.GREY_300,
      color: COLORS.TEXT_DISABLED,
      boxShadow: SHADOWS.NONE,
      transform: 'none',
    },
  },
  secondary: {
    border: `2px solid ${COLORS.PRIMARY}`,
    color: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
    padding: '12px 26px',
    fontSize: TYPOGRAPHY.FONT_SIZE_BASE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMIBOLD,
    textTransform: 'none',
    transition: ANIMATIONS.SMOOTH,
    '&:hover': {
      borderColor: COLORS.PRIMARY_DARK,
      backgroundColor: 'rgba(102, 126, 234, 0.04)',
      transform: 'translateY(-1px)',
    },
    '&:disabled': {
      borderColor: COLORS.GREY_300,
      color: COLORS.TEXT_DISABLED,
      transform: 'none',
    },
  },
  small: {
    padding: '8px 16px',
    fontSize: TYPOGRAPHY.FONT_SIZE_SM,
    borderRadius: BORDER_RADIUS.SM,
  },
};

// Professional Card Styles
const cardStyles = {
  container: {
    background: COLORS.BACKGROUND,
    borderRadius: BORDER_RADIUS.LG,
    boxShadow: SHADOWS.LG,
    border: `1px solid ${COLORS.GREY_200}`,
    padding: SPACING.XXL,
    transition: ANIMATIONS.SMOOTH,
    '&:hover': {
      boxShadow: SHADOWS.XL,
      transform: 'translateY(-2px)',
    },
  },
  section: {
    marginBottom: SPACING.XL,
    '&:last-child': {
      marginBottom: 0,
    },
  },
};

// Professional Typography Styles
const typographyStyles = {
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE_2XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    lineHeight: TYPOGRAPHY.LINE_HEIGHT_TIGHT,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE_LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
    lineHeight: TYPOGRAPHY.LINE_HEIGHT_NORMAL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE_XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  label: {
    fontSize: TYPOGRAPHY.FONT_SIZE_SM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  helper: {
    fontSize: TYPOGRAPHY.FONT_SIZE_SM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_REGULAR,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: TYPOGRAPHY.LINE_HEIGHT_NORMAL,
  },
};

// Professional Form Components
export const ProfessionalTextField = ({ 
  label, 
  error, 
  helperText, 
  startIcon, 
  endIcon, 
  ...props 
}) => (
  <TextField
    label={label}
    error={!!error}
    helperText={error || helperText}
    InputProps={{
      startAdornment: startIcon && (
        <InputAdornment position="start">
          {startIcon}
        </InputAdornment>
      ),
      endAdornment: endIcon && (
        <InputAdornment position="end">
          {endIcon}
        </InputAdornment>
      ),
    }}
    sx={formFieldStyles.textField}
    {...props}
  />
);

export const ProfessionalSelect = ({ 
  label, 
  error, 
  helperText, 
  startIcon, 
  options = [], 
  ...props 
}) => (
  <FormControl fullWidth error={!!error}>
    <InputLabel>{label}</InputLabel>
    <Select
      label={label}
      startAdornment={startIcon && (
        <InputAdornment position="start">
          {startIcon}
        </InputAdornment>
      )}
      sx={formFieldStyles.select}
      {...props}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value} sx={formFieldStyles.menuItem}>
          {option.icon && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
              {option.icon}
            </Box>
          )}
          {option.label}
        </MenuItem>
      ))}
    </Select>
    {(error || helperText) && (
      <FormHelperText sx={{ fontSize: TYPOGRAPHY.FONT_SIZE_SM, fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM }}>
        {error || helperText}
      </FormHelperText>
    )}
  </FormControl>
);

export const ProfessionalButton = ({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  ...props 
}) => (
  <Button
    variant={variant === 'primary' ? 'contained' : 'outlined'}
    sx={{
      ...buttonStyles[variant],
      ...(size === 'small' && buttonStyles.small),
    }}
    {...props}
  >
    {children}
  </Button>
);

export const ProfessionalCard = ({ children, ...props }) => (
  <Box sx={cardStyles.container} {...props}>
    {children}
  </Box>
);

export const ProfessionalSection = ({ title, subtitle, children, ...props }) => (
  <Box sx={cardStyles.section} {...props}>
    {title && (
      <Typography sx={typographyStyles.sectionTitle}>
        {title}
      </Typography>
    )}
    {subtitle && (
      <Typography sx={typographyStyles.helper}>
        {subtitle}
      </Typography>
    )}
    {children}
  </Box>
);

export const ProfessionalChip = ({ 
  label, 
  color = 'primary', 
  variant = 'filled', 
  ...props 
}) => (
  <Chip
    label={label}
    color={color}
    variant={variant}
    sx={{
      borderRadius: BORDER_RADIUS.SM,
      fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM,
      fontSize: TYPOGRAPHY.FONT_SIZE_SM,
      '&.MuiChip-colorPrimary': {
        backgroundColor: COLORS.PRIMARY,
        color: COLORS.BACKGROUND,
      },
      '&.MuiChip-colorSuccess': {
        backgroundColor: COLORS.SUCCESS,
        color: COLORS.BACKGROUND,
      },
    }}
    {...props}
  />
);

export const ProfessionalSwitch = ({ label, description, ...props }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
    <Box>
      <Typography sx={typographyStyles.label}>
        {label}
      </Typography>
      {description && (
        <Typography sx={typographyStyles.helper}>
          {description}
        </Typography>
      )}
    </Box>
    <Switch
      sx={{
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: COLORS.PRIMARY,
          '&:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.08)',
          },
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
          backgroundColor: COLORS.PRIMARY,
        },
      }}
      {...props}
    />
  </Box>
);

export const ProfessionalRadioGroup = ({ label, options = [], ...props }) => (
  <FormControl component="fieldset">
    <FormLabel component="legend" sx={typographyStyles.label}>
      {label}
    </FormLabel>
    <RadioGroup {...props}>
      {options.map((option) => (
        <FormControlLabel
          key={option.value}
          value={option.value}
          control={
            <Radio
              sx={{
                color: COLORS.GREY_400,
                '&.Mui-checked': {
                  color: COLORS.PRIMARY,
                },
              }}
            />
          }
          label={
            <Typography sx={typographyStyles.helper}>
              {option.label}
            </Typography>
          }
          sx={{
            '& .MuiFormControlLabel-label': {
              color: COLORS.TEXT_SECONDARY,
            },
          }}
        />
      ))}
    </RadioGroup>
  </FormControl>
);

export const ProfessionalCheckbox = ({ label, ...props }) => (
  <FormControlLabel
    control={
      <Checkbox
        sx={{
          color: COLORS.GREY_400,
          '&.Mui-checked': {
            color: COLORS.PRIMARY,
          },
        }}
        {...props}
      />
    }
    label={
      <Typography sx={typographyStyles.helper}>
        {label}
      </Typography>
    }
    sx={{
      '& .MuiFormControlLabel-label': {
        color: COLORS.TEXT_SECONDARY,
      },
    }}
  />
);

export const ProfessionalDivider = ({ ...props }) => (
  <Divider
    sx={{
      borderColor: COLORS.GREY_200,
      borderWidth: '1px',
      margin: `${SPACING.LG} 0`,
    }}
    {...props}
  />
);

export const ProfessionalAvatar = ({ src, alt, size = 120, ...props }) => (
  <Avatar
    src={src}
    alt={alt}
    sx={{
      width: size,
      height: size,
      border: `3px solid ${COLORS.BACKGROUND}`,
      boxShadow: SHADOWS.LG,
      ...props.sx,
    }}
    {...props}
  />
);

// Export all styles for custom usage
export {
  formFieldStyles,
  buttonStyles,
  cardStyles,
  typographyStyles,
};
