import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, useTheme } from '@mui/material';

const CITIES = [
  'New York', 'London', 'Tokyo', 'Sydney', 'Dubai', 'Singapore', 'Paris',
  'Mumbai', 'Delhi', 'Bangalore', 'San Francisco', 'Berlin',
];
const PIN_COLORS = ['#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6'];

function GlobeNode({ city, index, color, top, left }) {
  return (
    <Box
      sx={{
        position: 'absolute', top: `${top}%`, left: `${left}%`,
        transform: 'translate(-50%, -50%)',
        animation: `float 3.5s ease-in-out infinite`,
        animationDelay: `${index * 0.12}s`,
        zIndex: 10,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: '#fff', fontWeight: 700, fontSize: '0.5rem', mb: 0.3,
            whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            bgcolor: 'rgba(0,0,0,0.5)', px: 0.4, py: 0.1, borderRadius: 0.5,
            backdropFilter: 'blur(4px)',
          }}
        >
          {city}
        </Typography>
        <Box
          sx={{
            width: 7, height: 7, borderRadius: '50%', bgcolor: color,
            boxShadow: `0 0 0 2px ${color}55, 0 0 12px ${color}88`,
            animation: 'pulse 2s ease-in-out infinite',
            animationDelay: `${index * 0.12}s`,
            position: 'relative',
            '&::before': {
              content: '""', position: 'absolute', inset: -4,
              borderRadius: '50%', border: '1px solid', borderColor: color,
              opacity: 0.35, animation: `scaleIn 1.5s ease-out infinite ${index * 0.12 + 0.3}s`,
            },
            '&::after': {
              content: '""', position: 'absolute', inset: -8,
              borderRadius: '50%', border: '1px solid', borderColor: color,
              opacity: 0.15, animation: `scaleIn 2s ease-out infinite ${index * 0.12 + 0.8}s`,
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default function GlobeMap() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const items = useSelector((s) => s.displays?.items || []);

  const cities = useMemo(() => {
    const locs = [...new Set(items.map((d) => d.location).filter(Boolean))];
    const citySet = new Set(locs);
    const extras = CITIES.filter((c) => !citySet.has(c));
    return [...locs, ...extras].slice(0, 7);
  }, [items]);

  const longitudes = [0, 30, 60, 90, 120, 150];
  const latitudes = [30, 60, 120, 150];

  const nodePositions = useMemo(() => {
    return cities.map((_, i) => ({
      top: 18 + Math.sin(i * 1.2) * 30 + 10,
      left: 50 + Math.cos(i * 1.2) * 34,
    }));
  }, [cities]);

  return (
    <Box
      sx={{
        borderRadius: 2, border: '1px solid', borderColor: 'divider',
        p: 1.5, height: '100%', maxWidth: 300,
        animation: 'slideUp 0.5s 0.15s both',
        background: isDark
          ? 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(99,102,241,0.03))'
          : 'linear-gradient(135deg, rgba(6,182,212,0.03), rgba(99,102,241,0.02))',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#06b6d4', boxShadow: '0 0 8px rgba(6,182,212,0.6)', animation: 'pulse 2s ease-in-out infinite' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>Global Network</Typography>
        <Box component="span" sx={{ px: 0.5, py: 0.1, borderRadius: 0.6, bgcolor: isDark ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.06)', color: '#06b6d4', fontSize: '0.5rem', fontWeight: 600 }}>3D</Box>
      </Box>

      <Box
        sx={{
          position: 'relative', width: '100%', maxWidth: 180, mx: 'auto', aspectRatio: '1',
          perspective: '600px',
        }}
      >
        <Box
          sx={{
            width: '100%', height: '100%', position: 'relative',
            transformStyle: 'preserve-3d',
            borderRadius: '50%',
            overflow: 'hidden',
            background: isDark
              ? 'radial-gradient(circle at 35% 25%, rgba(6,182,212,0.25) 0%, rgba(99,102,241,0.1) 30%, #0a0a0f 80%)'
              : 'radial-gradient(circle at 35% 25%, rgba(6,182,212,0.2) 0%, rgba(99,102,241,0.08) 30%, #0d0d12 80%)',
          }}
        >
          <Box sx={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 20%, rgba(6,182,212,0.15) 0%, transparent 50%)',
            zIndex: 1,
          }} />
          <Box sx={{
            position: 'absolute', inset: -1, borderRadius: '50%',
            border: '1.5px solid', borderColor: 'rgba(6,182,212,0.3)',
            boxShadow: '0 0 12px rgba(6,182,212,0.15)',
            zIndex: 1,
          }} />

          {longitudes.map((deg) => (
            <Box key={`lon-${deg}`} sx={{
              position: 'absolute', inset: '0%', borderRadius: '50%',
              border: '1px solid rgba(6,182,212,0.35)',
              transform: `rotateY(${deg}deg)`,
              transformStyle: 'preserve-3d',
              opacity: deg === 90 ? 0.25 : deg > 90 ? 0.12 : 0.4,
            }} />
          ))}

          {latitudes.map((deg) => (
            <Box key={`lat-${deg}`} sx={{
              position: 'absolute', inset: `${Math.abs(deg - 90) * 0.55}%`,
              borderRadius: '50%',
              border: '1px solid rgba(99,102,241,0.25)',
              transform: `rotateX(${deg < 90 ? deg : 180 - deg}deg)`,
              transformStyle: 'preserve-3d',
              opacity: 0.3,
            }} />
          ))}

          {cities.map((city, i) => {
            const color = PIN_COLORS[i % PIN_COLORS.length];
            return (
              <GlobeNode
                key={city + i} city={city} index={i}
                color={color}
                top={nodePositions[i].top}
                left={nodePositions[i].left}
              />
            );
          })}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 2, justifyContent: 'center' }}>
        {cities.map((city, i) => {
          const color = PIN_COLORS[i % PIN_COLORS.length];
          return (
            <Box key={city + i} sx={{ display: 'flex', alignItems: 'center', gap: 0.3, bgcolor: isDark ? `${color}12` : `${color}08`, px: 0.6, py: 0.15, borderRadius: 0.8, animation: `fadeIn 0.3s ease ${i * 0.08}s both` }}>
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.5rem', fontWeight: 500 }}>{city}</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
