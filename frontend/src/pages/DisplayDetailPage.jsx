import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Stack, Typography, Card, CardContent, Divider, Chip } from '@mui/material';
import { ArrowBack, Edit, Delete } from '@mui/icons-material';
import { fetchDisplayById, updateDisplay, deleteDisplay } from '../redux/slices/displaySlice';
import DisplayForm from '../components/displays/DisplayForm';
import ConfirmDeleteDialog from '../components/common/ConfirmDeleteDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import StatusChip from '../components/common/StatusChip';
import AppHeader from '../components/layout/AppHeader';
import { useNotification } from '../components/common/NotificationProvider';

export default function DisplayDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notify = useNotification();
  const { selectedDisplay, loading, error } = useSelector((state) => state.displays);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchDisplayById(id));
  }, [dispatch, id]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const profiles = formData.content_profiles
        ? formData.content_profiles.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      await dispatch(updateDisplay({ id, ...formData, content_profiles: profiles })).unwrap();
      notify('Display updated', 'success');
      setIsEditing(false);
    } catch (err) {
      notify(typeof err === 'string' ? err : 'Failed to update display', 'error');
      throw { errors: [{ field: 'display_id', message: typeof err === 'string' ? err : 'Update failed' }] };
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteDisplay(id)).unwrap();
      notify('Display deleted', 'success');
      navigate('/displays');
    } catch {
      notify('Failed to delete display', 'error');
    }
    setShowDeleteConfirm(false);
  };

  if (loading && !selectedDisplay) return <LoadingSpinner />;

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/displays')} sx={{ color: 'text.secondary' }}>
          Back
        </Button>
      </Stack>

      {selectedDisplay && (
        <AppHeader
          title={selectedDisplay.name}
          subtitle={`Display ID: ${selectedDisplay.display_id}`}
          actions={
            !isEditing && (
              <>
                <Button startIcon={<Edit />} variant="outlined" onClick={() => setIsEditing(true)} sx={{ mr: 1 }}>
                  Edit
                </Button>
                <Button startIcon={<Delete />} variant="outlined" color="error" onClick={() => setShowDeleteConfirm(true)}>
                  Delete
                </Button>
              </>
            )
          }
        />
      )}

      {error && <ErrorAlert message={error} onRetry={() => dispatch(fetchDisplayById(id))} sx={{ mb: 2 }} />}

      {!selectedDisplay && !loading ? (
        <Typography>Display not found.</Typography>
      ) : isEditing ? (
        <DisplayForm
          display={selectedDisplay}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          saving={saving}
        />
      ) : (
        selectedDisplay && (
          <Card sx={{ animation: 'slideUp 0.3s ease' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5">{selectedDisplay.name}</Typography>
                  <StatusChip status={selectedDisplay.status} />
                </Stack>
                <Divider />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Display ID</Typography>
                    <Typography variant="body1">{selectedDisplay.display_id}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>IP Address</Typography>
                    <Typography variant="body1">{selectedDisplay.ip_address}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Location</Typography>
                    <Typography variant="body1">{selectedDisplay.location}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Status</Typography>
                    <StatusChip status={selectedDisplay.status} />
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Content Profiles</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {selectedDisplay.content_profiles?.length > 0
                      ? selectedDisplay.content_profiles.map((p) => (
                          <Chip key={p._id || p.name} label={p.name} size="small" variant="outlined" />
                        ))
                      : <Typography variant="body2" color="text.secondary">None assigned</Typography>}
                  </Stack>
                </Box>
                <Divider />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Created</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(selectedDisplay.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  {selectedDisplay.updated_at && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Last Updated</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(selectedDisplay.updated_at).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )
      )}

      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        displayName={selectedDisplay?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
