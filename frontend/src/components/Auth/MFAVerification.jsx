import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import authAPI from '../../services/authAPI';

export default function MFAVerification() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await authAPI.verifyMFA(email, code);
      
      // Store token in localStorage or context
      localStorage.setItem('token', response.token);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('MFA verification failed:', error);
      setError(error.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ /* your styling */ }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Verify Your Identity
      </Typography>
      <Typography sx={{ mb: 3 }}>
        We've sent a 6-digit code to your email. Please enter it below.
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TextField
        label="Verification Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      
      <Button
        variant="contained"
        onClick={handleVerify}
        disabled={loading || !code}
        fullWidth
        sx={{ py: 1.5 }}
      >
        {loading ? 'Verifying...' : 'Verify'}
      </Button>
    </Box>
  );
}