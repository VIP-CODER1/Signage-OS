export const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

export function validateDisplayId(value) {
  if (!value) return 'Required';
  if (value.length < 3 || value.length > 30) return 'Must be 3-30 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Alphanumeric only (hyphens/underscores allowed)';
  return null;
}

export function validateDisplayName(value) {
  if (!value) return 'Required';
  if (value.length < 2 || value.length > 100) return 'Must be 2-100 characters';
  return null;
}

export function validateIpAddress(value) {
  if (!value) return 'Required';
  const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4.test(value)) return null;
  return 'Invalid IP address format';
}

export function validateLocation(value) {
  if (!value) return 'Required';
  if (value.length < 2 || value.length > 150) return 'Must be 2-150 characters';
  return null;
}
