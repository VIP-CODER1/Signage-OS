import { Chip } from '@mui/material';
import { CheckCircle, Error, Build } from '@mui/icons-material';

const CONFIG = {
  ACTIVE: { color: 'success', icon: <CheckCircle />, label: 'Active' },
  INACTIVE: { color: 'default', icon: <Error />, label: 'Inactive' },
  MAINTENANCE: { color: 'warning', icon: <Build />, label: 'Maintenance' },
};

export default function StatusChip({ status }) {
  const cfg = CONFIG[status] || { color: 'default', icon: null, label: status };
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      color={cfg.color}
      size="small"
      variant="outlined"
      sx={{
        fontWeight: 600,
        fontSize: '0.7rem',
        letterSpacing: '0.02em',
        borderRadius: 1.5,
        height: 26,
        '& .MuiChip-icon': { fontSize: 14 },
      }}
    />
  );
}
