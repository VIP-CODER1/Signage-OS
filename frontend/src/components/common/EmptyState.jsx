import { Box, Typography, Button, useTheme } from '@mui/material';
import { Inbox } from '@mui/icons-material';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      py={8}
      sx={{
        textAlign: 'center',
        animation: 'fadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2.5,
        }}
      >
        <Box sx={{ color: 'text.disabled', fontSize: 36 }}>
          {icon || <Inbox sx={{ fontSize: 36 }} />}
        </Box>
      </Box>
      <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: 'text.primary' }}>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" mb={3} maxWidth={400} mx="auto">
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            borderRadius: 2,
            px: 4,
            '&:hover': { transform: 'translateY(-1px)' },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
