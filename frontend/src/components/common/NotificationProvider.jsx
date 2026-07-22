import { Snackbar, Alert } from '@mui/material';
import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  const notify = useCallback((msg, sev = 'success') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionProps={{ timeout: 300 }}
      >
        <Alert
          severity={severity}
          onClose={() => setOpen(false)}
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontWeight: 500,
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}
