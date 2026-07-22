import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { Delete } from '@mui/icons-material';

export default function ConfirmDeleteDialog({ open, displayName, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel}
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 600 }}>Delete Display</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete <strong>{displayName}</strong>? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error"
          startIcon={<Delete />} sx={{ borderRadius: 2 }}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
