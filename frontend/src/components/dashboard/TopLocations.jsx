import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, LinearProgress, MenuItem, Select, FormControl, useTheme } from '@mui/material';

const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export default function TopLocations({ locations = [], total = 0 }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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
            Top Locations
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              defaultValue="this-month"
              size="small"
              sx={{ fontSize: '0.875rem' }}
            >
              <MenuItem value="this-month">This Month</MenuItem>
              <MenuItem value="last-month">Last Month</MenuItem>
              <MenuItem value="this-year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <List sx={{ py: 0 }}>
          {locations.length > 0 ? (
            locations.map((location, index) => (
              <ListItem
                key={index}
                sx={{
                  px: 0,
                  py: 1.5,
                  borderBottom: index < locations.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ color: 'text.primary' }}>
                        {location.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {location.count} ({location.percentage}%)
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(location.percentage)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: BAR_COLORS[index % BAR_COLORS.length],
                        },
                      }}
                    />
                  }
                />
              </ListItem>
            ))
          ) : (
            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="No locations available" />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
}
