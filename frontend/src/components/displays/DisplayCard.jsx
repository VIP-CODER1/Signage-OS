import { Card, CardContent, Stack, Typography, Divider } from '@mui/material';
import StatusChip from '../common/StatusChip';

export default function DisplayCard({ display }) {
  if (!display) return null;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{display.name}</Typography>
            <StatusChip status={display.status} />
          </Stack>
          <Divider />
          <Typography><strong>Display ID:</strong> {display.display_id}</Typography>
          <Typography><strong>IP Address:</strong> {display.ip_address}</Typography>
          <Typography><strong>Location:</strong> {display.location}</Typography>
          <Typography><strong>Content Profiles:</strong>{' '}
            {display.content_profiles?.map(p => p.name).join(', ') || 'None'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(display.created_at).toLocaleString()}
            {display.updated_at && ` | Updated: ${new Date(display.updated_at).toLocaleString()}`}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
