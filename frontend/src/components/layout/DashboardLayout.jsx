import { Box, useTheme, IconButton } from '@mui/material';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useThemeMode } from '../../context/ThemeContext';

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

export default function DashboardLayout({ children, showHeader = true }) {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();

  const renderHeader = () => {
    if (showHeader === 'full') {
      return <DashboardHeader />;
    }
    if (showHeader === 'simple') {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <IconButton size="small" onClick={toggleMode}>
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 2, md: 4 },
          overflow: 'auto',
          animation: 'fadeIn 0.3s ease',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            inset: 0,
            background: NOISE,
            pointerEvents: 'none',
            zIndex: 9999,
            mixBlendMode: theme.palette.mode === 'dark' ? 'overlay' : 'multiply',
            opacity: theme.palette.mode === 'dark' ? 0.3 : 1,
          },
        }}
      >
        {renderHeader()}
        {children}
      </Box>
    </Box>
  );
}
