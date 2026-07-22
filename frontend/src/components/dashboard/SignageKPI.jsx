import { Card, CardContent, Box, Typography, useTheme } from '@mui/material';
import { Devices, CheckCircle, Build, Cancel, LocationOn } from '@mui/icons-material';

const iconMap = {
  total: { icon: <Devices />, colorKey: 'primary' },
  active: { icon: <CheckCircle />, colorKey: 'success' },
  maintenance: { icon: <Build />, colorKey: 'warning' },
  inactive: { icon: <Cancel />, colorKey: 'error' },
  locations: { icon: <LocationOn />, colorKey: 'info' },
};

export default function SignageKPI({ title, value, change, type, subtitle }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { icon, colorKey } = iconMap[type] || iconMap.total;
  const color = theme.palette[colorKey]?.main || theme.palette.primary.main;

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDark
            ? '0 8px 30px rgba(0,0,0,0.3)'
            : '0 8px 30px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Box sx={{ color, fontSize: 28 }}>{icon}</Box>
        </Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                color: change.includes('+') ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {change}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
