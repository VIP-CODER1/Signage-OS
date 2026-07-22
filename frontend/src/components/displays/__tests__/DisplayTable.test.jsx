import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import DisplayTable from '../DisplayTable';

const mockItems = [
  {
    id: '1', display_id: 'DSP-001', name: 'Main Entrance',
    ip_address: '192.168.1.50', location: 'Floor 1',
    status: 'ACTIVE',
  },
  {
    id: '2', display_id: 'DSP-002', name: 'Exit Sign',
    ip_address: '192.168.1.51', location: 'Floor 2',
    status: 'INACTIVE',
  },
];

test('renders table rows', () => {
  render(
    <ThemeProvider theme={createTheme()}>
      <DisplayTable items={mockItems} onEdit={() => {}} onDelete={() => {}} />
    </ThemeProvider>
  );
  expect(screen.getByText('DSP-001')).toBeInTheDocument();
  expect(screen.getByText('Main Entrance')).toBeInTheDocument();
  expect(screen.getByText('ACTIVE')).toBeInTheDocument();
});

test('shows skeletons when loading with no items', () => {
  const { container } = render(
    <ThemeProvider theme={createTheme()}>
      <DisplayTable items={[]} loading={true} onEdit={() => {}} onDelete={() => {}} />
    </ThemeProvider>
  );
  expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
});
