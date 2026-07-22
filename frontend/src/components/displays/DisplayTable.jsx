import { memo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Skeleton, Paper, useTheme,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import StatusChip from '../common/StatusChip';

const Row = memo(function Row({ item, onEdit, onDelete, index }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <TableRow
      hover
      sx={{
        animation: `slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.04}s both`,
        transition: 'background-color 0.15s ease',
        '&:hover': {
          backgroundColor: isDark ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.03)',
        },
      }}
    >
      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8125rem' }}>{item.display_id}</TableCell>
      <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'text.secondary' }}>{item.ip_address}</TableCell>
      <TableCell sx={{ color: 'text.secondary' }}>{item.location}</TableCell>
      <TableCell><StatusChip status={item.status} /></TableCell>
      <TableCell align="right">
        <IconButton
          onClick={() => onEdit(item)}
          size="small"
          sx={{
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            '&:hover': { color: 'primary.main', bgcolor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)' },
          }}
        >
          <Edit fontSize="small" />
        </IconButton>
        <IconButton
          onClick={() => onDelete(item)}
          size="small"
          sx={{
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            '&:hover': { color: 'error.main', bgcolor: isDark ? 'rgba(255,59,48,0.1)' : 'rgba(255,59,48,0.08)' },
          }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
});

const DisplayTable = memo(function DisplayTable({ items, loading, onEdit, onDelete }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (loading && !items.length) {
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
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Display ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3, 4, 5].map(i => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6].map(j => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        animation: 'slideUp 0.4s ease both',
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Display ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => (
              <Row key={item.id} item={item} index={idx} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
});

export default DisplayTable;
