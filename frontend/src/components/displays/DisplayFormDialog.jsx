import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Stack, Alert, CircularProgress, useTheme,
} from '@mui/material';
import { VALID_STATUSES, validateDisplayId, validateDisplayName, validateIpAddress, validateLocation } from '../../utils/validators';

export default function DisplayFormDialog({ open, display, onSave, onCancel, saving, serverError }) {
  const isEdit = !!display;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
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

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
      transition: 'all 0.2s ease',
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: isDark
            ? 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)',
          boxShadow: isDark
            ? '0 32px 64px rgba(0,0,0,0.4)'
            : '0 32px 64px rgba(0,0,0,0.1)',
          animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem', pb: 1 }}>
        {isEdit ? 'Edit Display' : 'Add Display'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} mt={1}>
          {serverError && <Alert severity="error" sx={{ borderRadius: 2 }}>{serverError}</Alert>}
          <TextField label="Display ID" fullWidth size="small" sx={inputSx}
            {...register('display_id', { validate: validateDisplayId })}
            error={!!errors.display_id} helperText={errors.display_id?.message} />
          <TextField label="Name" fullWidth size="small" sx={inputSx}
            {...register('name', { validate: validateDisplayName })}
            error={!!errors.name} helperText={errors.name?.message} />
          <TextField label="IP Address" fullWidth size="small" sx={inputSx}
            {...register('ip_address', { validate: validateIpAddress })}
            error={!!errors.ip_address} helperText={errors.ip_address?.message} />
          <TextField label="Location" fullWidth size="small" sx={inputSx}
            {...register('location', { validate: validateLocation })}
            error={!!errors.location} helperText={errors.location?.message} />
          <TextField label="Status" select fullWidth size="small" sx={inputSx} {...register('status')} defaultValue="ACTIVE">
            {VALID_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField label="Content Profiles" fullWidth size="small" sx={inputSx} {...register('content_profiles')}
            helperText="Comma-separated profile names" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel} disabled={saving}
          sx={{ borderRadius: 2, '&:hover': { transform: 'translateY(-1px)' } }}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          onClick={handleSubmit(onSubmit)}
          sx={{
            borderRadius: 2,
            px: 4,
            '&:hover': { transform: 'translateY(-1px)' },
          }}
        >
          {saving ? <CircularProgress size={20} /> : isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
