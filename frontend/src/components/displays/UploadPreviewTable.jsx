import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Chip, Paper, Box, useTheme,
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';

export default function UploadPreviewTable({ rows }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!rows || rows.length === 0) return null;

  const fields = ['display_id', 'name', 'ip_address', 'location', 'status', 'content_profiles'];

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      }}
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Row</TableCell>
              {fields.map(f => <TableCell key={f} sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>{f}</TableCell>)}
              <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Errors</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow
                key={row.row_number}
                sx={{
                  animation: `fadeIn 0.25s ease ${idx * 0.03}s both`,
                  bgcolor: row.is_valid
                    ? (isDark ? 'rgba(52, 199, 89, 0.04)' : 'rgba(52, 199, 89, 0.03)')
                    : (isDark ? 'rgba(255, 59, 48, 0.04)' : 'rgba(255, 59, 48, 0.03)'),
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    bgcolor: row.is_valid
                      ? (isDark ? 'rgba(52, 199, 89, 0.08)' : 'rgba(52, 199, 89, 0.06)')
                      : (isDark ? 'rgba(255, 59, 48, 0.08)' : 'rgba(255, 59, 48, 0.06)'),
                  },
                }}
              >
                <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{row.row_number}</TableCell>
                {fields.map(f => {
                  const val = row.data?.[f];
                  const str = Array.isArray(val) ? val.join(', ') : String(val ?? '');
                  return (
                    <TableCell key={f}>
                      {str ? (
                        <Tooltip title={str.length > 50 ? str : ''}>
                          <span>{str.substring(0, 50)}{str.length > 50 ? '...' : ''}</span>
                        </Tooltip>
                      ) : (
                        <Box component="span" sx={{ color: 'text.disabled' }}>-</Box>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell>
                  {row.errors.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {row.errors.map((e, i) => (
                        <Chip
                          key={i}
                          icon={<Error sx={{ fontSize: 14 }} />}
                          label={`${e.field}: ${e.message}`}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ borderRadius: 1, fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                      <CheckCircle sx={{ fontSize: 16 }} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>No errors</span>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
