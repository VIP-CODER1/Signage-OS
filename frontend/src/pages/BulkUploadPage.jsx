import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Stepper, Step, StepLabel, Typography, Button, Paper,
  LinearProgress, Alert, Stack, useTheme,
} from '@mui/material';
import { Download, CloudUpload, CheckCircle, Description } from '@mui/icons-material';
import { validateExcelFile, commitBulkUpload, downloadTemplate, clearUploadState } from '../redux/slices/uploadSlice';
import FileDropzone from '../components/displays/FileDropzone';
import UploadPreviewTable from '../components/displays/UploadPreviewTable';
import UploadSummaryPanel from '../components/displays/UploadSummaryPanel';
import AppHeader from '../components/layout/AppHeader';
import { useNotification } from '../components/common/NotificationProvider';

const STEPS = [
  { label: 'Download Template', icon: <Download /> },
  { label: 'Upload File', icon: <CloudUpload /> },
  { label: 'Review & Validate', icon: <Description /> },
  { label: 'Complete', icon: <CheckCircle /> },
];

function GlassPaper({ children, sx, ...props }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 4,
        textAlign: 'center',
        borderRadius: 3,
        animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        background: isDark
          ? 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5))',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)',
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
}

export default function BulkUploadPage() {
  const dispatch = useDispatch();
  const notify = useNotification();
  const { previewData, validationSummary, isValidating, isCommitting, uploadError, commitResult } =
    useSelector((state) => state.upload);

  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  const handleDownload = () => {
    dispatch(downloadTemplate());
    notify('Template downloaded', 'success');
  };

  const handleFileSelect = (file, error) => {
    if (error) {
      setFileError(error);
      setSelectedFile(null);
    } else {
      setFileError(null);
      setSelectedFile(file);
    }
  };

  const handleValidate = () => {
    if (!selectedFile) return;
    dispatch(validateExcelFile(selectedFile));
    setActiveStep(2);
  };

  const handleCommit = () => {
    const validRows = previewData.filter(r => r.is_valid).map(r => r.data);
    dispatch(commitBulkUpload(validRows));
    setActiveStep(3);
  };

  const handleReset = () => {
    dispatch(clearUploadState());
    setSelectedFile(null);
    setFileError(null);
    setActiveStep(0);
  };

  const failedCount = previewData.filter(r => !r.is_valid).length;
  const validCount = previewData.filter(r => r.is_valid).length;

  return (
    <>
      <AppHeader title="Bulk Upload" subtitle="Import displays from an Excel file" />
      <Box maxWidth={960} mx="auto">
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((step, i) => (
            <Step key={step.label}>
              <StepLabel StepIconComponent={() => (
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: i < activeStep ? 'primary.main' : i === activeStep ? 'primary.main' : 'action.disabledBackground',
                    color: i <= activeStep ? '#fff' : 'text.disabled',
                    fontSize: 18,
                    transition: 'all 0.3s ease',
                    boxShadow: i <= activeStep ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                  }}
                >
                  {step.icon}
                </Box>
              )}>
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <GlassPaper>
            <Download sx={{ fontSize: 56, color: 'primary.main', mb: 2, opacity: 0.9 }} />
            <Typography variant="h5" gutterBottom fontWeight={600}>Download Excel Template</Typography>
            <Typography color="text.secondary" mb={3} maxWidth={480} mx="auto">
              Download the template with required columns and validation rules.
              Fill it with your display data and upload in the next step.
            </Typography>
            <Button variant="contained" size="large" startIcon={<Download />} onClick={handleDownload}>
              Download Template
            </Button>
            <Box mt={2}>
              <Button onClick={() => setActiveStep(1)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                I already have a file
              </Button>
            </Box>
          </GlassPaper>
        )}

        {activeStep === 1 && (
          <Box sx={{ animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <FileDropzone selectedFile={selectedFile} onFileSelect={handleFileSelect} error={fileError} />
            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2.5}>
              <Button onClick={() => setActiveStep(0)} sx={{ borderRadius: 2 }}>Back</Button>
              <Button
                variant="contained"
                onClick={handleValidate}
                disabled={!selectedFile || isValidating}
                sx={{ borderRadius: 2, px: 4 }}
              >
                {isValidating ? 'Validating...' : 'Validate'}
              </Button>
            </Stack>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            {isValidating && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
            {uploadError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{uploadError}</Alert>}

            {validationSummary && (
              <UploadSummaryPanel
                summary={validationSummary}
                onCommit={handleCommit}
                isCommitting={isCommitting}
                hasValidRows={validCount > 0}
                failedCount={failedCount}
              />
            )}

            {previewData.length > 0 && (
              <Box mt={2}>
                <UploadPreviewTable rows={previewData} />
              </Box>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
              <Button onClick={() => setActiveStep(1)} sx={{ borderRadius: 2 }}>Back</Button>
              <Button onClick={() => { dispatch(clearUploadState()); setSelectedFile(null); setActiveStep(0); }} sx={{ borderRadius: 2 }}>
                Start Over
              </Button>
            </Stack>
          </Box>
        )}

        {activeStep === 3 && (
          <GlassPaper>
            {isCommitting && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

            {commitResult && (
              <>
                {commitResult.failed === 0 ? (
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                    Successfully imported {commitResult.inserted} displays!
                  </Alert>
                ) : commitResult.inserted > 0 ? (
                  <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    Imported {commitResult.inserted} displays. {commitResult.failed} rows failed.
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    Failed to import any displays. {commitResult.failed} errors.
                  </Alert>
                )}
                <Typography variant="body2" color="text.secondary">
                  {commitResult.inserted} inserted | {commitResult.failed} failed | {commitResult.total} total
                </Typography>
              </>
            )}

            {uploadError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{uploadError}</Alert>}

            <Button variant="contained" onClick={handleReset} sx={{ mt: 2.5, borderRadius: 2, px: 4 }}>
              Upload Another File
            </Button>
          </GlassPaper>
        )}
      </Box>
    </>
  );
}
