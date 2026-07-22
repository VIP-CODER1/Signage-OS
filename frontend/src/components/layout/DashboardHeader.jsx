import { Box, TextField, IconButton, Badge } from '@mui/material';
import { Search, LightMode, DarkMode, Notifications } from '@mui/icons-material';
import { useThemeMode } from '../../context/ThemeContext';

export default function DashboardHeader() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        px: { xs: 2, md: 0 },
      }}
    >
      <TextField
        placeholder="Search anything..."
        size="small"
        InputProps={{
          startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
        sx={{ minWidth: 300, bgcolor: 'background.paper', borderRadius: 2 }}
      />
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <IconButton size="small" onClick={toggleMode}>
          {mode === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>
        <IconButton size="small">
          <Badge badgeContent={3} color="error">
            <Notifications />
          </Badge>
        </IconButton>
      </Box>
    </Box>
  );
}
