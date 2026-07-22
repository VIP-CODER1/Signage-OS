import { Box, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeMode } from '../../context/ThemeContext';

export default function AppHeader({ title, subtitle, actions }) {
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        animation: 'fadeIn 0.3s ease',
        pb: 2,
        borderBottom: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 3,
              height: 28,
              borderRadius: 2,
              background: 'linear-gradient(180deg, #6366F1, #8B5CF6)',
            }}
          />
          <Box>
            <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.15 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {actions}
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton
            onClick={toggleMode}
            size="small"
            sx={{
              color: 'text.secondary',
              transition: 'all 0.2s ease',
              '&:hover': { color: 'primary.main', bgcolor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)' },
            }}
          >
            {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
