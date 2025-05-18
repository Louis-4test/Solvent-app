import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useState } from 'react';
import authAPI from '../../services/authAPI';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [email, setEmail] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const onSubmit = async (data) => {
    console.log('Submitting login with:', { 
      identifier: data.identifier.trim(), 
      password: data.password 
    });
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
      
      if (error.code === 'INVALID_CREDENTIALS') {
        errorMessage = error.message || 'Invalid email/phone or password';
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please check your credentials.';
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
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    navigate('/', { replace: true });
  };

  const handleLoginError = (error) => {
    let errorMessage = 'Login failed. Please try again.';
    
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        errorMessage = 'Invalid email/phone or password';
        break;
      case 'UNVERIFIED_ACCOUNT':
        errorMessage = 'Account not verified. Please check your email.';
        setUnverifiedEmail(error.response?.data?.email || '');
        break;
      case 'EMAIL_FAILURE':
        errorMessage = 'Failed to send verification email. Please try again later.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    setError(errorMessage);
    console.error('Login error:', error);
  };

  const handleMFAVerify = async (mfaCode) => {
    try {
      setLoading(true);
      setError('');

      const response = await authAPI.verifyLoginMFA(mfaCode, tempToken);
      handleLoginSuccess(response);
    } catch (error) {
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await authAPI.sendVerificationEmail(unverifiedEmail);
      setError('Verification email resent. Please check your inbox.');
    } catch (error) {
      setError('Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  if (mfaRequired) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            maxWidth: 400,
            width: '90%',
            p: 4,
            boxShadow: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
            Verify Your Identity
          </Typography>
          
          <Typography sx={{ mb: 3, textAlign: 'center' }}>
            We've sent a 6-digit code to {email ? `your email (${email})` : 'your registered email'}. 
            Please enter it below.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="Verification Code"
            fullWidth
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 6 }}
            onChange={(e) => {
              if (e.target.value.length === 6) {
                handleMFAVerify(e.target.value);
              }
            }}
          />
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="text"
              onClick={() => setMfaRequired(false)}
              sx={{ mr: 2 }}
              disabled={loading}
            >
              Back to Login
            </Button>
            
            <Button
              variant="text"
              onClick={() => authAPI.sendMFACode(email).then(() => {
                setError('');
                alert('New verification code sent!');
              })}
              disabled={loading}
            >
              Resend Code
            </Button>
          </Box>
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '90%',
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Email or Phone Number"
            {...register('identifier', { 
              required: 'Email or phone number is required',
              validate: {
                validIdentifier: value => 
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 
                  /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(value) ||
                  'Please enter a valid email or phone number'
              }
            })}
            error={!!errors.identifier}
            helperText={errors.identifier?.message}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Password"
            type="password"
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              }
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Box sx={{ textAlign: 'right', mb: 2 }}>
            <Button 
              onClick={() => navigate('/forgot-password')} 
              sx={{ textTransform: 'none' }}
              disabled={loading}
            >
              Forgot password?
            </Button>
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ py: 1.5, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>

          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Don't have an account?{' '}
            <Button 
              onClick={() => navigate('/register')} 
              sx={{ textTransform: 'none' }}
              disabled={loading}
            >
              Register here
            </Button>
          </Typography>
        </form>
      </Box>
    </Box>
  );
}