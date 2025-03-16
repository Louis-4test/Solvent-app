import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box, Alert } from '@mui/material';
import authAPI from '../../services/authAPI';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      setSuccess(false);

      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset instructions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // Full viewport height
        width: '100vw',  // Full viewport width
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '90%', // Ensures responsiveness
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
          Forgot Password
        </Typography>

        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          Enter your email to receive a password reset link.
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password reset instructions sent to your email.
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{ py: 1.5, mb: 2 }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Remember your password?{' '}
            <Button onClick={() => navigate('/login')} sx={{ textTransform: 'none' }}>
              Go back to Login
            </Button>
          </Typography>
        </form>
      </Box>
    </Box>
  );
}
