import { Box, Typography, Button, Chip, CircularProgress, Stack } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Download } from '@mui/icons-material';

export default function UploadSummaryPanel({
  summary, onCommit, onDownloadFailed, isCommitting, hasValidRows, failedCount, isDownloading,
}) {
  if (!summary) return null;

  return (
    <Box textAlign="center" py={3}>
      <Stack direction="row" spacing={1} justifyContent="center" mb={1.5}>
        <Chip icon={<CheckCircle />} label={`${summary.valid_rows} Valid`} color="success" sx={{ fontWeight: 600 }} />
        <Chip icon={<ErrorIcon />} label={`${summary.failed_rows} Failed`} color="error" sx={{ fontWeight: 600 }} />
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {summary.total_rows} total rows
      </Typography>
      <Stack direction="row" spacing={1.5} justifyContent="center">
        <Button
          variant="contained" color="primary" size="large"
          disabled={!hasValidRows || isCommitting}
          onClick={onCommit}
          startIcon={isCommitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
          sx={{ borderRadius: 2 }}
        >
          {isCommitting ? 'Importing...' : `Commit ${summary.valid_rows} Valid Rows`}
        </Button>
        {failedCount > 0 && (
          <Button
            variant="outlined" color="error" size="large"
            onClick={onDownloadFailed}
            disabled={isDownloading}
            startIcon={isDownloading ? <CircularProgress size={16} /> : <Download />}
            sx={{ borderRadius: 2 }}
          >
            {isDownloading ? 'Downloading...' : `Download Failed Rows`}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
