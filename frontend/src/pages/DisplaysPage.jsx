import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Stack, TablePagination, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Typography, useTheme } from '@mui/material';
import { Add, Devices, Tv, CheckCircle, Warning } from '@mui/icons-material';
import Grid from '@mui/material/Grid';
import {
  fetchDisplays, setSearchQuery, setStatusFilter,
  setCurrentPage, deleteDisplay, createDisplay, updateDisplay,
} from '../redux/slices/displaySlice';
import DisplayTable from '../components/displays/DisplayTable';
import DisplayFormDialog from '../components/displays/DisplayFormDialog';
import ConfirmDeleteDialog from '../components/common/ConfirmDeleteDialog';
import SearchBar from '../components/common/SearchBar';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import AppHeader from '../components/layout/AppHeader';
import GlobeMap from '../components/dashboard/GlobeMap';
import DisplayStatusDonutChart from '../components/dashboard/DisplayStatusDonutChart';
import { useNotification } from '../components/common/NotificationProvider';

const STATUS_OPTIONS = ['', 'ACTIVE', 'INACTIVE', 'MAINTENANCE'];

function GlassCard({ children, delay = 0, sx, ...props }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Card
      sx={{
        height: '100%',
        animation: `slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both`,
        background: isDark
          ? 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5))',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)',
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: isDark
            ? '0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
            : '0 12px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '1px',
          background: isDark
            ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}

export default function DisplaysPage() {
  const dispatch = useDispatch();
  const notify = useNotification();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const {
    items, total, currentPage, limit, searchQuery, statusFilter,
    loading, error,
  } = useSelector((state) => state.displays);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    dispatch(fetchDisplays({
      page: currentPage,
      limit,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
    }));
  }, [dispatch, currentPage, limit, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const active = items.filter((d) => d.status === 'ACTIVE').length;
    const inactive = items.filter((d) => d.status === 'INACTIVE').length;
    const maintenance = items.filter((d) => d.status === 'MAINTENANCE').length;
    return { total: items.length, active, inactive, maintenance };
  }, [items]);

  const handleSearch = useCallback((q) => dispatch(setSearchQuery(q)), [dispatch]);
  const handleStatusFilter = useCallback((s) => dispatch(setStatusFilter(s)), [dispatch]);
  const handlePageChange = useCallback((_, p) => dispatch(setCurrentPage(p + 1)), [dispatch]);

  const handleAdd = () => { setEditingDisplay(null); setDialogOpen(true); setServerError(null); };
  const handleEdit = (d) => { setEditingDisplay(d); setDialogOpen(true); setServerError(null); };

  const handleDialogSave = async (formData) => {
    setSaving(true);
    setServerError(null);
    try {
      const profiles = formData.content_profiles
        ? formData.content_profiles.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const payload = { ...formData, content_profiles: profiles };
      if (editingDisplay) {
        await dispatch(updateDisplay({ id: editingDisplay.id, ...payload })).unwrap();
        notify('Display updated', 'success');
      } else {
        await dispatch(createDisplay(payload)).unwrap();
        notify('Display created', 'success');
      }
      setDialogOpen(false);
      dispatch(fetchDisplays({ page: currentPage, limit }));
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Operation failed';
      setServerError(msg);
      throw { errors: [{ field: 'display_id', message: msg }] };
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteDisplay(deleteTarget.id)).unwrap();
      notify('Display deleted', 'success');
    } catch {
      notify('Failed to delete display', 'error');
    }
    setDeleteTarget(null);
  };

  const showEmpty = !loading && items.length === 0 && !error;
  const hasActiveSearch = searchQuery || statusFilter;
  const hasData = !loading && items.length > 0;

  return (
    <>
      <AppHeader
        title="Displays"
        subtitle={`${total} total displays`}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
            Add Display
          </Button>
        }
      />

      {error && <ErrorAlert message={error} onRetry={() => dispatch(fetchDisplays({ page: currentPage, limit }))} />}

      {hasData && (
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Tv />} label="Total Displays" value={total} color="primary" subtext={`${total} registered`} delay={0} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CheckCircle />} label="Active" value={stats.active} color="success" subtext={`${total > 0 ? Math.round(stats.active / total * 100) : 0}% of total`} delay={0.05} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Warning />} label="Maintenance" value={stats.maintenance} color="warning" subtext="Needs attention" delay={0.1} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Devices />} label="Inactive" value={stats.inactive} color="error" subtext="Offline displays" delay={0.15} />
          </Grid>

          <Grid item xs={12} md={6}>
            <DisplayStatusDonutChart
              data={[
                { value: stats.active, label: 'Active', color: '#22c55e' },
                { value: stats.maintenance, label: 'Maintenance', color: '#f59e0b' },
                { value: stats.inactive, label: 'Inactive', color: '#ef4444' },
              ]}
              total={stats.total}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <GlobeMap delay={0.2} />
          </Grid>
        </Grid>
      )}

      <GlassCard delay={0.3} sx={{ mb: 0 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SearchBar value={searchQuery} onChange={handleSearch} />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status"
                  onChange={(e) => handleStatusFilter(e.target.value)}>
                  {STATUS_OPTIONS.map(s => (
                    <MenuItem key={s} value={s}>{s || 'All'}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          {loading && items.length === 0 ? (
            <LoadingSpinner />
          ) : showEmpty ? (
            <EmptyState
              title={hasActiveSearch ? 'No displays match' : 'No displays yet'}
              description={hasActiveSearch ? 'Try adjusting your search or filters.' : 'Add your first display to get started.'}
              actionLabel={hasActiveSearch ? undefined : 'Add Display'}
              onAction={hasActiveSearch ? undefined : handleAdd}
            />
          ) : (
            <>
              <DisplayTable items={items} loading={loading} onEdit={handleEdit} onDelete={setDeleteTarget} />
              <TablePagination
                component="div"
                count={total}
                page={currentPage - 1}
                onPageChange={handlePageChange}
                rowsPerPage={limit}
                rowsPerPageOptions={[10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </GlassCard>

      <DisplayFormDialog
        open={dialogOpen}
        display={editingDisplay}
        onSave={handleDialogSave}
        onCancel={() => setDialogOpen(false)}
        saving={saving}
        serverError={serverError}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        displayName={deleteTarget?.name || ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
