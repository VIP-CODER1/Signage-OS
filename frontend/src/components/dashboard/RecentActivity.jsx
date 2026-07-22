import { Card, CardContent, Typography, Box, List, ListItem, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import { Add, Edit, WifiOff } from '@mui/icons-material';

const STATUS_COLORS = {
  INACTIVE: 'error',
  MAINTENANCE: 'warning',
  ACTIVE: 'success',
};

const STATUS_ICONS = {
  INACTIVE: <WifiOff />,
  MAINTENANCE: <Edit />,
  ACTIVE: <Add />,
};

const STATUS_LABELS = {
  INACTIVE: 'Display inactive',
  MAINTENANCE: 'Display in maintenance',
  ACTIVE: 'Display active',
};

export default function RecentActivity({ displays = [] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const generateActivities = () => {
    const activities = [];
    const sortedDisplays = [...displays].sort((a, b) =>
      new Date(b.updated_at) - new Date(a.updated_at)
    ).slice(0, 5);

    sortedDisplays.forEach((display) => {
      const status = display.status || 'ACTIVE';
      activities.push({
        icon: STATUS_ICONS[status] || STATUS_ICONS.ACTIVE,
        colorKey: STATUS_COLORS[status] || STATUS_COLORS.ACTIVE,
        text: STATUS_LABELS[status] || STATUS_LABELS.ACTIVE,
        detail: `${display.display_id} - ${display.name}`,
        time: getTimeAgo(new Date(display.updated_at)),
      });
    });

    return activities;
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const activities = generateActivities();

  return (
    <Card
      sx={{
        borderRadius: 2,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
            Recent Activity
          </Typography>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            View all
          </Typography>
        </Box>
        <List sx={{ py: 0 }}>
          {activities.length > 0 ? (
            activities.map((activity, index) => {
              const color = theme.palette[activity.colorKey]?.main || theme.palette.success.main;
              return (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    py: 1.5,
                    borderBottom: index < activities.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isDark ? `${color}22` : `${color}15`,
                        color,
                      }}
                    >
                      {activity.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={500} sx={{ color: 'text.primary' }}>
                          {activity.text}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {activity.detail}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })
          ) : (
            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="No recent activity" />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
}
