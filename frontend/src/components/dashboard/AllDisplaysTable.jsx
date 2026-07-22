import { useState } from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, MenuItem, Select, FormControl, IconButton, Pagination, useTheme } from '@mui/material';
import { Search, Visibility, Edit, MoreVert, Refresh } from '@mui/icons-material';

export default function AllDisplaysTable({ displays = [], total = 0, onRefresh }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'MAINTENANCE': return 'warning';
      case 'INACTIVE': return 'error';
      default: return 'default';
    }
  };

  const formatStatus = (status) => status.charAt(0) + status.slice(1).toLowerCase();

  const getTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const filteredDisplays = displays.filter((display) => {
    const matchesSearch =
      display.display_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      display.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      display.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      display.ip_address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || display.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedDisplays = filteredDisplays.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const totalPages = Math.ceil(filteredDisplays.length / rowsPerPage);

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
            All Displays
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search displays..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
            <IconButton size="small" onClick={onRefresh} title="Refresh">
              <Refresh fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Display ID</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Last Seen</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Content Profile</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDisplays.length > 0 ? (
                paginatedDisplays.map((display) => (
                  <TableRow
                    key={display.id}
                    hover
                    sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' } }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{display.display_id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{display.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{display.location}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{display.ip_address}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatus(display.status)}
                        color={getStatusColor(display.status)}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.7rem', borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{getTimeAgo(display.updated_at)}</TableCell>
                    <TableCell>
                      {display.content_profiles && display.content_profiles.length > 0
                        ? display.content_profiles[0].name || 'Assigned'
                        : <Box component="span" sx={{ color: 'text.disabled' }}>None</Box>}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No displays found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {paginatedDisplays.length > 0 ? (page - 1) * rowsPerPage + 1 : 0} to {Math.min(page * rowsPerPage, filteredDisplays.length)} of {filteredDisplays.length} results
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              size="small"
              disabled={totalPages <= 1}
            />
            <FormControl size="small" sx={{ minWidth: 70 }}>
              <Select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(1); }}
                size="small"
              >
                <MenuItem value="5">5/page</MenuItem>
                <MenuItem value="10">10/page</MenuItem>
                <MenuItem value="25">25/page</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
