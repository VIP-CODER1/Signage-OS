import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { SmartToy, AutoFixHigh } from '@mui/icons-material';

function useTypingEffect(text, speed = 35) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return displayed;
}

const INSIGHT_TEXTS = [
  'Analyzing your displays...',
  'Checking for issues...',
  'Optimizing content sync...',
];

export default function AIPanel() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const items = useSelector((s) => s.displays?.items || []);

  const insights = useMemo(() => {
    const inactive = items.filter((d) => d.status === 'INACTIVE').length;
    const maintenance = items.filter((d) => d.status === 'MAINTENANCE').length;
    const ids = items.map((d) => d.display_id);
    const hasDuplicates = ids.length !== new Set(ids).size;
    const lines = [];
    if (inactive > 0) lines.push(`• ${inactive} display${inactive > 1 ? 's' : ''} offline`);
    if (maintenance > 0) lines.push(`• ${maintenance} need${maintenance === 1 ? 's' : ''} maintenance`);
    if (hasDuplicates) lines.push('• Duplicate IDs detected');
    if (lines.length === 0) lines.push('• All systems healthy ✨');
    return lines;
  }, [items]);

  const [insightText, setInsightText] = useState(0);

  useEffect(() => {
    const cycle = setInterval(() => {
      setInsightText((prev) => (prev + 1) % INSIGHT_TEXTS.length);
    }, 4000);
    return () => clearInterval(cycle);
  }, []);

  const typingText = useTypingEffect(INSIGHT_TEXTS[insightText]);

  return (
    <Box sx={{ px: 2, py: 2 }}>
      <Box
        sx={{
          borderRadius: 2.5,
          p: 2,
          position: 'relative',
          overflow: 'hidden',
          background: isDark
            ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))'
            : 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03))',
          border: '1px solid',
          borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: -1,
            borderRadius: 'inherit',
            padding: '1px',
            background: 'conic-gradient(from var(--angle, 0deg), transparent 30%, rgba(99,102,241,0.4), transparent 70%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: 'spin-slow 4s linear infinite',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'float 3s ease-in-out infinite',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}
          >
            <SmartToy sx={{ fontSize: 18, color: '#fff' }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
                AI Assistant
              </Typography>
              <Box
                sx={{
                  px: 0.6,
                  py: 0.15,
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '0.05em',
                  lineHeight: 1.4,
                }}
              >
                BETA
              </Box>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontSize: '0.65rem', fontFamily: 'monospace' }}
            >
              {typingText}
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 4,
                  height: 12,
                  bgcolor: 'primary.main',
                  ml: 0.3,
                  animation: 'pulse 1s step-end infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
            borderRadius: 1.5,
            p: 1.2,
            mb: 1.5,
          }}
        >
          {insights.map((line, i) => (
            <Typography
              key={i}
              variant="caption"
              sx={{
                display: 'block',
                color: line.includes('healthy') ? 'success.main' : line.includes('offline') ? 'error.main' : 'warning.main',
                fontSize: '0.7rem',
                fontWeight: 500,
                lineHeight: 1.8,
                animation: `fadeIn 0.3s ease ${i * 0.1}s both`,
              }}
            >
              {line}
            </Typography>
          ))}
        </Box>

        <Button
          fullWidth
          size="small"
          variant="contained"
          startIcon={<AutoFixHigh sx={{ fontSize: 14 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            borderRadius: 1.5,
            py: 0.6,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            },
          }}
        >
          Fix with AI
        </Button>
      </Box>
    </Box>
  );
}
