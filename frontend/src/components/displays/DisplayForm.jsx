import { useForm } from 'react-hook-form';
import { Box, TextField, MenuItem, Button, Stack, Alert } from '@mui/material';
import { VALID_STATUSES, validateDisplayId, validateDisplayName, validateIpAddress, validateLocation } from '../../utils/validators';

export default function DisplayForm({ display, onSave, onCancel, saving, serverError }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    values: {
      display_id: display?.display_id || '',
      name: display?.name || '',
      ip_address: display?.ip_address || '',
      location: display?.location || '',
      status: display?.status || 'ACTIVE',
      content_profiles: display?.content_profiles?.map(p => p.name).join(', ') || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await onSave(data);
    } catch (err) {
      if (err.errors) {
        err.errors.forEach(e => setError(e.field, { type: 'server', message: e.message }));
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate
      sx={{ animation: 'slideUp 0.3s ease' }}>
      <Stack spacing={2.5} maxWidth={600}>
        {serverError && <Alert severity="error" sx={{ borderRadius: 2 }}>{serverError}</Alert>}
        <TextField label="Display ID" {...register('display_id', { validate: validateDisplayId })}
          error={!!errors.display_id} helperText={errors.display_id?.message} size="small" />
        <TextField label="Name" {...register('name', { validate: validateDisplayName })}
          error={!!errors.name} helperText={errors.name?.message} size="small" />
        <TextField label="IP Address" {...register('ip_address', { validate: validateIpAddress })}
          error={!!errors.ip_address} helperText={errors.ip_address?.message} size="small" />
        <TextField label="Location" {...register('location', { validate: validateLocation })}
          error={!!errors.location} helperText={errors.location?.message} size="small" />
        <TextField label="Status" select {...register('status')} defaultValue="ACTIVE" size="small">
          {VALID_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField label="Content Profiles" {...register('content_profiles')}
          helperText="Comma-separated profile names" size="small" />
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving || isSubmitting}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
