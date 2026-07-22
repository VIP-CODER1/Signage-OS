import { Box, CircularProgress } from '@mui/material';

export default function LoadingSpinner({ overlay = false }) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center"
      minHeight={overlay ? '100%' : 200}>
      <CircularProgress />
    </Box>
  );
}
