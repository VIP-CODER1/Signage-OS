import { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert, useTheme } from '@mui/material';
import SignageKPI from '../components/dashboard/SignageKPI';
import DisplayStatusDonutChart from '../components/dashboard/DisplayStatusDonutChart';
import TopLocations from '../components/dashboard/TopLocations';
import AllDisplaysTable from '../components/dashboard/AllDisplaysTable';
import GlobeMap from '../components/dashboard/GlobeMap';
import AppHeader from '../components/layout/AppHeader';
import { displayService } from '../services/displayService';

export default function DashboardPage() {
  const theme = useTheme();
  const [displays, setDisplays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await displayService.getDisplays(1, 100, '', '');
      setDisplays(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = displays.length;
    const active = displays.filter(d => d.status === 'ACTIVE').length;
    const maintenance = displays.filter(d => d.status === 'MAINTENANCE').length;
    const inactive = displays.filter(d => d.status === 'INACTIVE').length;
    const uniqueLocations = new Set(displays.map(d => d.location)).size;
    return { total, active, maintenance, inactive, locations: uniqueLocations };
  };

  const stats = calculateStats();

  const calculateLocationDistribution = () => {
    const locationCounts = {};
    displays.forEach(display => {
      locationCounts[display.location] = (locationCounts[display.location] || 0) + 1;
    });
    return Object.entries(locationCounts)
      .map(([name, count]) => ({
        name, count,
        percentage: ((count / displays.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const locationData = calculateLocationDistribution();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const kpiData = [
    { title: 'Total Displays', value: stats.total.toString(), change: '+0%', type: 'total' },
    { title: 'Active Displays', value: stats.active.toString(), change: '+0%', type: 'active' },
    { title: 'Maintenance', value: stats.maintenance.toString(), change: '+0%', type: 'maintenance' },
    { title: 'Inactive Displays', value: stats.inactive.toString(), change: '+0%', type: 'inactive' },
    { title: 'Locations', value: stats.locations.toString(), type: 'locations', subtitle: 'Across all sites' },
  ];

  const statusData = [
    { value: stats.active, label: 'Active', color: theme.palette.success.main },
    { value: stats.maintenance, label: 'Maintenance', color: theme.palette.warning.main },
    { value: stats.inactive, label: 'Inactive', color: theme.palette.error.main },
  ].filter(d => d.value > 0);

  return (
    <>
      <AppHeader
        title="Dashboard"
        subtitle="Welcome back, Admin!"
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <SignageKPI {...kpi} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={4}>
          <DisplayStatusDonutChart data={statusData} total={stats.total} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TopLocations locations={locationData} total={stats.total} />
        </Grid>
        <Grid item xs={12} md={4}>
          <GlobeMap />
        </Grid>
      </Grid>
      <AllDisplaysTable displays={displays} total={stats.total} onRefresh={fetchDashboardData} />
    </>
  );
}
