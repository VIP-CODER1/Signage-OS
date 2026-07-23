import { useState, useRef } from 'react';
import { Box, Typography, Button, Paper, useTheme } from '@mui/material';
import { CloudUpload, InsertDriveFile } from '@mui/icons-material';

export default function FileDropzone({ selectedFile, onFileSelect, error }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.xlsx')) {
      onFileSelect(null, 'Please select a .xlsx file');
      return;
    }
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      onFileSelect(null, 'File too large. Maximum size is 10 MB.');
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 5,
        textAlign: 'center',
        cursor: 'pointer',
        borderRadius: 3,
        borderStyle: 'dashed',
        borderWidth: 2,
        background: isDark
          ? 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)'
          : 'linear-gradient(135deg, rgba(99,102,241,0.02), transparent)',
        borderColor: error ? 'error.main' : dragOver ? 'primary.main' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: isDark ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.02)',
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? '0 8px 30px rgba(0,0,0,0.2)'
            : '0 8px 30px rgba(0,0,0,0.06)',
        },
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".xlsx" hidden onChange={handleChange} />
      {selectedFile ? (
        <>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              bgcolor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            <InsertDriveFile sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {selectedFile.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {(selectedFile.size / 1024).toFixed(1)} KB — click to change file
          </Typography>
        </>
      ) : (
        <>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              transition: 'all 0.3s ease',
              ...(dragOver && {
                bgcolor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                transform: 'scale(1.1)',
              }),
            }}
          >
            <CloudUpload sx={{ fontSize: 36, color: dragOver ? 'primary.main' : 'text.secondary' }} />
          </Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Drag & drop your file here
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            or click to browse — .xlsx files only
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            sx={{
              borderRadius: 2,
              px: 3,
              '&:hover': { transform: 'translateY(-1px)' },
            }}
          >
            Select File
          </Button>
        </>
      )}
      {error && (
        <Typography color="error" variant="body2" mt={1.5} fontWeight={500}>
          {error}
        </Typography>
      )}
    </Paper>
  );
}
