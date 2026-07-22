import { createTheme } from '@mui/material/styles';

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
    secondary: { main: '#34C759', light: '#D1FAE5', dark: '#065F46' },
    success: { main: '#34C759', light: '#D1FAE5', dark: '#065F46' },
    warning: { main: '#FF9F0A', light: '#FEF3C7', dark: '#92400E' },
    error: { main: '#FF3B30', light: '#FEE2E2', dark: '#991B1B' },
    info: { main: '#5AC8FA', light: '#DBEAFE', dark: '#1E40AF' },
    ...(mode === 'dark'
      ? {
          background: { default: '#0F0F12', paper: '#1A1A1E' },
          text: { primary: '#F5F5F7', secondary: '#98989D', disabled: '#48484E' },
          divider: 'rgba(255, 255, 255, 0.06)',
        }
      : {
          background: { default: '#F5F5F7', paper: '#FFFFFF' },
          text: { primary: '#1D1D1F', secondary: '#86868B', disabled: '#C7C7CC' },
          divider: 'rgba(0, 0, 0, 0.06)',
        }),
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.01em', textTransform: 'uppercase', color: '#86868B' },
    body2: { fontSize: '0.8125rem' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: mode === 'dark' ? '#48484E transparent' : '#C7C7CC transparent',
        },
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes scaleIn': {
          from: { opacity: 0, transform: 'scale(0.95)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        '@keyframes slideUp': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        '@keyframes glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.05)' },
          '50%': { boxShadow: '0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1)' },
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        '@keyframes spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          padding: '8px 22px',
          fontSize: '0.875rem',
          transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)',
            transform: 'translateY(-2px) scale(1.02)',
          },
        },
        outlined: {
          '&:hover': { transform: 'translateY(-2px)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid',
          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'dark'
              ? '0 8px 30px rgba(0,0,0,0.3)'
              : '0 8px 30px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              },
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '12px 16px', fontSize: '0.875rem' },
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#86868B',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500, fontSize: '0.75rem' },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepLabel-label': { fontSize: '0.875rem', fontWeight: 500 },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
        standardSuccess: {
          backgroundColor: mode === 'dark' ? 'rgba(52, 199, 89, 0.15)' : '#D1FAE5',
        },
        standardError: {
          backgroundColor: mode === 'dark' ? 'rgba(255, 59, 48, 0.15)' : '#FEE2E2',
        },
        standardWarning: {
          backgroundColor: mode === 'dark' ? 'rgba(255, 159, 10, 0.15)' : '#FEF3C7',
        },
        standardInfo: {
          backgroundColor: mode === 'dark' ? 'rgba(90, 200, 250, 0.15)' : '#DBEAFE',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          borderRight: '1px solid',
          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          backgroundColor: mode === 'dark' ? '#1A1A1E' : '#FFFFFF',
          color: mode === 'dark' ? '#F5F5F7' : '#1D1D1F',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { borderRadius: 8, fontSize: '0.75rem' } },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: { '& .MuiAlert-root': { borderRadius: 12 } },
      },
    },
  },
});

export const getTheme = (mode) => createTheme(getDesignTokens(mode));
