import { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function SignalBar({ height, delay, index }) {
  return (
    <Box
      sx={{
        flex: 1,
        height: '100%',
        borderRadius: '3px 3px 0 0',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${height * 100}%`,
          borderRadius: '3px 3px 0 0',
          background: 'linear-gradient(180deg, #818CF8, #6366F1)',
          transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: 'pulse 2.5s ease-in-out infinite',
          animationDelay: `${index * 0.1}s`,
          boxShadow: '0 0 8px rgba(99,102,241,0.3)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          animation: `shimmer 2s ease-in-out infinite ${delay}s`,
        },
      }}
    />
  );
}

const initialSignals = [
  { label: 'Server Uptime', unit: '%', bars: [1, 0.95, 0.98, 1, 0.96, 0.99, 1, 0.97] },
  { label: 'API Latency', unit: 'ms', bars: [0.3, 0.5, 0.2, 0.6, 0.3, 0.4, 0.2, 0.35] },
  { label: 'Data Sync', unit: '%', bars: [0.85, 0.9, 0.82, 0.95, 0.88, 0.92, 0.87, 0.9] },
  { label: 'Cache Hit', unit: '%', bars: [0.9, 0.92, 0.94, 0.91, 0.95, 0.93, 0.96, 0.94] },
];

export default function LiveMonitor() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [signals, setSignals] = useState(initialSignals);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSignals((prev) =>
        prev.map((s) => ({
          ...s,
          bars: s.bars.map(() => randomBetween(0.15, 1)),
          value: s.label === 'API Latency'
            ? `${Math.floor(randomBetween(12, 45))}ms`
            : `${(randomBetween(85, 99.99)).toFixed(1)}%`,
        }))
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        p: 2.5,
        height: '100%',
        animation: 'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both',
        background: isDark
          ? 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(255,255,255,0.01))'
          : 'linear-gradient(135deg, rgba(99,102,241,0.03), rgba(255,255,255,0.5))',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(circle at 30% 70%, rgba(99,102,241,0.04) 0%, transparent 60%)'
            : 'radial-gradient(circle at 30% 70%, rgba(99,102,241,0.03) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box
            sx={{
              width: 8, height: 8, borderRadius: '50%',
              bgcolor: '#22c55e',
              animation: 'pulse 2s ease-in-out infinite',
              boxShadow: '0 0 8px rgba(34,197,94,0.5)',
            }}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Live System Monitor
          </Typography>
          <Box
            component="span"
            sx={{
              ml: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.6875rem',
              color: 'text.disabled',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              px: 1,
              py: 0.3,
              borderRadius: 1,
            }}
          >
            {time}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {signals.map((signal) => {
            const avg = signal.bars.reduce((a, b) => a + b, 0) / signal.bars.length;
            const displayValue = signal.label === 'API Latency'
              ? `${Math.floor(avg * 40 + 10)}ms`
              : `${(avg * 100).toFixed(1)}%`;
            return (
              <Box key={signal.label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 6, height: 6, borderRadius: '50%',
                        bgcolor: avg > 0.5 ? '#22c55e' : avg > 0.3 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {signal.label}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: avg > 0.5 ? 'success.main' : avg > 0.3 ? 'warning.main' : 'error.main',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                    }}
                  >
                    {displayValue}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', height: 22 }}>
                  {signal.bars.map((h, i) => (
                    <SignalBar key={i} height={h} delay={i * 0.1} index={i} />
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
