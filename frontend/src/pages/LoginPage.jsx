import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, FormControlLabel, Checkbox, Link, Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, Tv, PersonAdd, Login } from '@mui/icons-material';
import { loginAdmin, registerAdmin, clearAuthError } from '../redux/slices/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/displays', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => { dispatch(clearAuthError()); }, [dispatch]);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setLocalError(null);
    dispatch(clearAuthError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError(null);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return;
      }
      dispatch(registerAdmin({ email, password }));
    } else {
      dispatch(loginAdmin({ email, password }));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          top: '-200px',
          right: '-200px',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          bottom: '-100px',
          left: '-100px',
        },
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: 400,
          p: 4,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          animation: 'scaleIn 0.3s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box textAlign="center" mb={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <Tv sx={{ fontSize: 40, color: '#667eea' }} />
            <Typography variant="h5" fontWeight={700} color="#1D1D1F">
              Signage OS
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={700} color="#86868B" mt={1}>
            {isSignUp ? 'Create your account' : 'Login to your account'}
          </Typography>
        </Box>

        {(error || localError) && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {localError || error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
          size="medium"
          sx={{ mt: '19px', mb: 2 }}
        />

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          size="medium"
          sx={{ mb: isSignUp ? 2 : 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {isSignUp && (
          <TextField
            fullWidth
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            size="medium"
            sx={{ mb: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}

        {!isSignUp && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <FormControlLabel
              control={<Checkbox size="small" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
              label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
            />
            <Link href="#" variant="body2" color="text.secondary" underline="hover"
              onClick={(e) => { e.preventDefault(); }}>
              Forgot password?
            </Link>
          </Box>
        )}

        {isSignUp && <Box mb={3} />}

        <Button
          fullWidth
          variant="contained"
          type="submit"
          size="large"
          disabled={loading}
          startIcon={isSignUp ? <PersonAdd /> : <Login />}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '0.9375rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4195 100%)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.45)',
            },
          }}
        >
          {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : isSignUp ? 'Sign Up' : 'Login'}
        </Button>

        <Divider sx={{ my: 2.5 }}>
          <Typography variant="caption" color="text.disabled">OR</Typography>
        </Divider>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          {isSignUp ? (
            <>Already have an account?{' '}
              <Link href="#" underline="hover" fontWeight={600}
                onClick={(e) => { e.preventDefault(); toggleMode(); }}>
                Login
              </Link>
            </>
          ) : (
            <>New to Signage OS?{' '}
              <Link href="#" underline="hover" fontWeight={600}
                onClick={(e) => { e.preventDefault(); toggleMode(); }}>
                Create an account
              </Link>
            </>
          )}
        </Typography>
      </Box>
    </Box>
  );
}
