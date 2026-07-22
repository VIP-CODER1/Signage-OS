import { useRef, useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';

function useCountUp(target, duration = 1200) {
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (typeof target !== 'number') return;
    const startTime = performance.now();
    let rafId;

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * target).toLocaleString());
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return display;
}

const GRADIENT_MAP = {
  primary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  success: 'linear-gradient(135deg, #22c55e, #16a34a)',
  warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
  error: 'linear-gradient(135deg, #ef4444, #dc2626)',
};

export default function StatCard({ icon, label, value, color = 'primary', subtext, delay = 0 }) {
  const animatedValue = useCountUp(typeof value === 'number' ? value : parseInt(value) || 0);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.setProperty('--rx', `${y * -12}deg`);
    cardRef.current.style.setProperty('--ry', `${x * 12}deg`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rx', '0deg');
    cardRef.current.style.setProperty('--ry', '0deg');
  };

  return (
    <Card
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        overflow: 'visible',
        animation: `slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
        animationDelay: `${delay}s`,
        transform: 'perspective(600px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.15s ease, box-shadow 0.3s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: GRADIENT_MAP[color] || GRADIENT_MAP.primary,
        },
        '&:hover': {
          boxShadow: isDark
            ? '0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)'
            : '0 20px 50px rgba(0,0,0,0.08), 0 0 0 1px rgba(99,102,241,0.15)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: -1,
          borderRadius: '15px',
          padding: '1px',
          background: `conic-gradient(from var(--angle, 0deg), transparent 30%, ${theme.palette.primary.main}80, transparent 70%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          opacity: 0,
          transition: 'opacity 0.4s ease',
          animation: 'spin-slow 4s linear infinite',
          '@media (hover: hover)': {
            'div:hover > &': { opacity: 1 },
          },
        }}
        className="glow-border"
      />
      <CardContent
        sx={{
          pl: 3,
          py: 2.5,
          '&:last-child': { pb: 2.5 },
          transform: 'translateZ(20px)',
          position: 'relative',
          zIndex: 1,
          background: isDark
            ? 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent)'
            : 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: GRADIENT_MAP[color] || GRADIENT_MAP.primary,
              color: '#fff',
              fontSize: 22,
              boxShadow: `0 4px 12px ${color === 'primary' ? 'rgba(99,102,241,0.3)' : color === 'success' ? 'rgba(34,197,94,0.3)' : color === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 0.25,
            color: 'text.primary',
            fontVariantNumeric: 'tabular-nums',
            background: GRADIENT_MAP[color],
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {animatedValue}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {label}
        </Typography>
        {subtext && (
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
            {subtext}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
