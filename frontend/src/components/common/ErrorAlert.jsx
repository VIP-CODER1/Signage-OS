import { Alert, Button } from '@mui/material';

export default function ErrorAlert({ message, onRetry, onDismiss, sx }) {
  return (
    <Alert
      severity="error"
      onClose={onDismiss}
      sx={{ mb: 2, ...sx }}
      action={onRetry && (
        <Button color="inherit" size="small" onClick={onRetry}>Retry</Button>
      )}
    >
      {message}
    </Alert>
  );
}
