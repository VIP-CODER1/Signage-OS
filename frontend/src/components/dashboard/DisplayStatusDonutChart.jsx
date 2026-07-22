import { Card, CardContent, Typography, Box, MenuItem, Select, FormControl, useTheme } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';

export default function DisplayStatusDonutChart({ data = [], total = 0 }) {
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
            Display Status Overview
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
        <Box sx={{ height: 280, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <PieChart
            series={[
              {
                data,
                innerRadius: 75,
                outerRadius: 110,
                paddingAngle: 2,
                cornerRadius: 4,
              },
            ]}
            colors={data.map((d) => d.color)}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            slotProps={{
              legend: {
                direction: 'column',
                position: { vertical: 'middle', horizontal: 'right' },
                labelStyle: {
                  fontSize: 12,
                  fill: isDark ? '#F5F5F7' : undefined,
                },
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <Typography variant="h3" fontWeight="bold" sx={{ color: 'text.primary' }}>
              {total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
