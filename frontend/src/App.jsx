import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DisplaysPage = lazy(() => import('./pages/DisplaysPage'));
const DisplayDetailPage = lazy(() => import('./pages/DisplayDetailPage'));
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage'));

function SuspenseFallback() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );
}

function ProtectedLayout({ children, showHeader = true }) {
  return (
    <ProtectedRoute>
      <DashboardLayout showHeader={showHeader}>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/displays" replace />} />
        <Route path="/displays" element={<ProtectedLayout><DisplaysPage /></ProtectedLayout>} />
        <Route path="/displays/:id" element={<ProtectedLayout><DisplayDetailPage /></ProtectedLayout>} />
        <Route path="/displays/upload" element={<ProtectedLayout><BulkUploadPage /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
