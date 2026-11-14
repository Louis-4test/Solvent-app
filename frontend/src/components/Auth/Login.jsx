import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import authAPI from '../../services/authAPI';
import { saveAuth } from '../../utils/auth';
import { PasswordVisibilityAdornment } from './PasswordInput';
import './Auth.css';

const pageSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  width: '100%',
  p: 2,
  bgcolor: '#edf2f7'
};

const cardSx = {
  maxWidth: 400,
  width: '100%',
  p: { xs: 2.5, sm: 4 },
  boxShadow: 3,
  borderRadius: 2,
  bgcolor: 'background.paper'
};

const primaryButtonSx = {
  py: 1.5,
  bgcolor: '#1a73e8',
  '&:hover': {
    bgcolor: '#1765cc'
  }
};

export default function Login() {
  const { control, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [email, setEmail] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      const response = await authAPI.login({
        identifier: data.identifier.trim(),
        password: data.password
      });

      if (response.mfaRequired) {
        setMfaRequired(true);
        setTempToken(response.tempToken);
        setEmail(response.email);
      } else {
        handleLoginSuccess(response);
      }
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';

      switch (error.code || error.status) {
        case 'INVALID_CREDENTIALS':
        case 401:
          errorMessage = error.message || 'Invalid email/phone or password';
          break;
        case 'UNVERIFIED_ACCOUNT':
          errorMessage = 'Account not verified. Please check your email.';
          break;
        case 'EMAIL_FAILURE':
          errorMessage = 'Failed to send verification email. Please try again later.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);
      console.error('Login error:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (response) => {
    saveAuth(response.token, response.user);
    navigate('/', { replace: true });
  };

  const handleMFAVerify = async (code) => {
    try {
      setLoading(true);
      setError('');

      const response = await authAPI.verifyLoginMFA(code, tempToken);
      handleLoginSuccess(response);
    } catch (error) {
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (mfaRequired) {
    return (
      <Box sx={pageSx}>
        <Box sx={cardSx}>
          <Typography variant="h5" sx={{ mb: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Verify Your Identity
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
            We have sent a 6-digit code to {email ? `your email (${email})` : 'your registered email'}.
            Please enter it below.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (mfaCode.length === 6) handleMFAVerify(mfaCode);
            }}
          >
            <Stack spacing={2}>
              <TextField
                label="Verification Code"
                type="text"
                fullWidth
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoComplete="one-time-code"
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || mfaCode.length !== 6}
                sx={primaryButtonSx}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
            <Button
              type="button"
              size="small"
              onClick={() => setMfaRequired(false)}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Back to Login
            </Button>
            <Button
              type="button"
              size="small"
              onClick={() => authAPI.sendMFACode(email).then(() => {
                setError('');
                alert('New verification code sent!');
              })}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Resend Code
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={pageSx}>
      <Box sx={cardSx}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
          LOGIN
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            <Controller
              name="identifier"
              control={control}
              rules={{
                required: 'Email or phone number is required',
                validate: {
                  validIdentifier: value =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
                    /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(value) ||
                    'Please enter a valid email or phone number'
                }
              }}
              render={({ field: { ref, ...field }, fieldState }) => (
                <TextField
                  {...field}
                  inputRef={ref}
                  label="E-Mail/Phone Number"
                  type="text"
                  fullWidth
                  disabled={loading}
                  autoComplete="username"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              }}
              render={({ field: { ref, ...field }, fieldState }) => (
                <TextField
                  {...field}
                  inputRef={ref}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  disabled={loading}
                  autoComplete="current-password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <PasswordVisibilityAdornment
                          visible={showPassword}
                          onToggle={() => setShowPassword((current) => !current)}
                          disabled={loading}
                        />
                      )
                    }
                  }}
                />
              )}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: -0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Forget password?
              </Typography>
              <Button
                type="button"
                size="small"
                onClick={() => navigate('/forgot-password')}
                disabled={loading}
                sx={{ textTransform: 'none', p: 0, minWidth: 0, fontSize: '0.875rem' }}
              >
                Click here
              </Button>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={primaryButtonSx}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Stack>
        </form>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <Button
            type="button"
            size="small"
            onClick={() => navigate('/register')}
            disabled={loading}
            sx={{ textTransform: 'none', p: 0, minWidth: 0, fontSize: '0.875rem' }}
          >
            Register here
          </Button>
        </Typography>
      </Box>
    </Box>
  );
}
